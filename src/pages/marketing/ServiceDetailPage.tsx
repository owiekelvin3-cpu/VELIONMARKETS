import { useParams, Link } from "react-router-dom";
import { BRAND } from "@/constants/brand";
import { PageHero } from "@/components/marketing/PageHero";
import { SERVICE_IMAGES } from "@/constants/images";
import { FadeIn } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";
import { PremiumImage } from "@/components/ui/premium-image";
import { Button } from "@/components/ui/button";
import { Check } from "@/lib/icons";

const serviceData: Record<string, { title: string; description: string; features: string[]; details: string }> = {
  "hedge-funds": { title: "Hedge Funds", description: "Access diversified alternative investment strategies.", features: ["Multi-strategy portfolios", "Risk-adjusted returns", "Quarterly reporting", "Minimum $10,000", "Institution-grade custody"], details: "Our hedge fund offerings provide access to professionally managed alternative strategies designed for consistent risk-adjusted returns." },
  "copy-trading": { title: "Copy Trading", description: "Mirror verified professional traders.", features: ["Verified trader profiles", "Real-time mirroring", "Custom allocation limits", "Performance analytics", "Risk controls"], details: "Automatically replicate trades from experienced professionals with full transparency and control." },
  "crypto-mining": { title: "Crypto Mining", description: "Institutional-grade mining packages.", features: ["Multiple coin options", "Real-time dashboard", "Daily distributions", "Transparent fees", "Flexible packages"], details: "Access enterprise mining infrastructure without managing hardware." },
  forex: { title: "Forex Trading", description: "Trade global currency markets.", features: ["50+ pairs", "Competitive spreads", "Advanced charting", "Economic calendar", "24/5 access"], details: "Professional-grade tools and reliable execution across major currency pairs." },
  stocks: { title: "Stocks Trading", description: "Trade equities across major exchanges.", features: ["Global exchanges", "Research reports", "Portfolio analytics", "Low commissions", "Dividend tracking"], details: "Research-backed insights for active traders and long-term investors." },
};

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const service = serviceData[slug || ""] || serviceData["hedge-funds"];
  const image = SERVICE_IMAGES[slug || ""] || SERVICE_IMAGES["hedge-funds"];

  return (
    <>
      <PageHero badge="Service" title={service.title} subtitle={service.description} image={image} />
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <FadeIn className="mx-auto max-w-4xl">
            <PremiumImage
              src={image}
              alt={`${service.title} at ${BRAND.name}`}
              aspect="video"
              overlay
              className="mb-8 shadow-xl"
            />
            <GlassCard>
              <h2 className="text-xl font-semibold">Overview</h2>
              <p className="mt-4 text-muted leading-relaxed">{service.details}</p>
              <ul className="mt-8 space-y-3">
                {service.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted">
                    <Check className="h-4 w-4 text-emerald shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild><Link to="/auth?mode=register">Open Account</Link></Button>
                <Button variant="outline" asChild><Link to="/services">All Services</Link></Button>
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
