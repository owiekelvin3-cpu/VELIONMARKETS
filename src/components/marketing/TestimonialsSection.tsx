import { useTranslation } from "react-i18next";
import { Star } from "@/lib/icons";
import { IMAGES } from "@/constants/images";
import { StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { Section, SectionHeader, Container } from "@/components/ui/section";
import { GlassCard } from "@/components/ui/glass-card";

const testimonials = [
  { name: "James Richardson", contentKey: "testimonials.t1", roleKey: "testimonials.r1", avatar: IMAGES.avatars.james },
  { name: "Sarah Mitchell", contentKey: "testimonials.t2", roleKey: "testimonials.r2", avatar: IMAGES.avatars.sarah },
  { name: "Michael Torres", contentKey: "testimonials.t3", roleKey: "testimonials.r3", avatar: IMAGES.avatars.michael },
  { name: "Emma Walsh", contentKey: "testimonials.t4", roleKey: "testimonials.r4", avatar: IMAGES.avatars.emma },
  { name: "David Harrison", contentKey: "testimonials.t5", roleKey: "testimonials.r5", avatar: IMAGES.avatars.david },
  { name: "Lisa Morgan", contentKey: "testimonials.t6", roleKey: "testimonials.r6", avatar: IMAGES.avatars.lisa },
] as const;

export function TestimonialsSection() {
  const { t } = useTranslation();

  return (
    <Section variant="elevated">
      <Container>
        <SectionHeader
          eyebrow={t("testimonials.eyebrow")}
          title={t("testimonials.title")}
          subtitle={t("testimonials.subtitle")}
        />
        <StaggerContainer className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((item) => (
            <StaggerItem key={item.name}>
              <GlassCard className="h-full !p-6 md:!p-8" elevated hover={false}>
                <div className="mb-5 flex items-center gap-4">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    loading="lazy"
                    className="h-12 w-12 rounded-full object-cover object-top ring-2 ring-emerald/25"
                  />
                  <div>
                    <p className="font-display font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted">{t(item.roleKey)}</p>
                  </div>
                </div>
                <div className="mb-4 flex gap-0.5" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-emerald text-emerald" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted">&ldquo;{t(item.contentKey)}&rdquo;</p>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Container>
    </Section>
  );
}
