import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/marketing/PageHero";
import { IMAGES } from "@/constants/images";
import { FadeIn } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Users } from "@/lib/icons";
import { Link } from "react-router-dom";
import { PremiumImage } from "@/components/ui/premium-image";

export default function TradingRoomPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero badge={t("pages.tradingRoomBadge")} title={t("pages.tradingRoomTitle")} subtitle={t("pages.tradingRoomSubtitle")} image={IMAGES.pages.tradingRoom} />
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <FadeIn className="mx-auto max-w-2xl">
            <PremiumImage
              src={IMAGES.pages.tradingRoom}
              alt="Traders monitoring live market feeds"
              aspect="video"
              overlay
              className="mb-8 shadow-xl"
            />
            <GlassCard glow>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Live Session</h3>
                <Badge variant="success" className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald animate-pulse" />
                  Live
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted mb-6">
                <Users className="h-4 w-4" />
                <span>247 traders online</span>
              </div>
              <div className="rounded-xl bg-white/5 p-8 text-center">
                <p className="text-muted">Trading room access for registered clients.</p>
                <Link to="/auth" className="mt-4 inline-block text-emerald font-medium hover:underline">Sign in to join</Link>
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
