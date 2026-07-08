import { useTranslation } from "react-i18next";
import { BRAND } from "@/constants/brand";
import { IMAGES } from "@/constants/images";
import { PageHero } from "@/components/marketing/PageHero";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";
import { PremiumImage } from "@/components/ui/premium-image";
import { Shield, Globe, Users, FileText, Lock, Eye } from "@/lib/icons";

export default function AboutPage() {
  const { t } = useTranslation();

  const values = [
    { icon: Shield, titleKey: "about.securityTitle", descKey: "about.securityDesc" },
    { icon: Globe, titleKey: "about.globalTitle", descKey: "about.globalDesc" },
    { icon: FileText, titleKey: "about.performanceTitle", descKey: "about.performanceDesc" },
    { icon: Users, titleKey: "about.deskTitle", descKey: "about.deskDesc" },
  ] as const;

  return (
    <>
      <PageHero
        badge={t("pages.aboutBadge")}
        title={t("pages.aboutTitle")}
        subtitle={t("pages.aboutSubtitle")}
        image={IMAGES.about.skyline}
      />
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <FadeIn>
              <GlassCard>
                <h2 className="text-2xl font-semibold text-foreground">{t("about.whoWeAre")}</h2>
                <p className="mt-4 leading-relaxed text-muted">{t("about.whoWeAreP1")}</p>
                <p className="mt-4 leading-relaxed text-muted">{t("about.whoWeAreP2")}</p>
              </GlassCard>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <PremiumImage src={IMAGES.about.meeting} alt={t("about.meetingAlt")} aspect="square" />
                <PremiumImage src={IMAGES.about.advisor} alt={t("about.advisorAlt")} aspect="square" />
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <PremiumImage
                src={IMAGES.about.team}
                alt={t("about.teamAlt")}
                aspect="portrait"
                overlay
                className="sticky top-24 shadow-2xl shadow-black/30"
              />
            </FadeIn>
          </div>

          <StaggerContainer className="mt-20 grid gap-6 md:grid-cols-2">
            {values.map((v) => (
              <StaggerItem key={v.titleKey}>
                <GlassCard>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald/10">
                    <v.icon className="h-6 w-6 text-emerald" />
                  </div>
                  <h3 className="text-lg font-semibold">{t(v.titleKey)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t(v.descKey)}</p>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn className="mx-auto mt-16 max-w-3xl">
            <GlassCard glow className="border-emerald/20">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Lock className="h-5 w-5 text-emerald" />
                {t("about.complianceTitle")}
              </h3>
              <div className="mt-4 space-y-3 text-sm text-muted">
                <div className="flex gap-2"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-emerald" /> {t("about.complianceKyc")}</div>
                <div className="flex gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald" /> {t("about.complianceEncryption")}</div>
                <p className="pt-2">{t("common.registration")}: {BRAND.registrationNumber}</p>
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
