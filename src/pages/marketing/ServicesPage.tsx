import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/marketing/PageHero";
import { IMAGES } from "@/constants/images";
import { StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";
import { PremiumImage } from "@/components/ui/premium-image";
import { ArrowRight, Building2, Copy, Pickaxe, TrendingUp, LineChart } from "@/lib/icons";

const services = [
  { icon: Building2, titleKey: "services.hedgeFunds", descKey: "about.hedgeFundsPageDesc", href: "/services/hedge-funds", image: IMAGES.services.hedgeFunds },
  { icon: Copy, titleKey: "services.copyTrading", descKey: "services.copyTradingDesc", href: "/services/copy-trading", image: IMAGES.services.copyTrading },
  { icon: Pickaxe, titleKey: "services.cryptoMining", descKey: "about.cryptoMiningPageDesc", href: "/services/crypto-mining", image: IMAGES.services.cryptoMining },
  { icon: TrendingUp, titleKey: "services.forex", descKey: "about.forexPageDesc", href: "/services/forex", image: IMAGES.services.forex },
  { icon: LineChart, titleKey: "services.stocks", descKey: "about.stocksPageDesc", href: "/services/stocks", image: IMAGES.services.stocks },
] as const;

export default function ServicesPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero
        badge={t("nav.services")}
        title={t("services.pageTitle")}
        subtitle={t("services.pageSubtitle")}
        image={IMAGES.hero.office}
      />
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <StaggerContainer className="grid gap-6 md:grid-cols-2">
            {services.map((s) => (
              <StaggerItem key={s.titleKey}>
                <Link to={s.href} className="block h-full">
                  <GlassCard className="group h-full overflow-hidden !p-0">
                    <PremiumImage src={s.image} alt={t(s.titleKey)} aspect="wide" overlay className="rounded-none rounded-t-2xl ring-0" />
                    <div className="p-6">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald/10">
                        <s.icon className="h-5 w-5 text-emerald" />
                      </div>
                      <h3 className="text-xl font-semibold">{t(s.titleKey)}</h3>
                      <p className="mt-2 text-sm text-muted">{t(s.descKey)}</p>
                      <span className="mt-4 inline-flex items-center text-sm text-emerald opacity-0 transition-opacity group-hover:opacity-100">
                        {t("common.learnMore")} <ArrowRight className="ml-1 h-4 w-4" />
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </>
  );
}
