import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/marketing/PageHero";
import { IMAGES } from "@/constants/images";
import { StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";
import { PremiumImage } from "@/components/ui/premium-image";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "@/lib/icons";
import { Link } from "react-router-dom";

const signals = [
  { pair: "EUR/USD", action: "BUY", entry: "1.0840", target: "1.0920", stop: "1.0790", status: "active" },
  { pair: "GBP/USD", action: "SELL", entry: "1.2745", target: "1.2680", stop: "1.2790", status: "active" },
  { pair: "XAU/USD", action: "BUY", entry: "2415.00", target: "2450.00", stop: "2395.00", status: "active" },
  { pair: "BTC/USD", action: "BUY", entry: "68200", target: "70000", stop: "66800", status: "closed" },
];

export default function TradingSignalsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero badge={t("pages.signalsBadge")} title={t("pages.signalsTitle")} subtitle={t("pages.signalsSubtitle")} image={IMAGES.services.signals} />
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <PremiumImage
              src={IMAGES.hero.analytics}
              alt="Market analyst reviewing trading signals"
              aspect="video"
              overlay
              className="mb-10 shadow-xl"
            />
            <StaggerContainer className="space-y-4">
              {signals.map((s, i) => (
                <StaggerItem key={i}>
                  <GlassCard className="!p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{s.pair}</h3>
                      <div className="flex gap-2">
                        <Badge variant={s.action === "BUY" ? "success" : "destructive"}>
                          {s.action === "BUY" ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                          {s.action}
                        </Badge>
                        <Badge variant="secondary">{s.status}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted">Entry</span><p className="font-semibold">{s.entry}</p></div>
                      <div><span className="text-muted">Target</span><p className="font-semibold text-emerald">{s.target}</p></div>
                      <div><span className="text-muted">Stop</span><p className="font-semibold text-red-400">{s.stop}</p></div>
                    </div>
                  </GlassCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
            <p className="mt-8 text-center text-sm text-muted">
              Full access for registered clients. <Link to="/auth" className="text-emerald hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
