import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Building2, Copy, Pickaxe, TrendingUp, LineChart, BarChart3 } from "@/lib/icons";
import { IMAGES } from "@/constants/images";
import { StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { Section, SectionHeader, Container } from "@/components/ui/section";
import { PremiumImage } from "@/components/ui/premium-image";

const services = [
  { icon: Building2, titleKey: "services.hedgeFunds", descKey: "services.hedgeFundsDesc", href: "/services/hedge-funds", image: IMAGES.services.hedgeFunds },
  { icon: Copy, titleKey: "services.copyTrading", descKey: "services.copyTradingDesc", href: "/services/copy-trading", image: IMAGES.services.copyTrading },
  { icon: Pickaxe, titleKey: "services.cryptoMining", descKey: "services.cryptoMiningDesc", href: "/services/crypto-mining", image: IMAGES.services.cryptoMining },
  { icon: TrendingUp, titleKey: "services.forex", descKey: "services.forexDesc", href: "/services/forex", image: IMAGES.services.forex },
  { icon: LineChart, titleKey: "services.stocks", descKey: "services.stocksDesc", href: "/services/stocks", image: IMAGES.services.stocks },
  { icon: BarChart3, titleKey: "services.signals", descKey: "services.signalsDesc", href: "/trading-signals", image: IMAGES.services.signals },
] as const;

export function ServicesGrid() {
  const { t } = useTranslation();

  return (
    <Section id="services">
      <Container>
        <SectionHeader
          eyebrow={t("services.eyebrow")}
          title={t("services.title")}
          subtitle={t("services.subtitle")}
        />
        <StaggerContainer className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <StaggerItem key={s.titleKey}>
              <Link to={s.href} className="group block h-full">
                <article className="card-elevated h-full overflow-hidden rounded-2xl">
                  <PremiumImage
                    src={s.image}
                    alt={t(s.titleKey)}
                    aspect="video"
                    overlay
                    className="rounded-none rounded-t-2xl ring-0"
                  />
                  <div className="p-6 md:p-8">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-emerald-subtle ring-1 ring-emerald/15">
                      <s.icon className="h-5 w-5 text-emerald" aria-hidden="true" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground">{t(s.titleKey)}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{t(s.descKey)}</p>
                    <span className="mt-5 inline-flex items-center text-sm font-semibold text-emerald opacity-0 transition-all duration-300 group-hover:opacity-100">
                      {t("common.explore")} <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </article>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Container>
    </Section>
  );
}
