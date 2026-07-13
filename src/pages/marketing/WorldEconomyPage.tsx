import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { PageHero } from "@/components/marketing/PageHero";
import { MarketsSubnav } from "@/components/marketing/MarketsSubnav";
import { Container } from "@/components/ui/section";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import {
  ECONOMY_CALENDAR,
  ECONOMY_COUNTRIES,
  ECONOMY_GDP_GROWTH,
  ECONOMY_HEATMAP,
  ECONOMY_MACRO_IDEAS,
  ECONOMY_US_SNAPSHOT,
  type EconomyMetricRow,
} from "@/constants/economy-demo";
import { ArrowRight, Calendar } from "@/lib/icons";
import { cn } from "@/lib/utils";

function MiniSpark({ row }: { row: EconomyMetricRow }) {
  const id = `eco-spark-${row.code}`;
  const data = row.sparkline.map((v) => ({ v }));
  const up = row.value >= 0;
  const color = up ? "#10b981" : "#f87171";

  return (
    <div className="h-9 w-20">
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

function heatTone(value: number, kind: "growth" | "level"): string {
  if (kind === "growth") {
    if (value >= 5) return "bg-emerald/25 text-market-up";
    if (value >= 2) return "bg-emerald/12 text-emerald";
    if (value >= 0) return "bg-secondary text-muted";
    return "bg-red-500/15 text-market-down";
  }
  if (value >= 100) return "bg-red-500/20 text-market-down";
  if (value >= 60) return "bg-amber-500/15 text-amber-400";
  return "bg-emerald/12 text-emerald";
}

export default function WorldEconomyPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero
        badge={t("economy.badge")}
        title={t("economy.title")}
        subtitle={t("economy.subtitle")}
        cta={{ label: t("economy.ctaTrends"), href: "/world-economy/trends" }}
      />

      <section className="pb-20 pt-6 md:pb-28">
        <Container>
          <MarketsSubnav />

          <FadeIn className="mb-10">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{t("economy.trendsHeading")}</h2>
            <p className="mt-2 text-sm text-muted">{t("economy.trendsSub")}</p>
          </FadeIn>

          <div className="mb-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <FadeIn>
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
                  <h3 className="text-sm font-semibold">{t("economy.gdpGrowth")}</h3>
                  <Link to="/world-economy/trends" className="text-xs font-semibold text-emerald hover:underline">
                    {t("economy.seeTrends")}
                  </Link>
                </div>
                <div className="grid grid-cols-[1.2fr_0.8fr_0.9fr_72px] gap-2 border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  <span>{t("economy.country")}</span>
                  <span className="text-right">{t("economy.gdpGrowth")}</span>
                  <span className="text-right">{t("economy.nominalGdp")}</span>
                  <span className="text-right">{t("markets.trend")}</span>
                </div>
                {ECONOMY_GDP_GROWTH.map((row) => (
                  <div
                    key={row.code}
                    className="grid grid-cols-[1.2fr_0.8fr_0.9fr_72px] items-center gap-2 border-b border-border/50 px-4 py-2.5 last:border-0"
                  >
                    <p className="truncate text-sm font-semibold">{row.country}</p>
                    <p className="text-right font-mono text-sm text-market-up">{row.display}</p>
                    <p className="text-right font-mono text-xs text-muted">{row.secondary}</p>
                    <div className="justify-self-end">
                      <MiniSpark row={row} />
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn>
              <h3 className="mb-3 text-sm font-semibold">{t("economy.usSnapshot")}</h3>
              <div className="space-y-3">
                {ECONOMY_US_SNAPSHOT.map((card) => (
                  <div key={card.id} className="rounded-2xl border border-border bg-charcoal/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted">{t(card.labelKey)}</p>
                        <p className="mt-1 font-mono text-[11px] text-emerald">{card.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl font-bold">{card.value}</p>
                        <p className="text-xs text-muted">{card.change}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <FadeIn className="mb-12">
            <h2 className="mb-4 font-display text-2xl font-bold tracking-tight">{t("economy.countries")}</h2>
            <div className="flex flex-wrap gap-2">
              {ECONOMY_COUNTRIES.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-xs font-medium text-muted"
                >
                  {c}
                </span>
              ))}
            </div>
          </FadeIn>

          <FadeIn className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{t("economy.ideasTitle")}</h2>
              <p className="mt-2 text-sm text-muted">{t("economy.ideasSub")}</p>
            </div>
            <Link to="/trading-signals" className="hidden text-sm font-semibold text-emerald hover:underline sm:inline">
              {t("economy.seeIdeas")}
            </Link>
          </FadeIn>

          <StaggerContainer className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ECONOMY_MACRO_IDEAS.map((idea) => (
              <StaggerItem key={idea.id}>
                <Link
                  to="/trading-signals"
                  className="group flex h-full flex-col rounded-2xl border border-border p-5 transition-colors hover:border-emerald/30 hover:bg-emerald/[0.04]"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] font-semibold">
                      {idea.symbol}
                    </span>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        idea.bias === "long" && "bg-emerald/15 text-market-up",
                        idea.bias === "short" && "bg-red-500/15 text-market-down",
                        idea.bias === "neutral" && "bg-secondary text-muted"
                      )}
                    >
                      {t(`insights.bias.${idea.bias}`)}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-semibold leading-snug group-hover:text-emerald">
                    {idea.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{idea.snippet}</p>
                  <p className="mt-4 text-xs text-muted">
                    {t("insights.by")} {idea.author}
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn className="mb-5">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{t("economy.heatmapTitle")}</h2>
            <p className="mt-2 text-sm text-muted">{t("economy.heatmapSub")}</p>
          </FadeIn>

          <div className="mb-14 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-3 py-2.5">{t("economy.country")}</th>
                  <th className="px-2 py-2.5 text-right">{t("economy.heatGdp")}</th>
                  <th className="px-2 py-2.5 text-right">{t("economy.heatGrowth")}</th>
                  <th className="px-2 py-2.5 text-right">{t("economy.heatDebt")}</th>
                  <th className="px-2 py-2.5 text-right">{t("economy.heatRate")}</th>
                  <th className="px-2 py-2.5 text-right">{t("economy.heatInflation")}</th>
                  <th className="px-2 py-2.5 text-right">{t("economy.heatUnemployment")}</th>
                  <th className="px-3 py-2.5 text-right">{t("economy.heatIndustrial")}</th>
                </tr>
              </thead>
              <tbody>
                {ECONOMY_HEATMAP.map((row) => (
                  <tr key={row.country} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2.5 font-semibold">{row.country}</td>
                    <td className="px-2 py-2.5 text-right font-mono text-xs">{row.gdp.toFixed(1)}T</td>
                    <td className="px-2 py-2.5 text-right">
                      <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-xs", heatTone(row.gdpGrowth, "growth"))}>
                        {row.gdpGrowth.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-xs", heatTone(row.debt, "level"))}>
                        {row.debt.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono text-xs">{row.rate.toFixed(2)}%</td>
                    <td className="px-2 py-2.5 text-right font-mono text-xs">{row.inflation.toFixed(1)}%</td>
                    <td className="px-2 py-2.5 text-right font-mono text-xs">{row.unemployment.toFixed(1)}%</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-xs", heatTone(row.industrial, "growth"))}>
                        {row.industrial.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <FadeIn>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">{t("economy.calendarTitle")}</h2>
                <Calendar className="h-4 w-4 text-emerald" aria-hidden="true" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-border">
                {ECONOMY_CALENDAR.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-0"
                  >
                    <span className="w-12 shrink-0 font-mono text-xs text-muted">{ev.time}</span>
                    <span className="w-8 shrink-0 text-xs font-semibold text-emerald">{ev.country}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{ev.event}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {ev.actual ? `${t("economy.actual")}: ${ev.actual}` : ""}
                        {ev.forecast ? ` · ${t("economy.forecast")}: ${ev.forecast}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                        ev.impact === "high" && "bg-red-500/15 text-market-down",
                        ev.impact === "medium" && "bg-amber-500/15 text-amber-400",
                        ev.impact === "low" && "bg-secondary text-muted"
                      )}
                    >
                      {t(`economy.impact.${ev.impact}`)}
                    </span>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn>
              <h2 className="mb-4 font-display text-xl font-bold">{t("economy.newsTitle")}</h2>
              <div className="rounded-2xl border border-border bg-charcoal/40 p-6">
                <p className="text-sm text-muted">{t("economy.newsTeaser")}</p>
                <Link
                  to="/forex-news"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald hover:underline"
                >
                  {t("economy.readNews")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/world-economy/trends"
                  className="mt-3 flex items-center gap-2 text-sm font-semibold text-foreground hover:text-emerald"
                >
                  {t("economy.seeMoreTrends")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>
    </>
  );
}
