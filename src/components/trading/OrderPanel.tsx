import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/market-api";
import { cn } from "@/lib/utils";

interface OrderPanelProps {
  symbol: string;
  pairLabel: string;
  price: number;
  balance: number;
  loading: boolean;
  onSubmit: (side: "buy" | "sell", amountUsd: number, orderType: "market" | "limit") => void;
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

  const handleQuick = (pct: number) => {
    setAmountUsd(((balance * pct) / 100).toFixed(2));
  };

  const submit = (side: "buy" | "sell") => {
    if (usd <= 0) return;
    onSubmit(side, usd, orderType);
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="border-b border-white/[0.06] p-4">
        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "market" | "limit")}>
          <TabsList className="mb-3 grid h-9 w-full grid-cols-2 rounded-lg bg-white/[0.04] p-0.5">
            <TabsTrigger value="market" className="rounded-md text-xs">{t("trading.marketOrder")}</TabsTrigger>
            <TabsTrigger value="limit" className="rounded-md text-xs">{t("trading.limitOrder")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          {(["spot", "timed"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTradeMode(mode)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
                tradeMode === mode
                  ? "bg-emerald/10 text-emerald ring-1 ring-emerald/20"
                  : "text-muted hover:bg-white/[0.04]"
              )}
            >
              {mode === "spot" ? t("trading.spotTrade") : t("trading.timedTrade")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-4 p-4">
        <div>
          <Label htmlFor="amount">{t("trading.amountUsd")}</Label>
          <Input
            id="amount"
            type="number"
            min="1"
            step="0.01"
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
            className="mt-2 h-11"
          />
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {QUICK_AMOUNTS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleQuick(pct)}
                className="rounded-md border border-white/[0.06] bg-white/[0.03] py-1.5 text-xs text-muted hover:border-emerald/20 hover:text-emerald"
              >
                {pct}%
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            ≈ {assetQty.toFixed(6)} {pairLabel.split("/")[0]} · {t("trading.balance")}: ${balance.toFixed(2)}
          </p>
        </div>

        <div>
          <Label htmlFor="leverage">{t("trading.leverage")}</Label>
          <select
            id="leverage"
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
            className="select-input mt-2 h-11 w-full"
          >
            {LEVERAGE_OPTIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between text-sm">
            <span className="text-muted">{t("trading.stopLoss")}</span>
            <input type="checkbox" checked={stopLoss} onChange={(e) => setStopLoss(e.target.checked)} className="rounded" />
          </label>
          <label className="flex cursor-pointer items-center justify-between text-sm">
            <span className="text-muted">{t("trading.takeProfit")}</span>
            <input type="checkbox" checked={takeProfit} onChange={(e) => setTakeProfit(e.target.checked)} className="rounded" />
          </label>
        </div>

        <div className="space-y-1 rounded-lg bg-white/[0.03] p-3 text-xs">
          <div className="flex justify-between text-muted">
            <span>{t("trading.marginRequired")}</span>
            <span className="text-foreground">${marginRequired.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>{t("trading.positionSize")}</span>
            <span className="text-foreground">${positionSize.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>{t("trading.livePrice")}</span>
            <span className="text-emerald">${formatPrice(price, symbol)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] p-4">
        <Button
          className="h-12 bg-emerald hover:bg-emerald/90"
          disabled={loading || usd <= 0}
          onClick={() => submit("buy")}
        >
          {t("trading.buyLong")}
        </Button>
        <Button
          variant="destructive"
          className="h-12"
          disabled={loading || usd <= 0}
          onClick={() => submit("sell")}
        >
          {t("trading.sellShort")}
        </Button>
      </div>
    </div>
  );
}
