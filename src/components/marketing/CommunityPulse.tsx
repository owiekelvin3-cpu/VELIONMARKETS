import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "@/lib/icons";
import { FOREX_NEWS } from "@/constants/economy-demo";
import { MARKET_STOCK_TRENDS } from "@/constants/markets-demo";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { Section, Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const stories = FOREX_NEWS.slice(0, 5);

export function CommunityPulse() {
  const { t } = useTranslation();

  return (
    <Section variant="elevated" className="section-padding-sm !py-16 md:!py-24">
      <Container>
        {/* TradingView-style social proof headline — one job */}
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald">
            {t("communityPulse.eyebrow")}
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {t("communityPulse.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
            {t("communityPulse.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="rounded-full px-6">
              <Link to="/auth?mode=register">{t("communityPulse.cta")}</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full px-6">
              <Link to="/#markets">{t("communityPulse.explore")}</Link>
            </Button>
          </div>
        </FadeIn>

        {/* Community trends — TradingView chip row */}
        <FadeIn className="mt-16">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {t("communityPulse.trendsTitle")}
              </h3>
              <p className="mt-1 text-sm text-muted">{t("communityPulse.trendsSub")}</p>
            </div>
            <Link
              to="/trading-room"
              className="hidden shrink-0 text-sm font-semibold text-emerald hover:underline sm:inline-flex sm:items-center"
            >
              {t("communityPulse.seeMarkets")} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {MARKET_STOCK_TRENDS.map((row) => (
              <Link
                key={row.symbol}
                to="/trading-room"
                className="group shrink-0 rounded-full border border-border bg-void/40 px-4 py-2 transition-colors hover:border-emerald/40 hover:bg-emerald/[0.06]"
              >
                <span className="font-mono text-sm font-semibold text-foreground group-hover:text-emerald">
                  {row.symbol}
                </span>
                <span className="ml-2 text-xs text-muted">{row.name}</span>
              </Link>
            ))}
          </div>
        </FadeIn>

        {/* Top stories — TradingView news density */}
        <FadeIn className="mt-14">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {t("communityPulse.storiesTitle")}
              </h3>
              <p className="mt-1 text-sm text-muted">{t("communityPulse.storiesSub")}</p>
            </div>
            <Link
              to="/forex-news"
              className="hidden shrink-0 text-sm font-semibold text-emerald hover:underline sm:inline-flex sm:items-center"
            >
              {t("communityPulse.keepReading")} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <StaggerContainer className="overflow-hidden rounded-2xl border border-border">
            <div className="hidden grid-cols-[72px_88px_1fr_100px] gap-3 border-b border-border bg-secondary/30 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted sm:grid">
              <span>{t("communityPulse.colTime")}</span>
              <span>{t("communityPulse.colInstrument")}</span>
              <span>{t("communityPulse.colHeadline")}</span>
              <span className="text-right">{t("communityPulse.colProvider")}</span>
            </div>
            {stories.map((story, i) => (
              <StaggerItem key={story.id}>
                <Link
                  to="/forex-news"
                  className={cn(
                    "grid gap-1 border-b border-border/60 px-4 py-3.5 transition-colors last:border-0 hover:bg-secondary/40 sm:grid-cols-[72px_88px_1fr_100px] sm:items-center sm:gap-3",
                    i === 0 && "bg-emerald/[0.03]"
                  )}
                >
                  <span className="font-mono text-xs text-muted">{story.time}</span>
                  <span className="w-fit rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] font-semibold">
                    {story.instrument}
                  </span>
                  <span className="text-sm font-medium leading-snug text-foreground">{story.headline}</span>
                  <span className="text-xs text-muted sm:text-right">{story.provider}</span>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <Link
            to="/forex-news"
            className="mt-4 inline-flex items-center text-sm font-semibold text-emerald hover:underline sm:hidden"
          >
            {t("communityPulse.keepReading")} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </FadeIn>
      </Container>
    </Section>
  );
}
