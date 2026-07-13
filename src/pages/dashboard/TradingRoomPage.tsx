import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { RefreshCw, TrendingDown, TrendingUp, Wallet, Activity } from "@/lib/icons";
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
import { PageHeader } from "@/components/ui/page-header";
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
  const isSuccessMsg = message === t("trading.orderPlaced");

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("trading.live")}
        title={t("trading.title")}
        subtitle={t("trading.subtitle")}
        actions={
          <>
            <div className="surface-muted px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{t("trading.tradingBalance")}</p>
              <p className="font-display text-base font-semibold text-foreground">{formatCurrency(balance)}</p>
            </div>
            {balance < 25 && (
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard/deposits">
                  <Wallet className="h-3.5 w-3.5" />
                  {t("trading.addFunds")}
                </Link>
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={refresh} aria-label={t("trading.refresh")}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </>
        }
      />

      <div className="surface-panel p-3 md:p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{t("trading.selectPair")}</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {TRADING_PAIRS.map((p) => (
                <button
                  key={p.symbol}
                  type="button"
                  onClick={() => setSymbol(p.symbol)}
                  className={cn(
                    "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    symbol === p.symbol
                      ? "border-border bg-secondary text-foreground"
                      : "border-transparent text-muted hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="shrink-0">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{t("trading.timeframe")}</p>
            <div className="inline-flex gap-0.5 rounded-lg border border-border bg-secondary/40 p-0.5">
              {INTERVALS.map((iv) => (
                <button
                  key={iv}
                  type="button"
                  onClick={() => setChartInterval(iv)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    chartInterval === iv
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {iv}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="surface-panel p-4 md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">{pair.label}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {ticker ? `$${formatPrice(ticker.lastPrice, symbol)}` : "—"}
              </span>
              {ticker && (
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-semibold",
                  isUp ? "bg-emerald/10 text-emerald" : "bg-red-500/10 text-red-400"
                )}>
                  {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {isUp ? "+" : ""}{ticker.priceChangePercent.toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2">
            {[
              { label: t("trading.high"), value: ticker ? `$${formatPrice(ticker.highPrice, symbol)}` : "—" },
              { label: t("trading.low"), value: ticker ? `$${formatPrice(ticker.lowPrice, symbol)}` : "—" },
              { label: t("trading.volume"), value: ticker ? formatVolume(ticker.quoteVolume) : "—" },
              { label: t("trading.status"), value: loading ? "…" : t("trading.open247") },
            ].map((item) => (
              <div key={item.label} className="surface-muted px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted">{item.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            {t("trading.retry")}
          </Button>
        </div>
      )}

      {message && (
        <p className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          isSuccessMsg
            ? "border-emerald/30 bg-emerald/10 text-emerald"
            : "border-amber-500/30 bg-amber-500/10 text-amber-300"
        )}>{message}</p>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Activity className="h-3.5 w-3.5" />
            {t("trading.chartLabel", { pair: pair.label, interval: chartInterval })}
          </div>
          <TradingChart candles={candles} symbol={symbol} loading={loading} />
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <OrderPanel
            symbol={symbol}
            pairLabel={pair.label}
            price={ticker?.lastPrice ?? 0}
            balance={balance}
            loading={submitting}
            onSubmit={handleOrder}
          />
        </div>
      </div>

      <PositionsPanel openTrades={openTrades} historyTrades={historyTrades} />
    </div>
  );
}
