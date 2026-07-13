import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/marketing/PageHero";
import { Container } from "@/components/ui/section";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import {
  ArrowRight, Building2, Copy, Pickaxe, TrendingUp, LineChart, Bot, Radio, BarChart3,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const products = [
  {
    icon: Bot,
    titleKey: "services.aiTrading",
    descKey: "services.aiTradingDesc",
    href: "/auth?mode=register",
    tag: "Popular",
  },
  {
    icon: LineChart,
    titleKey: "services.stocks",
    descKey: "services.stocksDesc",
    href: "/services/stocks",
  },
  {
    icon: TrendingUp,
    titleKey: "services.forex",
    descKey: "services.forexDesc",
    href: "/services/forex",
  },
  {
    icon: Copy,
    titleKey: "services.copyTrading",
    descKey: "services.copyTradingDesc",
    href: "/services/copy-trading",
  },
  {
    icon: Building2,
    titleKey: "services.hedgeFunds",
    descKey: "services.hedgeFundsDesc",
    href: "/services/hedge-funds",
  },
  {
    icon: Pickaxe,
    titleKey: "services.cryptoMining",
    descKey: "services.cryptoMiningDesc",
    href: "/services/crypto-mining",
  },
  {
    icon: Radio,
    titleKey: "services.signals",
    descKey: "services.signalsDesc",
    href: "/trading-signals",
  },
  {
    icon: BarChart3,
    titleKey: "nav.tradingRoom",
    descKey: "services.tradingRoomDesc",
    href: "/trading-room",
  },
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

      <section className="pb-20 pt-10 md:pb-28 md:pt-14">
        <Container>
          <FadeIn className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {t("services.productsHeading")}
              </h2>
              <p className="mt-2 text-sm text-muted md:text-base">{t("services.productsSub")}</p>
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
                    "group flex h-full flex-col rounded-2xl border border-border bg-transparent p-5 transition-colors",
                    "hover:border-emerald/35 hover:bg-emerald/[0.04]"
                  )}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                      <p.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    {"tag" in p && p.tag && (
                      <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald">
                        {p.tag}
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
    </>
  );
}
