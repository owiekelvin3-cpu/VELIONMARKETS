import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "@/lib/icons";
import type { Notification } from "@/types/database";

const EVENT_NAME = "velion:notification";

export function dispatchNotificationToast(notification: Notification) {
  window.dispatchEvent(new CustomEvent<Notification>(EVENT_NAME, { detail: notification }));
}

/** Apple-style banner: always drops in from the top so it never covers the keyboard. */
export function NotificationToast() {
  const { t } = useTranslation();
  const [toast, setToast] = useState<Notification | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const onNotify = (event: Event) => {
      const detail = (event as CustomEvent<Notification>).detail;
      setToast(detail);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 5500);
    };

    window.addEventListener(EVENT_NAME, onNotify);
    return () => {
      window.removeEventListener(EVENT_NAME, onNotify);
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[120] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4"
          role="status"
          aria-live="polite"
        >
          <motion.div
            key={toast.id}
            initial={{ y: -120, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -120, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto w-full max-w-md"
          >
            <div className="flex gap-3 rounded-2xl border border-border/80 bg-card/95 p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl ring-1 ring-white/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                <Bell className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="truncate text-sm font-semibold text-foreground">{toast.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-secondary hover:text-foreground"
                aria-label={t("notifications.dismissToast")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
