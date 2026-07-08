import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Shield, Lock, Activity } from "@/lib/icons";
import { Logo } from "@/components/brand/Logo";
import { BRAND } from "@/constants/brand";

export function AdminBrandPanel() {
  const { t } = useTranslation();

  return (
    <div className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#060608] p-10 lg:flex lg:w-[48%] xl:p-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(201,162,39,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.06),transparent_55%)]" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
        <Logo size="lg" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 max-w-lg"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-xs font-medium text-gold">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          {t("auth.restricted")}
        </div>
        <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground">
          {t("admin.brandTitle")}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-muted">
          {t("admin.brandSubtitle", { brand: BRAND.name })}
        </p>

        <div className="mt-12 space-y-4">
          {[
            { icon: Shield, text: t("admin.brandPoint1") },
            { icon: Activity, text: t("admin.brandPoint2") },
            { icon: Lock, text: t("admin.brandPoint3") },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex items-center gap-3 text-sm text-muted"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-gold">
                <item.icon className="h-4 w-4" />
              </div>
              {item.text}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <p className="relative z-10 text-xs text-muted/60">
        © {new Date().getFullYear()} {BRAND.name}. {t("admin.restrictedFooter")}
      </p>
    </div>
  );
}
