import { useTranslation } from "react-i18next";
import { Lock, Shield, Eye, FileCheck } from "@/lib/icons";
import { BRAND } from "@/constants/brand";
import { IMAGES } from "@/constants/images";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Section, SectionHeader, Container } from "@/components/ui/section";
import { PremiumImage } from "@/components/ui/premium-image";

const features = [
  { icon: Lock, titleKey: "security.encryption", descKey: "security.encryptionDesc" },
  { icon: Shield, titleKey: "security.segregated", descKey: "security.segregatedDesc" },
  { icon: Eye, titleKey: "security.surveillance", descKey: "security.surveillanceDesc" },
  { icon: FileCheck, titleKey: "security.kyc", descKey: "security.kycDesc" },
] as const;

export function SecuritySection() {
  const { t } = useTranslation();

  return (
    <Section>
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <FadeIn>
            <PremiumImage
              src={IMAGES.security.datacenter}
              alt={t("security.datacenterAlt")}
              aspect="video"
              overlay
              className="rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
            />
          </FadeIn>
          <div>
            <SectionHeader
              eyebrow={t("security.eyebrow")}
              title={t("security.title")}
              subtitle={t("security.subtitle")}
              align="left"
              className="mb-10"
            />
            <StaggerContainer className="grid gap-4 sm:grid-cols-2">
              {features.map((f) => (
                <StaggerItem key={f.titleKey}>
                  <GlassCard className="!p-5" hover={false} elevated>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-emerald-subtle">
                      <f.icon className="h-5 w-5 text-emerald" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{t(f.titleKey)}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{t(f.descKey)}</p>
                  </GlassCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
            <FadeIn className="mt-8 text-sm text-muted">
              {t("common.registration")}: {BRAND.registrationNumber} &middot;{" "}
              <a href={`mailto:${BRAND.complianceEmail}`} className="text-emerald transition-opacity hover:opacity-80">
                {BRAND.complianceEmail}
              </a>
            </FadeIn>
          </div>
        </div>
      </Container>
    </Section>
  );
}
