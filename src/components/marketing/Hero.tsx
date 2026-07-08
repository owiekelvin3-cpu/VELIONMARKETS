import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight, Shield, TrendingUp, Sparkles, Lock } from "@/lib/icons";
import { IMAGES } from "@/constants/images";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { PremiumImage } from "@/components/ui/premium-image";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const chartData = [
  { v: 42 }, { v: 48 }, { v: 45 }, { v: 52 }, { v: 58 }, { v: 55 },
  { v: 62 }, { v: 68 }, { v: 65 }, { v: 72 }, { v: 78 }, { v: 85 },
  { v: 82 }, { v: 88 }, { v: 95 }, { v: 92 }, { v: 98 }, { v: 100 },
];

export function Hero() {
  const { t } = useTranslation();

  const trustBadges = [
    { icon: Shield, textKey: "common.segregatedCustody" },
    { icon: Lock, textKey: "common.encrypted" },
    { icon: TrendingUp, textKey: "common.uptime" },
  ] as const;

  return (
    <section className="relative overflow-hidden pb-20 pt-8 md:pb-32 md:pt-12 lg:pb-40">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" aria-hidden="true" />
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20 xl:gap-24">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-white/[0.06] to-transparent px-5 py-2.5 text-sm text-muted"
            >
              <Sparkles className="h-4 w-4 text-emerald" aria-hidden="true" />
              <span>{t("hero.badge")}</span>
              <ArrowRight className="h-3 w-3 text-emerald" aria-hidden="true" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 32, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.85, delay: 0.1 }}
              className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl xl:text-[4.25rem]"
            >
              <span className="text-gradient">{t("hero.title1")}</span>
              <br />
              <span className="text-gradient-emerald">{t("hero.title2")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted md:text-lg lg:mx-0"
            >
              {t("hero.subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start justify-center"
            >
              <Button size="lg" asChild>
                <Link to="/auth?mode=register">
                  {t("common.openAccount")} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/services">{t("common.exploreServices")}</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 lg:justify-start"
            >
              {trustBadges.map(({ icon: Icon, textKey }) => (
                <span key={textKey} className="flex items-center gap-2 text-xs font-medium text-muted">
                  <Icon className="h-4 w-4 text-emerald" aria-hidden="true" />
                  {t(textKey)}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 48, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <PremiumImage
              src={IMAGES.hero.analytics}
              alt={t("hero.chartAlt")}
              aspect="video"
              overlay
              className="rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
            />

            <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
              <div className="rounded-2xl glass-strong p-5 glow-emerald-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">{t("hero.portfolio")}</p>
                    <p className="font-display text-2xl font-bold text-gradient-emerald">+24.8%</p>
                  </div>
                  <span className="rounded-full bg-gradient-emerald-subtle px-3 py-1 text-xs font-semibold text-emerald ring-1 ring-emerald/20">
                    {t("common.live")}
                  </span>
                </div>
                <div className="h-28 sm:h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="heroChart" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#heroChart)" animationDuration={2200} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
