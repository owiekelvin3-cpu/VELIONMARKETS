export type MarketInterval = "1m" | "30m" | "1h" | "4h" | "1d";

export interface TradingPair {
  symbol: string;
  label: string;
  category: "crypto";
}

export const TRADING_PAIRS: TradingPair[] = [
  { symbol: "BTCUSDT", label: "BTC/USD", category: "crypto" },
  { symbol: "ETHUSDT", label: "ETH/USD", category: "crypto" },
  { symbol: "BNBUSDT", label: "BNB/USD", category: "crypto" },
  { symbol: "SOLUSDT", label: "SOL/USD", category: "crypto" },
  { symbol: "XRPUSDT", label: "XRP/USD", category: "crypto" },
  { symbol: "DOGEUSDT", label: "DOGE/USD", category: "crypto" },
];

export interface Ticker24h {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Dev proxy first, then Binance public market-data endpoint (works in more regions). */
const REST_BASES = ["/api/market", "https://data-api.binance.vision/api/v3"];
const WS_BASE = "wss://data-stream.binance.vision/ws";

async function fetchJson<T>(path: string): Promise<T> {
  let lastError: Error | null = null;

  for (const base of REST_BASES) {
    try {
      const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(12_000) });
      if (!res.ok) throw new Error(`Market API error: ${res.status}`);
      return (await res.json()) as T;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error("Market data unavailable");
}

interface BinanceRestTicker {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

interface BinanceWsTicker {
  e: "24hrTicker";
  s: string;
  p: string;
  P: string;
  c: string;
  h: string;
  l: string;
  v: string;
  q: string;
}

interface BinanceKline extends Array<string | number> {}

function parseRestTicker(data: BinanceRestTicker): Ticker24h {
  return {
    symbol: data.symbol,
    lastPrice: parseFloat(data.lastPrice),
    priceChange: parseFloat(data.priceChange),
    priceChangePercent: parseFloat(data.priceChangePercent),
    highPrice: parseFloat(data.highPrice),
    lowPrice: parseFloat(data.lowPrice),
    volume: parseFloat(data.volume),
    quoteVolume: parseFloat(data.quoteVolume),
  };
}

function parseWsTicker(data: BinanceWsTicker): Ticker24h {
  return {
    symbol: data.s,
    lastPrice: parseFloat(data.c),
    priceChange: parseFloat(data.p),
    priceChangePercent: parseFloat(data.P),
    highPrice: parseFloat(data.h),
    lowPrice: parseFloat(data.l),
    volume: parseFloat(data.v),
    quoteVolume: parseFloat(data.q),
  };
}

export async function fetchTicker24h(symbol: string): Promise<Ticker24h> {
  const data = await fetchJson<BinanceRestTicker>(`/ticker/24hr?symbol=${symbol}`);
  return parseRestTicker(data);
}

export async function fetchKlines(symbol: string, interval: MarketInterval, limit = 200): Promise<Candle[]> {
  const data = await fetchJson<BinanceKline[]>(
    `/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  return data.map((k) => ({
    time: Math.floor(Number(k[0]) / 1000),
    open: parseFloat(String(k[1])),
    high: parseFloat(String(k[2])),
    low: parseFloat(String(k[3])),
    close: parseFloat(String(k[4])),
    volume: parseFloat(String(k[5])),
  }));
}

export function subscribeTicker(symbol: string, onUpdate: (ticker: Ticker24h) => void) {
  const stream = `${symbol.toLowerCase()}@ticker`;
  let ws: WebSocket | null = null;
  let closed = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    ws = new WebSocket(`${WS_BASE}/${stream}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as BinanceWsTicker | BinanceRestTicker;
        if ("e" in data && data.e === "24hrTicker") {
          onUpdate(parseWsTicker(data));
        } else if ("lastPrice" in data) {
          onUpdate(parseRestTicker(data));
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      if (!closed) {
        retryTimer = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  };

  connect();

  return () => {
    closed = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
  };
}

export function subscribeKline(
  symbol: string,
  interval: MarketInterval,
  onUpdate: (candle: Candle) => void
) {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  let ws: WebSocket | null = null;
  let closed = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    ws = new WebSocket(`${WS_BASE}/${stream}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          e: string;
          k: { t: number; o: string; h: string; l: string; c: string; v: string };
        };
        if (msg.e !== "kline") return;
        const k = msg.k;
        onUpdate({
          time: Math.floor(k.t / 1000),
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
        });
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      if (!closed) retryTimer = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws?.close();
  };

  connect();

  return () => {
    closed = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
  };
}

export function formatPrice(price: number, symbol: string) {
  if (!Number.isFinite(price)) return "—";
  if (symbol.startsWith("BTC") || symbol.startsWith("ETH")) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price < 1) return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function formatVolume(vol: number) {
  if (!Number.isFinite(vol)) return "—";
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)}K`;
  return vol.toFixed(2);
}
