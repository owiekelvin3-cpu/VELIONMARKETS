import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight } from "@/lib/icons";
import { BRAND } from "@/constants/brand";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/section";

const PLATFORM_VIDEO_SRC = "/videos/platform.mp4";
const HERO_BG_SRC = "/images/hero-earth-orbit.png";

function PlatformHeroVideo() {
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
    <div className="relative overflow-hidden rounded-none border-y border-border bg-charcoal shadow-[0_24px_60px_rgba(15,23,42,0.12)] sm:rounded-2xl sm:border sm:shadow-[0_40px_100px_rgba(15,23,42,0.14)] sm:ring-1 sm:ring-border">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-border bg-void/70 px-4 py-2.5 backdrop-blur-md sm:px-5">
        <span className="text-xs font-medium text-foreground/90">
          {t("hero.videoLabel", { brand: BRAND.shortName })}
        </span>
        <span className="rounded bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald">
          {t("common.live")}
        </span>
      </div>

      <video
        ref={videoRef}
        className="aspect-[16/9] w-full object-cover object-top sm:aspect-[21/10] lg:aspect-[2.2/1]"
        src={PLATFORM_VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={t("hero.videoAlt")}
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-void/80 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden pb-10 pt-6 md:pb-16 md:pt-10">
      {/* Earth-orbit backdrop — hero copy block only */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(100%,34rem)] md:h-[min(100%,38rem)]" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${HERO_BG_SRC}')` }}
        />
        <div className="absolute inset-0 bg-background/45 dark:bg-[#03040a]/55" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <Container className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 font-display text-sm font-semibold tracking-[0.18em] text-emerald uppercase"
          >
            {BRAND.name}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl xl:text-[4rem]"
          >
            <span className="text-gradient">{t("hero.title1")}</span>
            <br />
            <span className="text-gradient-emerald">{t("hero.title2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg"
          >
            {t("hero.subtitle", { brandName: BRAND.name })}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
          >
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/auth?mode=register">
                {t("common.getStarted")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <a href="#markets">{t("hero.exploreMarkets")}</a>
            </Button>
          </motion.div>
        </div>
      </Container>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mt-10 md:mt-14"
      >
        <Container className="px-0 sm:px-6 lg:px-8">
          <PlatformHeroVideo />
        </Container>
      </motion.div>
    </section>
  );
}
