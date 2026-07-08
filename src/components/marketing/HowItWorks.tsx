import { useTranslation } from "react-i18next";
import { UserPlus, FileCheck, Wallet, TrendingUp } from "@/lib/icons";
import { IMAGES } from "@/constants/images";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { Section, SectionHeader, Container } from "@/components/ui/section";
import { PremiumImage } from "@/components/ui/premium-image";

const steps = [
  { icon: UserPlus, titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Desc" },
  { icon: FileCheck, titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Desc" },
  { icon: Wallet, titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Desc" },
  { icon: TrendingUp, titleKey: "howItWorks.step4Title", descKey: "howItWorks.step4Desc" },
] as const;

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <Section variant="elevated">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <SectionHeader
              eyebrow={t("howItWorks.eyebrow")}
              title={t("howItWorks.title")}
              subtitle={t("howItWorks.subtitle")}
              align="left"
              className="mb-12 lg:mb-0"
            />
            <StaggerContainer className="grid gap-8 sm:grid-cols-2">
              {steps.map((step, i) => (
                <StaggerItem key={step.titleKey}>
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-emerald-subtle ring-1 ring-emerald/15">
                      <step.icon className="h-5 w-5 text-emerald" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald">
                        {t("howItWorks.step", { n: i + 1 })}
                      </span>
                      <h3 className="mt-1 font-display font-semibold text-foreground">{t(step.titleKey)}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(step.descKey)}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
          <FadeIn delay={0.15}>
            <PremiumImage
              src={IMAGES.lifestyle.laptop}
              alt={t("howItWorks.laptopAlt")}
              aspect="portrait"
              overlay
              className="mx-auto max-w-md rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.4)]"
            />
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
