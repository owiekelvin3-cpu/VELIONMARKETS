import { useCallback, useEffect, useState } from "react";
import {
  TRADING_PAIRS,
  fetchTickers24h,
  subscribeTickers,
  type Ticker24h,
} from "@/lib/market-api";

export function useWatchlistTickers() {
  const [tickers, setTickers] = useState<Record<string, Ticker24h>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await fetchTickers24h(TRADING_PAIRS.map((p) => p.symbol));
      const next: Record<string, Ticker24h> = {};
      for (const t of list) next[t.symbol] = t;
      setTickers(next);
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const symbols = TRADING_PAIRS.map((p) => p.symbol);
    return subscribeTickers(symbols, (t) => {
      setTickers((prev) => ({ ...prev, [t.symbol]: t }));
    });
  }, []);

  return { tickers, loading, refresh };
}
