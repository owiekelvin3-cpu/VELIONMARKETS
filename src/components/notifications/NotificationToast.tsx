import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, X } from "@/lib/icons";
import type { Notification } from "@/types/database";
import { cn } from "@/lib/utils";

const EVENT_NAME = "velion:notification";

export function dispatchNotificationToast(notification: Notification) {
  window.dispatchEvent(new CustomEvent<Notification>(EVENT_NAME, { detail: notification }));
}

export function NotificationToast() {
  const { t } = useTranslation();
  const [toast, setToast] = useState<Notification | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const onNotify = (event: Event) => {
      const detail = (event as CustomEvent<Notification>).detail;
      setToast(detail);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 6000);
    };

    window.addEventListener(EVENT_NAME, onNotify);
    return () => {
      window.removeEventListener(EVENT_NAME, onNotify);
      clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto fixed bottom-4 right-4 z-[100] w-[min(100vw-2rem,22rem)]",
        "animate-in slide-in-from-bottom-4 fade-in duration-300"
      )}
      role="status"
    >
      <div className="flex gap-3 rounded-xl border border-emerald/25 bg-[#0a0a0c]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{toast.message}</p>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-emerald/80">
            {t("notifications.pushNew")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setToast(null)}
          className="shrink-0 rounded-lg p-1 text-muted hover:bg-white/5 hover:text-foreground"
          aria-label={t("notifications.dismissToast")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
