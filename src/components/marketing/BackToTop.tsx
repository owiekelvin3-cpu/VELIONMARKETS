import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpFromLine } from "@/lib/icons";
import { cn } from "@/lib/utils";

const SHOW_AFTER_PX = 480;

/** Floating control that smooth-scrolls back to the top of the page. */
export function BackToTop({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label={t("common.backToTop")}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40",
        "flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/90 text-emerald shadow-lg backdrop-blur-md",
        "transition-all duration-300 hover:border-emerald/40 hover:bg-emerald hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40",
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        className
      )}
    >
      <ArrowUpFromLine className="h-4 w-4" />
    </button>
  );
}
