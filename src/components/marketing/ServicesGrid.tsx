import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Building2, Copy, Pickaxe, TrendingUp, LineChart, BarChart3 } from "@/lib/icons";
import { FadeIn } from "@/components/motion/Motion";
import { Section, SectionHeader, Container } from "@/components/ui/section";

const services = [
  { icon: Building2, titleKey: "services.hedgeFunds", descKey: "services.hedgeFundsDesc", href: "/services/hedge-funds" },
  { icon: Copy, titleKey: "services.copyTrading", descKey: "services.copyTradingDesc", href: "/services/copy-trading" },
  { icon: Pickaxe, titleKey: "services.cryptoMining", descKey: "services.cryptoMiningDesc", href: "/services/crypto-mining" },
  { icon: TrendingUp, titleKey: "services.forex", descKey: "services.forexDesc", href: "/services/forex" },
  { icon: LineChart, titleKey: "services.stocks", descKey: "services.stocksDesc", href: "/services/stocks" },
  { icon: BarChart3, titleKey: "services.signals", descKey: "services.signalsDesc", href: "/trading-signals" },
] as const;

export function ServicesGrid() {
  const { t } = useTranslation();

  return (
    <Section
      id="services"
      className="section-padding-sm !py-16 md:!py-20"
      style={{
        backgroundImage: "url('/images/services-nebula.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Keep copy readable over the nebula in light and dark themes */}
      <div
        className="pointer-events-none absolute inset-0 bg-background/55 dark:bg-[#050508]/70"
        aria-hidden="true"
      />

      <Container className="relative z-10">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow={t("services.eyebrow")}
            title={t("services.title")}
            subtitle={t("services.subtitle")}
            align="left"
            className="mb-0"
          />
          <Link
            to="/services"
            className="inline-flex shrink-0 items-center text-sm font-semibold text-emerald hover:underline"
          >
            {t("common.exploreServices")} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <FadeIn>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 lg:gap-4">
            {services.map((s) => (
              <Link
                key={s.titleKey}
                to={s.href}
                className="group min-w-[240px] shrink-0 rounded-xl border border-border/80 bg-surface/70 p-5 backdrop-blur-sm transition-colors hover:border-emerald/30 hover:bg-emerald/[0.08] sm:min-w-0 dark:bg-black/35 dark:hover:bg-emerald/[0.08]"
              >
                <s.icon className="mb-3 h-5 w-5 text-emerald" aria-hidden="true" />
                <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-emerald">
                  {t(s.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t(s.descKey)}</p>
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-emerald opacity-70 transition-opacity group-hover:opacity-100">
                  {t("common.explore")} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
