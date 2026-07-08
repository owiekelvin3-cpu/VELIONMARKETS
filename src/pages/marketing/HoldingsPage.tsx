import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/marketing/PageHero";
import { IMAGES } from "@/constants/images";
import { StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";
import { PremiumImage } from "@/components/ui/premium-image";

const holdings = [
  { name: "Bitcoin", symbol: "BTC", allocation: "35%", value: "$2.4T" },
  { name: "Ethereum", symbol: "ETH", allocation: "18%", value: "$430B" },
  { name: "Gold", symbol: "XAU", allocation: "22%", value: "$14.5T" },
  { name: "US Equities", symbol: "SPX", allocation: "15%", value: "$48T" },
  { name: "Forex Reserves", symbol: "FX", allocation: "10%", value: "$12T" },
];

export default function HoldingsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero badge={t("pages.holdingsBadge")} title={t("pages.holdingsTitle")} subtitle={t("pages.holdingsSubtitle")} image={IMAGES.pages.holdings} />
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <PremiumImage
            src={IMAGES.hero.tradingDesk}
            alt="Global asset allocation dashboard"
            aspect="wide"
            overlay
            className="mb-12 shadow-2xl"
          />
          <StaggerContainer className="mx-auto max-w-2xl space-y-4">
            {holdings.map((h) => (
              <StaggerItem key={h.symbol}>
                <GlassCard className="flex items-center justify-between !p-5">
                  <div>
                    <h3 className="font-semibold">{h.name} <span className="text-muted font-normal">({h.symbol})</span></h3>
                    <p className="text-sm text-muted">Market cap: {h.value}</p>
                  </div>
                  <span className="text-2xl font-bold text-gradient-emerald">{h.allocation}</span>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </>
  );
}
