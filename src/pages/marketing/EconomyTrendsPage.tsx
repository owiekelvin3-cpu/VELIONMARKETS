import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { PageHero } from "@/components/marketing/PageHero";
import { MarketsSubnav } from "@/components/marketing/MarketsSubnav";
import { Container } from "@/components/ui/section";
import { FadeIn } from "@/components/motion/Motion";
import {
  ECONOMY_TREND_TABS,
  type EconomyMetricRow,
  type TrendTabId,
} from "@/constants/economy-demo";
import { cn } from "@/lib/utils";

function MiniSpark({ row }: { row: EconomyMetricRow }) {
  const id = `trend-spark-${row.code}-${row.display}`;
  const data = row.sparkline.map((v) => ({ v }));
  const color = row.value >= 0 ? "#10b981" : "#f87171";

  return (
    <div className="h-9 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function EconomyTrendsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TrendTabId>("inflation");
  const active = ECONOMY_TREND_TABS.find((x) => x.id === tab) ?? ECONOMY_TREND_TABS[0];

  return (
    <>
      <PageHero
        badge={t("economy.trendsBadge")}
        title={t("economy.trendsPageTitle")}
        subtitle={t("economy.trendsPageSubtitle")}
      />

      <section className="pb-20 pt-6 md:pb-28">
        <Container>
          <MarketsSubnav />

          <FadeIn className="mb-6 -mx-1 overflow-x-auto px-1 scrollbar-none">
            <div className="flex min-w-max gap-2">
              {ECONOMY_TREND_TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                    tab === item.id
                      ? "border-emerald/40 bg-emerald/10 text-emerald"
                      : "border-border text-muted hover:border-emerald/30 hover:text-foreground"
                  )}
                >
                  {t(item.titleKey)}
                </button>
              ))}
            </div>
          </FadeIn>

          <FadeIn className="mb-6">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{t(active.titleKey)}</h2>
            <p className="mt-2 text-sm text-muted">{t(active.subtitleKey)}</p>
          </FadeIn>

          <FadeIn>
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-[1.4fr_1fr_96px] gap-2 border-b border-border bg-secondary/30 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted sm:grid-cols-[1.4fr_1fr_1fr_96px]">
                <span>{t("economy.country")}</span>
                <span className="text-right">{t("economy.value")}</span>
                <span className="hidden text-right sm:block">{t("economy.rank")}</span>
                <span className="text-right">{t("markets.trend")}</span>
              </div>
              {active.rows.map((row, i) => (
                <div
                  key={`${active.id}-${row.code}`}
                  className="grid grid-cols-[1.4fr_1fr_96px] items-center gap-2 border-b border-border/50 px-4 py-3 last:border-0 sm:grid-cols-[1.4fr_1fr_1fr_96px]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{row.country}</p>
                    <p className="font-mono text-[11px] text-muted">{row.code}</p>
                  </div>
                  <p
                    className={cn(
                      "text-right font-mono text-sm font-medium",
                      row.value >= 0 ? "text-market-up" : "text-market-down"
                    )}
                  >
                    {row.display}
                  </p>
                  <p className="hidden text-right text-xs text-muted sm:block">#{i + 1}</p>
                  <div className="justify-self-end">
                    <MiniSpark row={row} />
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </Container>
      </section>
    </>
  );
}
