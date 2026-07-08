import { useTranslation } from "react-i18next";
import { FadeIn } from "@/components/motion/Motion";
import { Section, Container } from "@/components/ui/section";
import { PremiumImage } from "@/components/ui/premium-image";
import { IMAGES } from "@/constants/images";

export function EditorialSection() {
  const { t } = useTranslation();

  return (
    <Section variant="gradient">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <FadeIn>
            <PremiumImage
              src={IMAGES.about.team}
              alt={t("editorial.teamAlt")}
              aspect="video"
              overlay
              className="rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
            />
          </FadeIn>
          <FadeIn delay={0.12}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald">{t("editorial.eyebrow")}</p>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-gradient md:text-4xl lg:text-5xl">
              {t("editorial.title")}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted md:text-lg">
              {t("editorial.body")}
            </p>
            <div className="mt-10 grid grid-cols-2 gap-4">
              <PremiumImage src={IMAGES.about.advisor} alt={t("editorial.advisorAlt")} aspect="square" className="rounded-xl" />
              <PremiumImage src={IMAGES.lifestyle.workspace} alt={t("editorial.workspaceAlt")} aspect="square" className="rounded-xl" />
            </div>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
