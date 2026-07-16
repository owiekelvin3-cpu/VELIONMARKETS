import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { RefreshCw, TrendingDown, TrendingUp, Wallet } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { useTradingMarket } from "@/hooks/useTradingMarket";
import { useWatchlistTickers } from "@/hooks/useWatchlistTickers";
import { supabase } from "@/lib/supabase";
import { isKycApproved, formatTransactionError } from "@/lib/kyc";
import { KycRequiredGate } from "@/components/dashboard/KycRequiredGate";
import {
  TRADING_PAIRS,
  formatPrice,
  formatVolume,
  type MarketInterval,
} from "@/lib/market-api";
import { TradingChart } from "@/components/trading/TradingChart";
import { OrderPanel, type OrderSubmitPayload } from "@/components/trading/OrderPanel";
import { PositionsPanel, type PositionRow } from "@/components/trading/PositionsPanel";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/utils";
import { ensureValidSession } from "@/lib/auth-session";
import { cn } from "@/lib/utils";
import type { Holding, Trade } from "@/types/database";

const INTERVALS: { id: MarketInterval; labelKey: string }[] = [
  { id: "1m", labelKey: "trading.tf1m" },
  { id: "5m", labelKey: "trading.tf5m" },
  { id: "15m", labelKey: "trading.tf15m" },
  { id: "1h", labelKey: "trading.tf1h" },
  { id: "4h", labelKey: "trading.tf4h" },
  { id: "1d", labelKey: "trading.tf1d" },
];

function baseFromTradeAsset(asset: string) {
  return asset.split("/")[0]?.toUpperCase() ?? asset.toUpperCase();
}

/** Average cost of remaining inventory (weighted, sell reduces cost proportionally). */
function avgEntryForAsset(asset: string, trades: Trade[]) {
  const ordered = [...trades]
    .filter((tr) => baseFromTradeAsset(tr.asset) === asset && (tr.status === "completed" || tr.status === "approved"))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let qty = 0;
  let cost = 0;
  for (const tr of ordered) {
    if (tr.type === "buy") {
      cost += tr.amount * tr.price;
      qty += tr.amount;
    } else if (qty > 0) {
      const avg = cost / qty;
      const sellQty = Math.min(tr.amount, qty);
      cost -= sellQty * avg;
      qty -= sellQty;
    }
  }
  return qty > 0 ? cost / qty : 0;
}

