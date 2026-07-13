import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { LogoIcon } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export function LoadingScreen({ fullScreen = false }: { fullScreen?: boolean }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "min-h-screen min-h-dvh bg-gradient-void" : "min-h-[50vh]"
      )}
      role="status"
      aria-label={t("common.loading")}
    >
      <motion.div
        className="relative flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <LogoIcon className="h-14 w-14" />
        </motion.div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{t("common.loading")}</p>
      </motion.div>
    </div>
  );
}
