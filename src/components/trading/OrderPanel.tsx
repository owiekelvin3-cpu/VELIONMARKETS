import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/market-api";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface OrderPanelProps {
  symbol: string;
  pairLabel: string;
  price: number;
  balance: number;
  loading: boolean;
  onSubmit: (side: "buy" | "sell", amountUsd: number) => void;
}

const QUICK_AMOUNTS = [25, 50, 75, 100];

export function OrderPanel({ symbol, pairLabel, price, balance, loading, onSubmit }: OrderPanelProps) {
  const { t } = useTranslation();
  const [amountUsd, setAmountUsd] = useState("");
  const [confirmSide, setConfirmSide] = useState<"buy" | "sell" | null>(null);

  const usd = parseFloat(amountUsd) || 0;
  const assetQty = price > 0 ? usd / price : 0;
  const baseAsset = pairLabel.split("/")[0];
  const canTrade = usd > 0 && price > 0 && !loading;
  const needsFunds = balance <= 0;
  const exceedsBalance = usd > balance;

  const handleQuick = (pct: number) => {
    if (balance <= 0) return;
    setAmountUsd(((balance * pct) / 100).toFixed(2));
    setConfirmSide(null);
  };

  const requestSubmit = (side: "buy" | "sell") => {
    if (!canTrade || exceedsBalance) return;
    setConfirmSide(side);
  };

  const confirmSubmit = () => {
    if (!confirmSide || !canTrade || exceedsBalance) return;
    onSubmit(confirmSide, usd);
    setConfirmSide(null);
  };

  return (
    <div className="flex flex-col overflow-hidden surface-panel">
      <div className="border-b border-border px-4 py-3.5">
        <p className="font-display text-sm font-semibold text-foreground">{t("trading.placeOrder")}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t("trading.orderHint")}</p>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm">
          <span className="text-muted">{t("trading.balance")}</span>
          <span className="font-semibold text-foreground">{formatCurrency(balance)}</span>
        </div>

        {needsFunds ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-center">
            <p className="text-sm text-muted">{t("trading.needBalance")}</p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/dashboard/deposits">
                <Wallet className="h-3.5 w-3.5" />
                {t("trading.addFunds")}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="trade-amount" className="text-xs font-medium text-muted">
                {t("trading.amountUsd")}
              </Label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">
                  $
                </span>
                <Input
                  id="trade-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amountUsd}
                  onChange={(e) => {
                    setAmountUsd(e.target.value);
                    setConfirmSide(null);
                  }}
                  className="h-12 pl-7 text-lg font-semibold"
                />
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {QUICK_AMOUNTS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuick(pct)}
                    className="rounded-lg border border-border bg-secondary/40 py-2 text-xs font-medium text-muted transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              {exceedsBalance && usd > 0 && (
                <p className="mt-2 text-xs text-amber-400">{t("trading.insufficientBalance")}</p>
              )}
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted">{t("trading.youTrade")}</span>
                <span className="font-medium text-foreground">{pairLabel}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">{t("trading.livePrice")}</span>
                <span className="font-medium text-foreground">
                  {price > 0 ? `$${formatPrice(price, symbol)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-2">
                <span className="text-muted">{t("trading.youGet")}</span>
                <span className="font-semibold text-foreground">
                  {usd > 0 && price > 0 ? `≈ ${assetQty.toFixed(6)} ${baseAsset}` : "—"}
                </span>
              </div>
            </div>

            {confirmSide ? (
              <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-3">
                <p className="text-sm text-foreground">
                  {t("trading.confirmPrompt", {
                    side: confirmSide === "buy" ? t("trading.buy") : t("trading.sell"),
                    amount: formatCurrency(usd),
                    pair: pairLabel,
                  })}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setConfirmSide(null)} disabled={loading}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    className={cn(
                      confirmSide === "buy" && "bg-emerald hover:bg-emerald-glow",
                      confirmSide === "sell" && "bg-red-500 text-white hover:bg-red-600"
                    )}
                    variant={confirmSide === "sell" ? "destructive" : "default"}
                    onClick={confirmSubmit}
                    disabled={loading}
                  >
                    {loading ? t("common.loading") : t("trading.confirmOrder")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="h-12 bg-emerald font-semibold hover:bg-emerald-glow"
                  disabled={!canTrade || exceedsBalance}
                  onClick={() => requestSubmit("buy")}
                >
                  {t("trading.buy")}
                </Button>
                <Button
                  variant="destructive"
                  className="h-12 font-semibold"
                  disabled={!canTrade || exceedsBalance}
                  onClick={() => requestSubmit("sell")}
                >
                  {t("trading.sell")}
                </Button>
              </div>
            )}

            <p className="text-center text-[11px] leading-relaxed text-muted">
              {t("trading.simpleFlow")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