export default function TradingRoomPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [chartInterval, setChartInterval] = useState<MarketInterval>("15m");
  const [balance, setBalance] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [closingAsset, setClosingAsset] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);

  const pair = TRADING_PAIRS.find((p) => p.symbol === symbol) ?? TRADING_PAIRS[0];
  const { ticker, candles, loading, error, refresh } = useTradingMarket(symbol, chartInterval);
  const { tickers: watchlist, refresh: refreshWatchlist } = useWatchlistTickers();

  const loadAccount = useCallback(async () => {
    if (!user) return;
    const [balRes, holdRes, tradeRes] = await Promise.all([
      supabase.from("balances").select("amount").eq("user_id", user.id).single(),
      supabase.from("holdings").select("*").eq("user_id", user.id).order("asset"),
      supabase.from("trades").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setBalance(balRes.data?.amount ?? 0);
    setHoldings(holdRes.data ?? []);
    setTrades(tradeRes.data ?? []);
  }, [user]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const holdingQty = useMemo(() => {
    const row = holdings.find((h) => h.asset === pair.base);
    return row?.quantity ?? 0;
  }, [holdings, pair.base]);

  const historyTrades = useMemo(
    () => trades.filter((tr) => tr.status === "completed" || tr.status === "approved" || tr.status === "rejected"),
    [trades]
  );

  const positions: PositionRow[] = useMemo(() => {
    return holdings
      .filter((h) => h.quantity > 0)
      .map((h) => {
        const pairMeta = TRADING_PAIRS.find((p) => p.base === h.asset);
        const symbolKey = pairMeta?.symbol ?? `${h.asset}USDT`;
        const mark =
          (symbolKey === symbol ? ticker?.lastPrice : undefined) ??
          watchlist[symbolKey]?.lastPrice ??
          0;
        const avgEntry = avgEntryForAsset(h.asset, trades);
        const marketValue = h.quantity * mark;
        const cost = h.quantity * avgEntry;
        const unrealizedPnl = avgEntry > 0 && mark > 0 ? marketValue - cost : 0;
        const unrealizedPct = cost > 0 ? (unrealizedPnl / cost) * 100 : 0;
        return {
          holding: h,
          pairLabel: pairMeta?.label ?? `${h.asset}/USDT`,
          symbol: symbolKey,
          markPrice: mark,
          avgEntry,
          marketValue,
          unrealizedPnl,
          unrealizedPct,
        };
      });
  }, [holdings, trades, ticker, watchlist, symbol]);

  const placeTrade = async (side: "buy" | "sell", quantity: number, price: number) => {
    if (!user) return false;
    if (!isKycApproved(profile)) {
      setMessage(t("kyc.required"));
      setMessageOk(false);
      return false;
    }
    if (quantity <= 0 || price <= 0) return false;

    setSubmitting(true);
    setMessage("");
    setMessageOk(false);
    await ensureValidSession();

    const { error: err } = await supabase.from("trades").insert({
      user_id: user.id,
      asset: pair.label,
      type: side,
      amount: quantity,
      price,
      status: "completed",
    });

    if (err) {
      const insufficientHoldings = /holdings/i.test(err.message);
      setMessage(
        formatTransactionError(
          err,
          err.message.includes("Insufficient")
            ? insufficientHoldings
              ? t("trading.insufficientHoldings")
              : t("trading.insufficientBalance")
            : err.message,
          t("kyc.required")
        )
      );
      setMessageOk(false);
      setSubmitting(false);
      return false;
    }

    const notional = quantity * price;
    setMessage(
      side === "buy"
        ? t("trading.orderFilledBuy", {
            pair: pair.label,
            qty: quantity.toFixed(6),
            amount: formatCurrency(notional),
          })
        : t("trading.orderFilledSell", {
            pair: pair.label,
            qty: quantity.toFixed(6),
            amount: formatCurrency(notional),
          })
    );
    setMessageOk(true);
    await loadAccount();
    setSubmitting(false);
    return true;
  };

  const handleOrder = async (payload: OrderSubmitPayload) => {
    if (!ticker) return;
    if (payload.side === "buy") {
      const qty = payload.amountUsd / ticker.lastPrice;
      await placeTrade("buy", qty, ticker.lastPrice);
      return;
    }
    await placeTrade("sell", payload.quantity, ticker.lastPrice);
  };

  const handleClose = async (asset: string, quantity: number) => {
    const pairMeta = TRADING_PAIRS.find((p) => p.base === asset);
    if (!pairMeta || !user) return;

    const mark =
      (pairMeta.symbol === symbol ? ticker?.lastPrice : undefined) ??
      watchlist[pairMeta.symbol]?.lastPrice ??
      0;
    if (mark <= 0) {
      setMessage(t("trading.priceUnavailable"));
      setMessageOk(false);
      return;
    }

    // Switch chart to that pair so order uses consistent pair label
    if (symbol !== pairMeta.symbol) setSymbol(pairMeta.symbol);

    setClosingAsset(asset);
    setSubmitting(true);
    setMessage("");
    await ensureValidSession();

    if (!isKycApproved(profile)) {
      setMessage(t("kyc.required"));
      setMessageOk(false);
      setClosingAsset(null);
      setSubmitting(false);
      return;
    }

    const { error: err } = await supabase.from("trades").insert({
      user_id: user.id,
      asset: pairMeta.label,
      type: "sell",
      amount: quantity,
      price: mark,
      status: "completed",
    });

    if (err) {
      setMessage(
        formatTransactionError(
          err,
          /holdings/i.test(err.message) ? t("trading.insufficientHoldings") : err.message,
          t("kyc.required")
        )
      );
      setMessageOk(false);
    } else {
      setMessage(
        t("trading.orderFilledSell", {
          pair: pairMeta.label,
          qty: quantity.toFixed(6),
          amount: formatCurrency(quantity * mark),
        })
      );
      setMessageOk(true);
      await loadAccount();
    }
    setClosingAsset(null);
    setSubmitting(false);
  };

  const changePct = ticker?.priceChangePercent ?? 0;
  const isUp = changePct >= 0;

  const onRefreshAll = () => {
    refresh();
    refreshWatchlist();
    loadAccount();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t("trading.live")}
        title={t("trading.title")}
        subtitle={t("trading.subtitleDesk")}
        actions={
          <>
            <div className="surface-muted px-3 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                {t("trading.tradingBalance")}
              </p>
              <p className="font-display text-base font-semibold text-foreground">
                {formatCurrency(balance)}
              </p>
            </div>
            {balance < 25 && (
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard/deposits">
                  <Wallet className="h-3.5 w-3.5" />
                  {t("trading.addFunds")}
                </Link>
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={onRefreshAll} aria-label={t("trading.refresh")}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </>
        }
      />

      {/* Watchlist */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {TRADING_PAIRS.map((p) => {
            const tk = watchlist[p.symbol];
            const pct = tk?.priceChangePercent ?? 0;
            const up = pct >= 0;
            const active = symbol === p.symbol;
            return (
              <button
                key={p.symbol}
                type="button"
                onClick={() => setSymbol(p.symbol)}
                className={cn(
                  "min-w-[132px] shrink-0 border-r border-border px-3.5 py-3 text-left transition-colors last:border-r-0",
                  active ? "bg-secondary/80" : "hover:bg-secondary/40"
                )}
              >
                <p className={cn("text-xs font-semibold", active ? "text-foreground" : "text-muted")}>
                  {p.label}
                </p>
                <p className="mt-1 font-display text-sm font-semibold text-foreground">
                  {tk ? `$${formatPrice(tk.lastPrice, p.symbol)}` : "—"}
                </p>
                <p className={cn("mt-0.5 text-[11px] font-medium", up ? "text-emerald" : "text-red-400")}>
                  {tk ? `${up ? "+" : ""}${pct.toFixed(2)}%` : "—"}
                </p>
              </button>
            );
          })}
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
        <p
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            messageOk
              ? "border-emerald/30 bg-emerald/10 text-emerald"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
          )}
        >
          {message}
        </p>
      )}

      {/* Desk: chart + order ticket */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-display text-lg font-semibold text-foreground">{pair.label}</h2>
              <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {ticker ? `$${formatPrice(ticker.lastPrice, symbol)}` : "—"}
              </span>
              {ticker && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-sm font-semibold",
                    isUp ? "text-emerald" : "text-red-400"
                  )}
                >
                  {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {isUp ? "+" : ""}
                  {ticker.priceChangePercent.toFixed(2)}%
                </span>
              )}
            </div>
            {ticker && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                <span>
                  {t("trading.high")}: ${formatPrice(ticker.highPrice, symbol)}
                </span>
                <span>
                  {t("trading.low")}: ${formatPrice(ticker.lowPrice, symbol)}
                </span>
                <span>
                  {t("trading.volume")}: {formatVolume(ticker.quoteVolume)} USDT
                </span>
                <span className="text-emerald">{t("trading.open247")}</span>
              </div>
            )}
          </div>
          <div className="inline-flex gap-0.5 self-start rounded-lg border border-border bg-secondary/40 p-0.5 sm:self-auto">
            {INTERVALS.map((iv) => (
              <button
                key={iv.id}
                type="button"
                onClick={() => setChartInterval(iv.id)}
                className={cn(
                  "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  chartInterval === iv.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                )}
              >
                {t(iv.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_320px]">
          <TradingChart
            candles={candles}
            symbol={symbol}
            lastPrice={ticker?.lastPrice}
            loading={loading}
          />
          <div className="border-t border-border xl:border-t-0">
            <KycRequiredGate compact>
              <OrderPanel
                symbol={symbol}
                pairLabel={pair.label}
                baseAsset={pair.base}
                price={ticker?.lastPrice ?? 0}
                balance={balance}
                holdingQty={holdingQty}
                loading={submitting}
                onSubmit={handleOrder}
              />
            </KycRequiredGate>
          </div>
        </div>

        <PositionsPanel
          positions={positions}
          historyTrades={historyTrades}
          closingAsset={closingAsset}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
