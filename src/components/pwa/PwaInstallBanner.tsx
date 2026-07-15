import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowDownToLine, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  dismissInstallPrompt,
  isStandaloneDisplay,
  promptPwaInstall,
  subscribeInstallPrompt,
  wasInstallDismissed,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa";
import { cn } from "@/lib/utils";

/** Native-feeling “Install app” prompt when the browser allows it. */
export function PwaInstallBanner({ className }: { className?: string }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const hideOnAdmin = location.pathname.startsWith("/dashboard/admin");

  useEffect(() => {
    if (isStandaloneDisplay() || wasInstallDismissed()) return;
    return subscribeInstallPrompt((event) => {
      setPromptEvent(event);
      setVisible(Boolean(event));
    });
  }, []);

  if (hideOnAdmin || !visible || !promptEvent) return null;

  const close = () => {
    dismissInstallPrompt();
    setVisible(false);
  };

  const install = async () => {
    setInstalling(true);
    try {
      await promptPwaInstall();
      setVisible(false);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[70] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4",
        className
      )}
      role="dialog"
      aria-label={t("pwa.installTitle")}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-xl">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald/15 text-emerald">
          <ArrowDownToLine className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{t("pwa.installTitle")}</p>
          <p className="truncate text-xs text-muted">{t("pwa.installDesc")}</p>
        </div>
        <Button size="sm" className="shrink-0 rounded-full" onClick={() => void install()} disabled={installing}>
          {installing ? t("common.loading") : t("pwa.install")}
        </Button>
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-secondary hover:text-foreground"
          aria-label={t("common.close")}
          onClick={close}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
