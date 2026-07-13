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
import {
  ArrowRight, Building2, Copy, Pickaxe, TrendingUp, LineChart, Bot, Radio, BarChart3,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const products = [
  { icon: Bot, titleKey: "services.aiTrading", descKey: "services.aiTradingDesc", href: "/auth?mode=register", tagKey: "services.tagPopular" },
  { icon: LineChart, titleKey: "services.stocks", descKey: "services.stocksDesc", href: "/services/stocks" },
  { icon: TrendingUp, titleKey: "services.forex", descKey: "services.forexDesc", href: "/services/forex" },
  { icon: Copy, titleKey: "services.copyTrading", descKey: "services.copyTradingDesc", href: "/services/copy-trading" },
  { icon: Building2, titleKey: "services.hedgeFunds", descKey: "services.hedgeFundsDesc", href: "/services/hedge-funds" },
  { icon: Pickaxe, titleKey: "services.cryptoMining", descKey: "services.cryptoMiningDesc", href: "/services/crypto-mining" },
  { icon: Radio, titleKey: "services.signals", descKey: "services.signalsDesc", href: "/trading-signals" },
  { icon: BarChart3, titleKey: "nav.tradingRoom", descKey: "services.tradingRoomDesc", href: "/trading-room" },
] as const;

const why = [
  { titleKey: "services.why1Title", descKey: "services.why1Desc" },
  { titleKey: "services.why2Title", descKey: "services.why2Desc" },
  { titleKey: "services.why3Title", descKey: "services.why3Desc" },
] as const;

const steps = [
  { titleKey: "services.how1Title", descKey: "services.how1Desc" },
  { titleKey: "services.how2Title", descKey: "services.how2Desc" },
  { titleKey: "services.how3Title", descKey: "services.how3Desc" },
  { titleKey: "services.how4Title", descKey: "services.how4Desc" },
] as const;

export default function ServicesPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero
        badge={t("nav.services")}
        title={t("services.pageTitle")}
        subtitle={t("services.pageSubtitle")}
        cta={{ label: t("common.getStarted"), href: "/auth?mode=register" }}
      />

      <MarketingTrustBand />

      <section className="pb-16 pt-12 md:pb-24 md:pt-16">
        <Container>
          <FadeIn className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {t("services.productsHeading")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">{t("services.productsSub")}</p>
            </div>
            <Link to="/trading-room" className="hidden text-sm font-semibold text-emerald hover:underline sm:inline">
              {t("services.exploreCharts")}
            </Link>
          </FadeIn>

          <StaggerContainer className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((p) => (
              <StaggerItem key={p.titleKey}>
                <Link
                  to={p.href}
                  className={cn(
                    "group flex h-full flex-col rounded-2xl border border-border p-5 transition-colors",
                    "hover:border-emerald/35 hover:bg-emerald/[0.04]"
                  )}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                      <p.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    {"tagKey" in p && (
                      <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald">
                        {t(p.tagKey)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-emerald">
                    {t(p.titleKey)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t(p.descKey)}</p>
                  <span className="mt-5 inline-flex items-center text-sm font-semibold text-emerald">
                    {t("common.learnMore")}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Container>
      </section>

      <section className="border-t border-border bg-secondary/15 py-14 md:py-20">
        <Container>
          <FadeIn className="mb-8 max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{t("services.whyTitle")}</h2>
            <p className="mt-2 text-sm text-muted md:text-base">{t("services.whySub")}</p>
          </FadeIn>
          <div className="grid gap-4 md:grid-cols-3">
            {why.map((item, i) => (
              <div key={item.titleKey} className="rounded-2xl border border-border bg-void/30 p-6">
                <span className="font-mono text-xs font-semibold text-emerald">0{i + 1}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 md:py-20">
        <Container>
          <FadeIn className="mb-8 max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{t("services.howTitle")}</h2>
            <p className="mt-2 text-sm text-muted md:text-base">{t("services.howSub")}</p>
          </FadeIn>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.titleKey} className="relative rounded-2xl border border-border p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald/15 text-sm font-bold text-emerald">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-foreground">{t(s.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t(s.descKey)}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <MarketingTrustPillars className="border-t border-border bg-secondary/10" />

      <MarketingFaqBlock
        titleKey="services.faqTitle"
        items={[
          { q: "services.faq1q", a: "services.faq1a" },
          { q: "services.faq2q", a: "services.faq2a" },
          { q: "services.faq3q", a: "services.faq3a" },
        ]}
      />

      <section className="border-t border-border pb-20 pt-10">
        <Container>
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-emerald/[0.04] p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="font-display text-xl font-bold md:text-2xl">{t("services.ctaTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("services.ctaSub")}</p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link to="/auth?mode=register">
                {t("common.getStarted")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
