import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { PageHero } from "@/components/marketing/PageHero";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/Motion";
import { HERO_CHART, HERO_PAIRS, MARKET_FEATURED_INDICES } from "@/constants/markets-demo";
import { ArrowRight, CandlestickChart, LineChart, Users, Zap } from "@/lib/icons";
import { cn } from "@/lib/utils";

const features = [
  { icon: CandlestickChart, titleKey: "pages.roomFeat1Title", descKey: "pages.roomFeat1Desc" },
  { icon: LineChart, titleKey: "pages.roomFeat2Title", descKey: "pages.roomFeat2Desc" },
  { icon: Zap, titleKey: "pages.roomFeat3Title", descKey: "pages.roomFeat3Desc" },
  { icon: Users, titleKey: "pages.roomFeat4Title", descKey: "pages.roomFeat4Desc" },
] as const;

function SuperchartMock() {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-charcoal/50 ring-1 ring-white/5">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">BTC / USD</span>
          <span className="font-mono text-sm text-foreground">68,420.00</span>
          <span className="text-xs font-medium text-market-down">-0.34%</span>
        </div>
        <span className="rounded bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald">
          {t("common.live")}
        </span>
      </div>

      <div className="grid lg:grid-cols-[180px_1fr]">
        <div className="hidden border-r border-border lg:block">
          {HERO_PAIRS.map((p) => (
            <div key={p.symbol} className="border-b border-border/60 px-3 py-2.5 last:border-0">
              <p className="text-[11px] font-semibold">{p.symbol}</p>
              <div className="mt-0.5 flex justify-between gap-2">
                <span className="font-mono text-[11px] text-muted">{p.price}</span>
                <span className={cn("text-[10px] font-medium", p.up ? "text-market-up" : "text-market-down")}>
                  {p.change}
                </span>
              </div>
            </div>
          ))}
          {MARKET_FEATURED_INDICES.slice(0, 2).map((p) => (
            <div key={p.symbol} className="border-b border-border/60 px-3 py-2.5 last:border-0">
              <p className="text-[11px] font-semibold">{p.symbol}</p>
              <div className="mt-0.5 flex justify-between gap-2">
                <span className="font-mono text-[11px] text-muted">{p.price}</span>
                <span className={cn("text-[10px] font-medium", p.up ? "text-market-up" : "text-market-down")}>
                  {p.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          <div className="h-56 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HERO_CHART}>
                <defs>
                  <linearGradient id="roomChart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#roomChart)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["1m", "5m", "15m", "1H", "4H", "1D"].map((tf) => (
              <span
                key={tf}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium",
                  tf === "1H" ? "bg-emerald/15 text-emerald" : "bg-secondary text-muted"
                )}
              >
                {tf}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TradingRoomPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero
        badge={t("pages.tradingRoomBadge")}
        title={t("pages.tradingRoomTitle")}
        subtitle={t("pages.tradingRoomSubtitle")}
        cta={{ label: t("pages.roomCta"), href: "/auth?mode=register" }}
      />

      <section className="pb-20 pt-10 md:pb-28">
        <Container>
          <FadeIn>
            <SuperchartMock />
          </FadeIn>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.titleKey} className="rounded-2xl border border-border p-5">
                <f.icon className="mb-3 h-5 w-5 text-emerald" aria-hidden="true" />
                <h3 className="font-semibold text-foreground">{t(f.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t(f.descKey)}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-emerald/[0.04] p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="font-display text-xl font-bold md:text-2xl">{t("pages.roomReadyTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("pages.roomReadyDesc")}</p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link to="/auth">
                {t("common.signIn")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
