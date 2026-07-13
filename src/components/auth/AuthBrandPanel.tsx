import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Shield } from "@/lib/icons";
import { BRAND } from "@/constants/brand";
import { Logo } from "@/components/brand/Logo";
import { IMAGES } from "@/constants/images";

const stats = [
  { valueKey: "auth.statAuc", labelKey: "auth.statAucLabel" },
  { valueKey: "auth.statInvestors", labelKey: "auth.statInvestorsLabel" },
  { valueKey: "auth.statUptime", labelKey: "auth.statUptimeLabel" },
] as const;

export function AuthBrandPanel() {
  const { t } = useTranslation();

  return (
    <div className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#09090b] p-10 text-[#fafafa] lg:flex lg:w-[52%] xl:w-[55%] xl:p-14">
      <img
        src={IMAGES.hero.office}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14]"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#09090b]/30 via-[#09090b]/85 to-[#09090b]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.12),transparent_55%)]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <Logo size="lg" wordmarkClassName="[&_span:first-child]:text-[#fafafa]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 max-w-lg"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-4 py-2 text-xs font-medium text-emerald">
          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
          {t("auth.panelBadge")}
        </div>
        <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-[#fafafa] xl:text-5xl">
          {t("auth.panelTitle1")}
          <br />
          <span className="text-gradient-emerald">{t("auth.panelTitle2")}</span>
        </h1>
        <p className="mt-6 text-base leading-relaxed text-[#9ca3af] xl:text-lg">
          {t("auth.panelSubtitle")}
        </p>

        <div className="mt-12 grid grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
            >
              <p className="font-display text-xl font-bold text-gradient-emerald xl:text-2xl">
                {t(stat.valueKey)}
              </p>
              <p className="mt-1 text-xs leading-snug text-[#9ca3af]">{t(stat.labelKey)}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="relative z-10 text-xs text-[#9ca3af]"
      >
        {t("auth.panelFooter", { year: new Date().getFullYear(), brand: BRAND.name })}
      </motion.p>
    </div>
  );
}

export function AuthFormHeader({ showBackLink = true }: { showBackLink?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <Logo size="md" />
        {showBackLink && (
          <Link to="/" className="text-sm text-emerald hover:underline">
            {t("auth.backToHome")}
          </Link>
        )}
      </div>
      <Link
        to="/"
        className="mb-8 hidden text-sm text-muted transition-colors hover:text-emerald lg:inline-flex"
      >
        ← {t("auth.backToHome")}
      </Link>
      <h2 className="font-display text-2xl font-bold text-foreground">{t("auth.welcomeBack")}</h2>
      <p className="mt-2 text-sm text-muted">{t("auth.signInDesc")}</p>
    </div>
  );
}
