import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, TrendingDown, TrendingUp } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { useTradingMarket } from "@/hooks/useTradingMarket";
import { supabase } from "@/lib/supabase";
import {
  TRADING_PAIRS,
  formatPrice,
  formatVolume,
  type MarketInterval,
} from "@/lib/market-api";
import { TradingChart } from "@/components/trading/TradingChart";
import { OrderPanel } from "@/components/trading/OrderPanel";
import { PositionsPanel } from "@/components/trading/PositionsPanel";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ensureValidSession } from "@/lib/auth-session";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/database";

const INTERVALS: MarketInterval[] = ["1m", "30m", "1h", "4h", "1d"];

export default function TradingRoomPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [chartInterval, setChartInterval] = useState<MarketInterval>("1h");
  const [balance, setBalance] = useState(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const pair = TRADING_PAIRS.find((p) => p.symbol === symbol) ?? TRADING_PAIRS[0];
  const { ticker, candles, loading, error, refresh } = useTradingMarket(symbol, chartInterval);

  const loadAccount = useCallback(async () => {
    if (!user) return;
    const [balRes, tradeRes] = await Promise.all([
      supabase.from("balances").select("amount").eq("user_id", user.id).single(),
      supabase.from("trades").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setBalance(balRes.data?.amount ?? 0);
    setTrades(tradeRes.data ?? []);
  }, [user]);

  useEffect(() => { loadAccount(); }, [loadAccount]);

  const openTrades = trades.filter((tr) => tr.status === "pending" || tr.status === "approved");
  const historyTrades = trades.filter((tr) => tr.status === "completed" || tr.status === "rejected");

  const handleOrder = async (side: "buy" | "sell", amountUsd: number) => {
    if (!user || !ticker) return;
    if (side === "buy" && amountUsd > balance) {
      setMessage(t("trading.insufficientBalance"));
      return;
    }
    setSubmitting(true);
    setMessage("");
    await ensureValidSession();
    const qty = amountUsd / ticker.lastPrice;
    const { error: err } = await supabase.from("trades").insert({
      user_id: user.id,
      asset: pair.label,
      type: side,
      amount: qty,
      price: ticker.lastPrice,
      status: "pending",
    });
    if (err) {
      setMessage(err.message.includes("Insufficient") ? t("trading.insufficientBalance") : err.message);
    } else {
      setMessage(t("trading.orderPlaced"));
      loadAccount();
    }
    setSubmitting(false);
  };

  const changePct = ticker?.priceChangePercent ?? 0;
  const isUp = changePct >= 0;

  return (
    <div className="-mx-4 space-y-4 md:-mx-6 lg:-mx-8">
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("trading.title")}</h1>
          <p className="text-sm text-muted">{t("trading.subtitle")}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-right">
            <p className="text-xs text-muted">{t("trading.tradingBalance")}</p>
            <p className="font-display text-lg font-bold text-emerald">{formatCurrency(balance)}</p>
          </div>
          <Button variant="outline" size="icon" onClick={refresh} className="shrink-0 border-white/10">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Pair + interval selectors */}
      <div className="flex flex-wrap items-center gap-3 px-4 md:px-6 lg:px-8">
        <select
          value="crypto"
          className="select-input h-10 w-32"
          aria-label="Asset category"
        >
          <option value="crypto">{t("trading.crypto")}</option>
        </select>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="select-input h-10 w-36"
        >
          {TRADING_PAIRS.map((p) => (
            <option key={p.symbol} value={p.symbol}>{p.label}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              type="button"
              onClick={() => setChartInterval(iv)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                chartInterval === iv
                  ? "bg-emerald/10 text-emerald ring-1 ring-emerald/20"
                  : "text-muted hover:bg-white/[0.04]"
              )}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>

      {/* Live metrics bar */}
      <div className="mx-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-3 lg:mx-6 lg:grid-cols-6 xl:mx-8">
        {[
          { label: t("trading.livePrice"), value: ticker ? `$${formatPrice(ticker.lastPrice, symbol)}` : "—" },
          {
            label: t("trading.change"),
            value: ticker ? `${isUp ? "+" : ""}${ticker.priceChangePercent.toFixed(2)}%` : "—",
            className: ticker ? (isUp ? "text-emerald" : "text-red-400") : undefined,
            icon: ticker ? (isUp ? TrendingUp : TrendingDown) : undefined,
          },
          { label: t("trading.high"), value: ticker ? `$${formatPrice(ticker.highPrice, symbol)}` : "—" },
          { label: t("trading.low"), value: ticker ? `$${formatPrice(ticker.lowPrice, symbol)}` : "—" },
          { label: t("trading.volume"), value: ticker ? formatVolume(ticker.quoteVolume) : "—" },
          { label: t("trading.status"), value: loading ? "…" : t("trading.open247") },
        ].map((item) => (
            <div key={item.label} className="bg-[#0a0a0c] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-muted">{item.label}</p>
              <p className={cn("mt-0.5 flex items-center gap-1 font-display text-sm font-semibold", item.className)}>
                {item.icon && <item.icon className="h-3.5 w-3.5" />}
                {item.value}
              </p>
            </div>
          ))}
      </div>

      {error && (
        <div className="mx-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 md:mx-6 lg:mx-8">
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={refresh} className="border-red-500/30 text-red-300">
            {t("trading.retry")}
          </Button>
        </div>
      )}
      {message && (
        <p className={cn(
          "px-4 text-sm md:px-6 lg:px-8",
          message === t("trading.orderPlaced") ? "text-emerald" : "text-amber-400"
        )}>{message}</p>
      )}

      {/* Chart + order panel */}
      <div className="grid gap-4 px-4 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="space-y-3">
          {ticker && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">{pair.label.replace("/", " / ")}</p>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <span className="font-display text-3xl font-bold text-foreground">
                  {formatPrice(ticker.lastPrice, symbol)}
                </span>
                <span className="text-sm text-muted">USDT</span>
                <span className={cn("text-sm font-semibold", isUp ? "text-emerald" : "text-red-400")}>
                  {isUp ? "+" : ""}{ticker.priceChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
          <TradingChart candles={candles} symbol={symbol} loading={loading} />
        </div>

        <OrderPanel
          symbol={symbol}
          pairLabel={pair.label}
          price={ticker?.lastPrice ?? 0}
          balance={balance}
          loading={submitting}
          onSubmit={handleOrder}
        />
      </div>

      {/* Positions */}
      <div className="px-4 pb-4 lg:px-8">
        <PositionsPanel openTrades={openTrades} historyTrades={historyTrades} />
      </div>
    </div>
  );
}
