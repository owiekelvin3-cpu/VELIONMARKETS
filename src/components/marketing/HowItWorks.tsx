import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { UserPlus, FileCheck, Wallet, TrendingUp } from "@/lib/icons";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { Section, SectionHeader, Container } from "@/components/ui/section";

const steps = [
  { icon: UserPlus, titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Desc" },
  { icon: FileCheck, titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Desc" },
  { icon: Wallet, titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Desc" },
  { icon: TrendingUp, titleKey: "howItWorks.step4Title", descKey: "howItWorks.step4Desc" },
] as const;

const PORTFOLIO_VIDEO_SRC = "/videos/portfolio-laptop.mp4";
const PORTFOLIO_POSTER_SRC = "/images/how-it-works-laptop-poster.png";

function PortfolioLaptopVideo() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const play = () => {
      void el.play().catch(() => {
        /* autoplay may be blocked until interaction */
      });
    };
    play();
    const onVisible = () => {
      if (document.visibilityState === "visible") play();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-border/60 bg-charcoal shadow-[0_32px_80px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-void/65 px-4 py-2 backdrop-blur-md">
        <span className="text-[11px] font-medium text-foreground/90">{t("howItWorks.videoLabel")}</span>
        <span className="rounded bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald">
          {t("common.live")}
        </span>
      </div>
      <video
        ref={videoRef}
        className="aspect-[3/4] w-full object-cover"
        src={PORTFOLIO_VIDEO_SRC}
        poster={PORTFOLIO_POSTER_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={t("howItWorks.laptopAlt")}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-void/85 via-void/35 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}

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
            <PortfolioLaptopVideo />
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
