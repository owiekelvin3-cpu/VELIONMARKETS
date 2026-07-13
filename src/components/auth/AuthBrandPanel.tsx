import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { IMAGES } from "@/constants/images";

/** TradingView-style left brand panel — cinematic image + slogan. */
export function AuthBrandPanel() {
  const { t } = useTranslation();

  return (
    <div className="relative hidden h-full min-h-[560px] overflow-hidden rounded-l-3xl lg:block lg:w-1/2">
      <img
        src={IMAGES.auth.panel}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/50" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald/10 via-transparent to-amber-600/20" />

      {/* Chart-like light beams — TradingView astronaut panel vibe */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[55%] items-end justify-center gap-1.5 px-10 opacity-40" aria-hidden="true">
        {Array.from({ length: 28 }).map((_, i) => {
          const h = 28 + ((i * 17) % 72);
          return (
            <span
              key={i}
              className="w-[3px] rounded-t-full bg-gradient-to-t from-amber-400/80 via-emerald/50 to-transparent"
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 flex h-full flex-col px-10 pb-10 pt-12 xl:px-14"
      >
        <h2 className="mx-auto max-w-sm text-center font-display text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
          {t("auth.sloganLine1")}
          <br />
          {t("auth.sloganLine2")}
        </h2>
        <p className="mt-auto text-center text-xs text-white/55">{t("auth.panelFooterShort")}</p>
      </motion.div>
    </div>
  );
}
