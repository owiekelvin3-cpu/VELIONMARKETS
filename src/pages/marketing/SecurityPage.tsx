import { useTranslation } from "react-i18next";
import { SecuritySection } from "@/components/marketing/SecuritySection";
import { PageHero } from "@/components/marketing/PageHero";
import { IMAGES } from "@/constants/images";
import { StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";
import { PremiumImage } from "@/components/ui/premium-image";
import { Lock, Server, Key, Shield } from "@/lib/icons";

const measures = [
  { icon: Lock, titleKey: "security.dataEncryption", descKey: "security.dataEncryptionDesc" },
  { icon: Server, titleKey: "security.infrastructure", descKey: "security.infrastructureDesc" },
  { icon: Key, titleKey: "security.accessControls", descKey: "security.accessControlsDesc" },
  { icon: Shield, titleKey: "security.audit", descKey: "security.auditDesc" },
] as const;

export default function SecurityPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero
        badge={t("security.eyebrow")}
        title={t("security.pageTitle")}
        subtitle={t("security.pageSubtitle")}
        image={IMAGES.security.encryption}
      />
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <PremiumImage
            src={IMAGES.security.datacenter}
            alt={t("security.datacenterAlt")}
            aspect="wide"
            overlay
            className="mb-12 shadow-2xl"
          />
          <StaggerContainer className="grid gap-6 md:grid-cols-2">
            {measures.map((m) => (
              <StaggerItem key={m.titleKey}>
                <GlassCard>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/10">
                    <m.icon className="h-5 w-5 text-emerald" />
                  </div>
                  <h3 className="font-semibold">{t(m.titleKey)}</h3>
                  <p className="mt-2 text-sm text-muted">{t(m.descKey)}</p>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
      <SecuritySection />
    </>
  );
}
