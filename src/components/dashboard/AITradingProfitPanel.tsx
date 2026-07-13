import { useTranslation } from "react-i18next";
import { Activity, Clock, TrendingUp, Zap, Coins } from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import {
  computeLiveProfit,
  formatCountdown,
  getHourlyRate,
  getProfitPerHour,
  getProfitPerSecond,
  getProjectedPayout,
  getProjectedProfitAtExpiry,
  getRunProgress,
  getTradeRate,
  type LiveProfitInput,
} from "@/lib/ai-trading";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AITradingProfitPanelProps {
  subscriptions: LiveProfitInput[];
  tick: number;
  compact?: boolean;
}

function sumLiveProfit(subs: LiveProfitInput[]): number {
  return subs.reduce((sum, s) => sum + computeLiveProfit(s), 0);
}

function sumAllocation(subs: LiveProfitInput[]): number {
  return subs.reduce((sum, s) => sum + Number(s.allocation), 0);
}

export function AITradingProfitPanel({ subscriptions, tick, compact = false }: AITradingProfitPanelProps) {
  const { t } = useTranslation();
  void tick;

  const active = subscriptions.filter((s) => s.status === "active");
  if (active.length === 0) return null;

  const totalLive = sumLiveProfit(active);
  const totalSynced = active.reduce((sum, s) => sum + Number(s.profit_earned ?? 0), 0);
  const totalPower = sumAllocation(active);
  const accruingNow = Math.max(totalLive - totalSynced, 0);
  const primary = active[0];
  const botId = primary.bot_id ?? "nexus";
  const perSecond = getProfitPerSecond(totalPower, botId);
  const perHour = getProfitPerHour(totalPower, botId);
  const projectedProfit = active.reduce((sum, s) => sum + getProjectedProfitAtExpiry(s), 0);
  const projectedPayout = active.reduce((sum, s) => sum + getProjectedPayout(s), 0);
  const progress = active.length === 1 ? getRunProgress(primary) : 0;

  return (
    <div className={cn(
      "overflow-hidden rounded-2xl border border-emerald/25 bg-gradient-to-br from-emerald/10 via-emerald/5 to-transparent",
      compact ? "p-4" : "p-5"
    )}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald" />
            <p className="text-xs font-medium uppercase tracking-wider text-emerald">
              {t("aiTrading.liveProfit")}
            </p>
            <Badge variant="success" className="text-[10px]">{t("aiTrading.running")}</Badge>
          </div>
          <p className="mt-2 font-display text-4xl font-bold tracking-tight text-emerald md:text-5xl">
            +{formatCurrency(totalLive)}
          </p>
          <p className="mt-1 text-xs text-muted">
            +{formatCurrency(perSecond)}/sec · +{formatCurrency(perHour)}/hr
            {accruingNow > 0.01 && (
              <span className="text-emerald"> · +{formatCurrency(accruingNow)} {t("aiTrading.accruingNow")}</span>
            )}
          </p>
        </div>
        {!compact && (
          <div className="rounded-xl border border-border bg-secondary/80 px-4 py-3 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted">{t("aiTrading.projectedPayout")}</p>
            <p className="mt-1 font-display text-xl font-bold text-foreground">{formatCurrency(projectedPayout)}</p>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("aiTrading.totalPower"), value: formatCurrency(totalPower), icon: Zap },
          { label: t("aiTrading.syncedProfit"), value: `+${formatCurrency(totalSynced)}`, icon: Coins },
          { label: t("aiTrading.projectedProfit"), value: `+${formatCurrency(projectedProfit)}`, icon: TrendingUp },
          {
            label: active.length === 1 ? t("aiTrading.timeRemaining") : t("aiTrading.activeBots"),
            value: active.length === 1 && primary.expires_at
              ? formatCountdown(primary.expires_at)
              : String(active.length),
            icon: Clock,
            mono: active.length === 1,
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-secondary/80 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
              <stat.icon className="h-3 w-3" />
              {stat.label}
            </div>
            <p className={cn("mt-1 text-sm font-semibold text-foreground", stat.mono && "font-mono text-base")}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {active.length === 1 && primary.expires_at && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-[10px] text-muted">
            <span>{t("aiTrading.runProgress")}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald to-emerald/60 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {active.length > 1 && (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{t("aiTrading.perBotProfit")}</p>
          {active.map((sub) => (
            <div key={sub.id ?? `${sub.bot_id}-${sub.created_at}`} className="flex items-center justify-between rounded-lg bg-secondary/80 px-3 py-2 text-sm">
              <span className="text-muted">{sub.bot_name ?? sub.bot_id ?? "bot"} · {formatCurrency(sub.allocation)}</span>
              <span className="font-semibold text-emerald">+{formatCurrency(computeLiveProfit(sub))}</span>
            </div>
          ))}
        </div>
      )}

      {!compact && active.length === 1 && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">{t("aiTrading.hourlyReturn")}</p>
            <p className="mt-0.5 text-sm font-medium">{getHourlyRate(botId)}%/hr</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">{t("aiTrading.tradeProfitRate")}</p>
            <p className="mt-0.5 text-sm font-medium">{getTradeRate(botId)}% {t("aiTrading.perTrade")}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase tracking-wider text-muted">{t("aiTrading.investment")}</p>
            <p className="mt-0.5 text-sm font-medium">{formatCurrency(primary.allocation)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
