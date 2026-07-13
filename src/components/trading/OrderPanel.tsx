import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/market-api";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface OrderPanelProps {
  symbol: string;
  pairLabel: string;
  price: number;
  balance: number;
  loading: boolean;
  onSubmit: (side: "buy" | "sell", amountUsd: number) => void;
}

const LEVERAGE_OPTIONS = ["1x", "2x", "5x", "10x", "25x"];
const QUICK_AMOUNTS = [25, 50, 75, 100];

export function OrderPanel({ symbol, pairLabel, price, balance, loading, onSubmit }: OrderPanelProps) {
  const { t } = useTranslation();
  const [amountUsd, setAmountUsd] = useState("100");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [tradeMode, setTradeMode] = useState<"spot" | "timed">("spot");
  const [leverage, setLeverage] = useState("10x");
  const [stopLoss, setStopLoss] = useState(false);
  const [takeProfit, setTakeProfit] = useState(false);

  const usd = parseFloat(amountUsd) || 0;
  const assetQty = price > 0 ? usd / price : 0;
  const leverageNum = parseInt(leverage, 10) || 1;
  const marginRequired = usd / leverageNum;
  const positionSize = usd * leverageNum;
  const baseAsset = pairLabel.split("/")[0];

  const handleQuick = (pct: number) => {
    setAmountUsd(((balance * pct) / 100).toFixed(2));
  };

  const submit = (side: "buy" | "sell") => {
    if (usd <= 0) return;
    onSubmit(side, usd);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-secondary/50">
      <div className="border-b border-border bg-secondary/50 px-4 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{t("trading.placeOrder")}</p>
        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "market" | "limit")}>
          <TabsList className="mb-3 grid h-10 w-full grid-cols-2 rounded-xl bg-secondary p-1">
            <TabsTrigger value="market" className="rounded-lg text-xs">{t("trading.marketOrder")}</TabsTrigger>
            <TabsTrigger value="limit" className="rounded-lg text-xs">{t("trading.limitOrder")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid grid-cols-2 gap-2">
          {(["spot", "timed"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTradeMode(mode)}
              className={cn(
                "rounded-xl border py-2.5 text-xs font-medium transition-all",
                tradeMode === mode
                  ? "border-emerald/40 bg-emerald/10 text-emerald"
                  : "border-border bg-secondary/50 text-muted hover:border-border"
              )}
            >
              {mode === "spot" ? t("trading.spotTrade") : t("trading.timedTrade")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <Label htmlFor="amount" className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("trading.amountUsd")}
          </Label>
          <Input
            id="amount"
            type="number"
            min="1"
            step="0.01"
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
            className="mt-2 h-12 text-center text-lg font-bold"
          />
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {QUICK_AMOUNTS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleQuick(pct)}
                className="rounded-lg border border-border bg-secondary/60 py-2 text-xs font-medium text-muted transition-colors hover:border-emerald/30 hover:text-emerald"
              >
                {pct}%
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            ≈ {assetQty.toFixed(6)} {baseAsset}
          </p>
        </div>

        <div>
          <Label htmlFor="leverage" className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("trading.leverage")}
          </Label>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {LEVERAGE_OPTIONS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLeverage(l)}
                className={cn(
                  "rounded-lg border py-2 text-xs font-medium transition-colors",
                  leverage === l
                    ? "border-emerald/40 bg-emerald/10 text-emerald"
                    : "border-border text-muted hover:border-border"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setStopLoss((v) => !v)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left text-xs transition-colors",
              stopLoss ? "border-emerald/40 bg-emerald/10 text-emerald" : "border-border text-muted"
            )}
          >
            {t("trading.stopLoss")}
          </button>
          <button
            type="button"
            onClick={() => setTakeProfit((v) => !v)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left text-xs transition-colors",
              takeProfit ? "border-emerald/40 bg-emerald/10 text-emerald" : "border-border text-muted"
            )}
          >
            {t("trading.takeProfit")}
          </button>
        </div>

        <div className="space-y-2 rounded-xl border border-border bg-secondary/80 p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">{t("trading.balance")}</span>
            <span className="font-medium text-emerald">{formatCurrency(balance)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t("trading.marginRequired")}</span>
            <span className="font-medium">{formatCurrency(marginRequired)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t("trading.positionSize")}</span>
            <span className="font-medium">{formatCurrency(positionSize)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-muted">{t("trading.livePrice")}</span>
            <span className="font-semibold text-emerald">${formatPrice(price, symbol)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border bg-secondary/50 p-4">
        <Button
          className="h-12 bg-emerald font-semibold hover:bg-emerald/90"
          disabled={loading || usd <= 0 || price <= 0}
          onClick={() => submit("buy")}
        >
          {t("trading.buyLong")}
        </Button>
        <Button
          variant="destructive"
          className="h-12 font-semibold"
          disabled={loading || usd <= 0 || price <= 0}
          onClick={() => submit("sell")}
        >
          {t("trading.sellShort")}
        </Button>
      </div>
    </div>
  );
}
