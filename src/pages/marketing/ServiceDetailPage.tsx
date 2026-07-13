import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BRAND } from "@/constants/brand";
import { PageHero } from "@/components/marketing/PageHero";
import { SERVICE_IMAGES } from "@/constants/images";
import { FadeIn } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";
import { PremiumImage } from "@/components/ui/premium-image";
import { Button } from "@/components/ui/button";
import { Check } from "@/lib/icons";

const SERVICE_KEYS: Record<string, string> = {
  "hedge-funds": "hedgeFunds",
  "copy-trading": "copyTrading",
  "crypto-mining": "cryptoMining",
  forex: "forex",
  stocks: "stocks",
};

export default function ServiceDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const serviceKey = SERVICE_KEYS[slug || ""] || "hedgeFunds";
  const base = `serviceDetail.${serviceKey}`;
  const image = SERVICE_IMAGES[slug || ""] || SERVICE_IMAGES["hedge-funds"];
  const title = t(`${base}.title`);
  const features = t(`${base}.features`, { returnObjects: true });
  const featureList = Array.isArray(features) ? features : [];

  return (
    <>
      <PageHero badge={t("pages.serviceBadge")} title={title} subtitle={t(`${base}.description`)} image={image} />
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <FadeIn className="mx-auto max-w-4xl">
            <PremiumImage
              src={image}
              alt={`${title} at ${BRAND.name}`}
              aspect="video"
              overlay
              className="mb-8 shadow-xl"
            />
            <GlassCard>
              <h2 className="text-xl font-semibold">{t("pages.serviceOverview")}</h2>
              <p className="mt-4 text-muted leading-relaxed">{t(`${base}.details`)}</p>
              <ul className="mt-8 space-y-3">
                {featureList.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted">
                    <Check className="h-4 w-4 text-emerald shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild>
                  <Link to="/auth?mode=register">{t("common.openAccount")}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/services">{t("pages.allServices")}</Link>
                </Button>
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
