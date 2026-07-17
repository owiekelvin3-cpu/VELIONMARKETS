import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, Clock, Sparkles } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/motion/Motion";
import {
  computeLiveProfit,
  estimateTradeProfit,
  formatCountdown,
  getRunProgress,
  getTradeRate,
} from "@/lib/ai-trading";
import { formatCurrency, cn } from "@/lib/utils";
import type { AIBotTrade, AISubscription } from "./types";

interface RunningBotViewProps {
  activeSubs: AISubscription[];
  selectedSub: AISubscription | null;
  onSelectSub: (id: string) => void;
  trades: AIBotTrade[];
  tick: number;
  loading: boolean;
  onStartAnother: () => void;
  onQuickTrade: (pct: number) => void;
  onManualTrade: (amount: number) => void;
}

export function RunningBotView({
  activeSubs,
  selectedSub,
  onSelectSub,
  trades,
  tick,
  loading,
  onStartAnother,
  onQuickTrade,
  onManualTrade,
}: RunningBotViewProps) {
  const { t } = useTranslation();
  const [tradeAmount, setTradeAmount] = useState("");

  if (activeSubs.length === 0 || !selectedSub) {
    return (
      <FadeIn className="rounded-2xl border border-border bg-secondary/25 py-16 text-center">
        <Bot className="mx-auto h-12 w-12 text-muted" />
        <p className="mt-4 font-medium text-foreground">{t("aiTrading.noActiveBots")}</p>
        <p className="mt-1 text-sm text-muted">{t("aiTrading.noActiveBotsDesc")}</p>
        <Button className="mt-6" onClick={onStartAnother}>
          {t("aiTrading.startNow")}
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </FadeIn>
    );
  }

  const earnings = computeLiveProfit(selectedSub);
  const progress = getRunProgress(selectedSub);
  const subTrades = trades.filter((tr) => tr.subscription_id === selectedSub.id);
  const tradeNum = parseFloat(tradeAmount) || 0;
  const botId = selectedSub.bot_id ?? "nexus";

  return (
    <FadeIn className="space-y-4">
      {activeSubs.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {activeSubs.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSub(s.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                selectedSub.id === s.id
                  ? "border-emerald/40 bg-emerald/10 text-emerald"
                  : "border-border text-muted hover:text-foreground"
              )}
            >
              {s.bot_name}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-[1.75rem] border border-emerald/25 bg-gradient-to-br from-emerald/10 via-emerald/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald">
              {t("aiTrading.botRunning")}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-foreground sm:text-2xl">
              {selectedSub.bot_name}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {selectedSub.crypto_asset} · {formatCurrency(selectedSub.allocation)}
            </p>
          </div>
          <Badge variant="success">{t("aiTrading.running")}</Badge>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {t("aiTrading.earningsSoFar")}
          </p>
          <p className="mt-2 font-display text-4xl font-bold text-emerald sm:text-5xl" key={tick}>
            +{formatCurrency(earnings)}
          </p>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {t("aiTrading.timeRemaining")}
            </span>
            <span className="font-mono font-semibold text-foreground" key={`t-${tick}`}>
              {selectedSub.expires_at ? formatCountdown(selectedSub.expires_at) : "—"}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-emerald transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted">{t("aiTrading.moneyBackNote")}</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border/70 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald">
            {t("aiTrading.manualExecutionEyebrow")}
          </p>
          <h3 className="mt-1 font-display text-base font-semibold text-foreground">
            {t("aiTrading.earnMore")}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t("aiTrading.earnMoreDesc")}</p>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {t("aiTrading.quickExecution")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: t("aiTrading.tradeSmall"), pct: 0.25 },
                { label: t("aiTrading.tradeMedium"), pct: 0.5 },
                { label: t("aiTrading.tradeLarge"), pct: 1 },
              ].map(({ label, pct }) => {
                const amt = Math.floor(selectedSub.allocation * pct);
                const profit = estimateTradeProfit(amt, botId);
                return (
                  <button
                    key={pct}
                    type="button"
                    disabled={loading || amt <= 0}
                    onClick={() => onQuickTrade(pct)}
                    className="rounded-xl border border-border bg-secondary py-3.5 text-center transition-colors hover:border-emerald/30 hover:bg-secondary/80 disabled:opacity-40"
                  >
                    <p className="font-display text-lg font-bold text-foreground">{label}</p>
                    <p className="mt-0.5 text-[10px] text-muted">{t("aiTrading.tradePctLabel")}</p>
                    <p className="mt-2 text-[11px] text-muted">{formatCurrency(amt)}</p>
                    <p className="mt-1 text-xs font-semibold text-emerald">+{formatCurrency(profit)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <Label htmlFor="extra-trade" className="text-sm font-medium text-foreground">
              {t("aiTrading.tradeAmount")}
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="extra-trade"
                type="number"
                min={1}
                max={selectedSub.allocation}
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                placeholder={String(Math.floor(selectedSub.allocation * 0.25))}
                className="h-11"
              />
              <Button
                className="shrink-0"
                disabled={loading || tradeNum <= 0}
                onClick={() => onManualTrade(tradeNum)}
              >
                {loading ? t("aiTrading.trading") : t("aiTrading.executeTrade")}
              </Button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {t("aiTrading.tradeCryptoDesc", {
                asset: selectedSub.crypto_asset,
                rate: getTradeRate(botId),
              })}
              {tradeNum > 0 && (
                <> · {t("aiTrading.expectedTradeProfit")}: +{formatCurrency(estimateTradeProfit(tradeNum, botId))}</>
              )}
            </p>
          </div>

          {subTrades.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {t("aiTrading.recentTrades")}
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                {subTrades.slice(0, 5).map((tr) => (
                  <div
                    key={tr.id}
                    className="flex items-center justify-between border-b border-border/70 px-3 py-2.5 text-sm last:border-0"
                  >
                    <span className="font-medium text-foreground">{tr.crypto_asset}</span>
                    <span className="font-semibold tabular-nums text-emerald">+{formatCurrency(tr.profit)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Button variant="outline" className="w-full" onClick={onStartAnother}>
        {t("aiTrading.buyAnother")}
      </Button>
    </FadeIn>
  );
}
