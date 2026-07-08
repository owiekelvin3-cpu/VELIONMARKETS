import { useTranslation } from "react-i18next";
import { StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { CountUp } from "@/components/motion/CountUp";
import { Container, Section } from "@/components/ui/section";
import { Calendar, Users, Globe, Shield } from "@/lib/icons";
import { BRAND } from "@/constants/brand";

export function TrustBar() {
  const { t } = useTranslation();

  const stats = [
    { icon: Calendar, labelKey: "trustBar.yearsOperating", end: new Date().getFullYear() - BRAND.foundedYear, suffix: "+" },
    { icon: Users, labelKey: "trustBar.verifiedClients", end: 50000, suffix: "+" },
    { icon: Globe, labelKey: "trustBar.globalMarkets", end: 150, suffix: "+" },
    { icon: Shield, labelKey: "trustBar.uptimeSla", end: 99, suffix: ".9%" },
  ] as const;

  return (
    <Section className="section-padding-sm !py-16 md:!py-20" variant="elevated">
      <Container>
        <StaggerContainer className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.labelKey}>
              <div className="card-elevated rounded-2xl p-6 text-center sm:p-8">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-emerald-subtle ring-1 ring-emerald/20">
                  <s.icon className="h-5 w-5 text-emerald" aria-hidden="true" />
                </div>
                <p className="font-display text-3xl font-bold text-gradient-emerald md:text-4xl">
                  <CountUp end={s.end} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted sm:text-sm">{t(s.labelKey)}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </Container>
    </Section>
  );
}
