import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchTicker24h,
  fetchKlines,
  subscribeTicker,
  subscribeKline,
  type Ticker24h,
  type Candle,
  type MarketInterval,
} from "@/lib/market-api";

function mergeCandle(candles: Candle[], candle: Candle): Candle[] {
  if (candles.length === 0) return [candle];
  const last = candles[candles.length - 1];
  if (last.time === candle.time) {
    return [...candles.slice(0, -1), candle];
  }
  if (candle.time > last.time) {
    return [...candles, candle].slice(-200);
  }
  return candles;
}

export function useTradingMarket(symbol: string, interval: MarketInterval) {
  const [ticker, setTicker] = useState<Ticker24h | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoad = useRef(true);

  const refresh = useCallback(async () => {
    if (initialLoad.current) setLoading(true);
    setError(null);
    try {
      const [t, k] = await Promise.all([
        fetchTicker24h(symbol),
        fetchKlines(symbol, interval),
      ]);
      setTicker(t);
      setCandles(k);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load market data");
    } finally {
      setLoading(false);
      initialLoad.current = false;
    }
  }, [symbol, interval]);

  useEffect(() => {
    initialLoad.current = true;
    setCandles([]);
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = subscribeTicker(symbol, (t) => {
      setTicker((prev) => (Number.isFinite(t.lastPrice) ? t : prev));
    });
    return unsubscribe;
  }, [symbol]);

  useEffect(() => {
    const unsubscribe = subscribeKline(symbol, interval, (candle) => {
      setCandles((prev) => mergeCandle(prev, candle));
    });
    return unsubscribe;
  }, [symbol, interval]);

  return { ticker, candles, loading, error, refresh };
}
