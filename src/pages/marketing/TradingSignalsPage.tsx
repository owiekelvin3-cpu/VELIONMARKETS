import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/marketing/PageHero";
import {
  MarketingTrustBand,
  MarketingTrustPillars,
  MarketingFaqBlock,
} from "@/components/marketing/MarketingTrust";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { MARKET_INSIGHTS } from "@/constants/markets-demo";
import { AlertTriangle, ArrowRight, TrendingDown, TrendingUp } from "@/lib/icons";
import { cn } from "@/lib/utils";

const signals = [
  { pair: "EUR/USD", action: "BUY" as const, entry: "1.0840", target: "1.0920", stop: "1.0790", status: "active" },
  { pair: "GBP/USD", action: "SELL" as const, entry: "1.2745", target: "1.2680", stop: "1.2790", status: "active" },
  { pair: "XAU/USD", action: "BUY" as const, entry: "2415.00", target: "2450.00", stop: "2395.00", status: "active" },
  { pair: "BTC/USD", action: "BUY" as const, entry: "68200", target: "70000", stop: "66800", status: "closed" },
  { pair: "NDX", action: "BUY" as const, entry: "20120", target: "20580", stop: "19840", status: "active" },
  { pair: "ETH/USD", action: "SELL" as const, entry: "3620", target: "3480", stop: "3710", status: "active" },
];

const method = [
  { titleKey: "pages.signalsM1Title", descKey: "pages.signalsM1Desc" },
  { titleKey: "pages.signalsM2Title", descKey: "pages.signalsM2Desc" },
  { titleKey: "pages.signalsM3Title", descKey: "pages.signalsM3Desc" },
  { titleKey: "pages.signalsM4Title", descKey: "pages.signalsM4Desc" },
] as const;

export default function TradingSignalsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero
        badge={t("pages.signalsBadge")}
        title={t("pages.signalsTitle")}
        subtitle={t("pages.signalsSubtitle")}
        cta={{ label: t("pages.signalsCta"), href: "/auth?mode=register" }}
      />

      <MarketingTrustBand />

      <section className="pb-14 pt-12 md:pb-20 md:pt-16">
        <Container>
          <FadeIn className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {t("pages.signalsIdeasTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted">{t("pages.signalsIdeasSub")}</p>
            </div>
            <Link to="/auth" className="hidden text-sm font-semibold text-emerald hover:underline sm:inline">
              {t("pages.signalsSeeAll")}
            </Link>
          </FadeIn>

          <StaggerContainer className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MARKET_INSIGHTS.map((idea) => (
              <StaggerItem key={idea.id}>
                <Link
                  to={idea.href}
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
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {t("pages.signalsActiveTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted">{t("pages.signalsActiveSub")}</p>
          </FadeIn>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="hidden grid-cols-[1.1fr_0.7fr_0.9fr_0.9fr_0.9fr_0.7fr] gap-2 border-b border-border bg-secondary/30 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted sm:grid">
              <span>{t("pages.signalsPair")}</span>
              <span>{t("pages.signalsSide")}</span>
              <span className="text-right">{t("pages.signalsEntry")}</span>
              <span className="text-right">{t("pages.signalsTarget")}</span>
              <span className="text-right">{t("pages.signalsStop")}</span>
              <span className="text-right">{t("pages.signalsStatus")}</span>
            </div>
            {signals.map((s) => (
              <div
                key={s.pair}
                className="grid gap-3 border-b border-border/50 px-4 py-3.5 last:border-0 sm:grid-cols-[1.1fr_0.7fr_0.9fr_0.9fr_0.9fr_0.7fr] sm:items-center sm:gap-2"
              >
                <div className="flex items-center justify-between sm:block">
                  <p className="font-semibold">{s.pair}</p>
                  <span className="text-[10px] uppercase text-muted sm:hidden">{s.status}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {s.action === "BUY" ? (
                    <TrendingUp className="h-3.5 w-3.5 text-market-up" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-market-down" />
                  )}
                  <span className={cn("text-sm font-semibold", s.action === "BUY" ? "text-market-up" : "text-market-down")}>
                    {s.action}
                  </span>
                </div>
                <p className="font-mono text-sm sm:text-right">
                  <span className="mr-2 text-muted sm:hidden">{t("pages.signalsEntry")}</span>
                  {s.entry}
                </p>
                <p className="font-mono text-sm text-emerald sm:text-right">
                  <span className="mr-2 text-muted sm:hidden">{t("pages.signalsTarget")}</span>
                  {s.target}
                </p>
                <p className="font-mono text-sm text-red-400 sm:text-right">
                  <span className="mr-2 text-muted sm:hidden">{t("pages.signalsStop")}</span>
                  {s.stop}
                </p>
                <p className="hidden text-right text-xs capitalize text-muted sm:block">{s.status}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border bg-secondary/15 py-14 md:py-20">
        <Container>
          <FadeIn className="mb-8 max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {t("pages.signalsMethodTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted md:text-base">{t("pages.signalsMethodSub")}</p>
          </FadeIn>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {method.map((m, i) => (
              <div key={m.titleKey} className="rounded-2xl border border-border bg-void/30 p-5">
                <span className="font-mono text-xs font-semibold text-emerald">0{i + 1}</span>
                <h3 className="mt-3 font-semibold text-foreground">{t(m.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t(m.descKey)}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-foreground">{t("pages.signalsDisclaimerTitle")}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{t("pages.signalsDisclaimer")}</p>
            </div>
          </div>
        </Container>
      </section>

      <MarketingTrustPillars />

      <MarketingFaqBlock
        titleKey="pages.signalsFaqTitle"
        items={[
          { q: "pages.signalsFaq1q", a: "pages.signalsFaq1a" },
          { q: "pages.signalsFaq2q", a: "pages.signalsFaq2a" },
          { q: "pages.signalsFaq3q", a: "pages.signalsFaq3a" },
        ]}
      />

      <section className="border-t border-border pb-20 pt-10">
        <Container>
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-emerald/[0.04] p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="font-display text-xl font-bold md:text-2xl">{t("pages.signalsCtaTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("pages.signalsCtaSub")}</p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link to="/auth">
                {t("common.getStarted")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
