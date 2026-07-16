import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/market-api";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type OrderSubmitPayload =
  | { side: "buy"; amountUsd: number }
  | { side: "sell"; quantity: number };

interface OrderPanelProps {
  symbol: string;
  pairLabel: string;
  baseAsset: string;
  price: number;
  balance: number;
  holdingQty: number;
  loading: boolean;
  onSubmit: (payload: OrderSubmitPayload) => void;
}

const PCTS = [25, 50, 75, 100];

export function OrderPanel({
  symbol,
  pairLabel,
  baseAsset,
  price,
  balance,
  holdingQty,
  loading,
  onSubmit,
}: OrderPanelProps) {
  const { t } = useTranslation();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amountUsd, setAmountUsd] = useState("");
  const [quantity, setQuantity] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setAmountUsd("");
    setQuantity("");
    setConfirming(false);
  }, [pairLabel, side]);

  const usd = parseFloat(amountUsd) || 0;
  const qty = parseFloat(quantity) || 0;
  const buyQty = price > 0 ? usd / price : 0;
  const sellUsd = qty * price;

  const buyOk = side === "buy" && usd > 0 && price > 0 && usd <= balance && !loading;
  const sellOk = side === "sell" && qty > 0 && price > 0 && qty <= holdingQty + 1e-12 && !loading;
  const canTrade = buyOk || sellOk;
  const needsFunds = side === "buy" && balance <= 0;
  const needsHoldings = side === "sell" && holdingQty <= 0;

  const applyBuyPct = (pct: number) => {
    if (balance <= 0) return;
    setAmountUsd(((balance * pct) / 100).toFixed(2));
    setConfirming(false);
  };

  const applySellPct = (pct: number) => {
    if (holdingQty <= 0) return;
    const q = (holdingQty * pct) / 100;
    setQuantity(q.toFixed(8).replace(/\.?0+$/, ""));
    setConfirming(false);
  };

  const requestSubmit = () => {
    if (!canTrade) return;
    setConfirming(true);
  };

  const confirmSubmit = () => {
    if (!canTrade) return;
    if (side === "buy") onSubmit({ side: "buy", amountUsd: usd });
    else onSubmit({ side: "sell", quantity: qty });
    setConfirming(false);
    setAmountUsd("");
    setQuantity("");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden border-l border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("trading.spotOrder")}</p>
        <p className="mt-0.5 font-display text-sm font-semibold text-foreground">{pairLabel}</p>
      </div>

      <div className="grid grid-cols-2 border-b border-border">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={cn(
            "py-2.5 text-sm font-semibold transition-colors",
            side === "buy"
              ? "bg-emerald/15 text-emerald"
              : "text-muted hover:bg-secondary/50 hover:text-foreground"
          )}
        >
          {t("trading.buy")}
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={cn(
            "py-2.5 text-sm font-semibold transition-colors",
            side === "sell"
              ? "bg-red-500/15 text-red-400"
              : "text-muted hover:bg-secondary/50 hover:text-foreground"
          )}
        >
          {t("trading.sell")}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-muted">{t("trading.availableCash")}</span>
            <span className="font-medium text-foreground">{formatCurrency(balance)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">{t("trading.availableAsset", { asset: baseAsset })}</span>
            <span className="font-medium text-foreground">{holdingQty > 0 ? holdingQty.toFixed(6) : "0"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">{t("trading.markPrice")}</span>
            <span className="font-medium text-foreground">
              {price > 0 ? `$${formatPrice(price, symbol)}` : "—"}
            </span>
          </div>
        </div>

        {needsFunds ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-center">
            <p className="text-sm text-muted">{t("trading.needBalance")}</p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/dashboard/deposits">
                <Wallet className="h-3.5 w-3.5" />
                {t("trading.addFunds")}
              </Link>
            </Button>
          </div>
        ) : needsHoldings ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-center">
            <p className="text-sm text-muted">{t("trading.needHoldings", { asset: baseAsset })}</p>
            <Button size="sm" className="mt-3" variant="outline" onClick={() => setSide("buy")}>
              {t("trading.buyFirst")}
            </Button>
          </div>
        ) : (
          <>
            {side === "buy" ? (
              <div>
                <Label htmlFor="trade-usd" className="text-xs font-medium text-muted">
                  {t("trading.amountUsd")}
                </Label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                    $
                  </span>
                  <Input
                    id="trade-usd"
                    type="number"
                    min="1"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amountUsd}
                    onChange={(e) => {
                      setAmountUsd(e.target.value);
                      setConfirming(false);
                    }}
                    className="h-11 pl-7 text-base font-semibold"
                  />
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {PCTS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applyBuyPct(pct)}
                      className="rounded-md border border-border bg-secondary/40 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                {usd > balance && (
                  <p className="mt-2 text-xs text-amber-400">{t("trading.insufficientBalance")}</p>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="trade-qty" className="text-xs font-medium text-muted">
                  {t("trading.amountAsset", { asset: baseAsset })}
                </Label>
                <Input
                  id="trade-qty"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.000000"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setConfirming(false);
                  }}
                  className="mt-2 h-11 text-base font-semibold"
                />
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {PCTS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applySellPct(pct)}
                      className="rounded-md border border-border bg-secondary/40 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                {qty > holdingQty && (
                  <p className="mt-2 text-xs text-amber-400">{t("trading.insufficientHoldings")}</p>
                )}
              </div>
            )}

            <div className="space-y-2 rounded-lg border border-border bg-secondary/25 px-3 py-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted">{t("trading.estFill")}</span>
                <span className="font-medium text-foreground">
                  {side === "buy"
                    ? usd > 0 && price > 0
                      ? `≈ ${buyQty.toFixed(6)} ${baseAsset}`
                      : "—"
                    : qty > 0 && price > 0
                      ? `≈ ${formatCurrency(sellUsd)}`
                      : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-xs">
                <span className="text-muted">{t("trading.orderType")}</span>
                <span className="text-foreground">{t("trading.marketOrder")}</span>
              </div>
            </div>

            {confirming ? (
              <div className="space-y-3 rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-sm text-foreground">
                  {side === "buy"
                    ? t("trading.confirmBuy", {
                        amount: formatCurrency(usd),
                        qty: buyQty.toFixed(6),
                        asset: baseAsset,
                        pair: pairLabel,
                      })
                    : t("trading.confirmSell", {
                        qty: qty.toFixed(6),
                        asset: baseAsset,
                        amount: formatCurrency(sellUsd),
                        pair: pairLabel,
                      })}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setConfirming(false)} disabled={loading}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    className={cn(
                      side === "buy" && "bg-emerald hover:bg-emerald-glow",
                      side === "sell" && "bg-red-500 text-white hover:bg-red-600"
                    )}
                    variant={side === "sell" ? "destructive" : "default"}
                    onClick={confirmSubmit}
                    disabled={loading}
                  >
                    {loading ? t("common.loading") : t("trading.confirmOrder")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className={cn(
                  "h-11 w-full font-semibold",
                  side === "buy" && "bg-emerald hover:bg-emerald-glow",
                  side === "sell" && "bg-red-500 text-white hover:bg-red-600"
                )}
                variant={side === "sell" ? "destructive" : "default"}
                disabled={!canTrade}
                onClick={requestSubmit}
              >
                {side === "buy" ? t("trading.buyMarket") : t("trading.sellMarket")}
              </Button>
            )}

            <p className="text-center text-[11px] leading-relaxed text-muted">
              {t("trading.fillHint")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
