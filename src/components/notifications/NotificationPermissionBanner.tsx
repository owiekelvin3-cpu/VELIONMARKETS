import { useTranslation } from "react-i18next";
import { Bell } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { getPushEnabledPreference } from "@/lib/push-notifications";
import { primeNotificationSound } from "@/lib/notification-sound";

export function NotificationPermissionBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { supported, permission, busy, requestPermission } = usePushNotifications(user?.id);

  if (!user || !supported) return null;
  if (permission !== "default") return null;
  if (!getPushEnabledPreference()) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-emerald/25 bg-emerald/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald text-black shadow-sm">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{t("notifications.enableTitle")}</p>
          <p className="mt-0.5 text-xs text-muted">{t("notifications.enableDesc")}</p>
        </div>
      </div>
      <Button
        size="sm"
        className="rounded-full"
        disabled={busy}
        onClick={() => {
          primeNotificationSound();
          void requestPermission();
        }}
      >
        {t("notifications.enableButton")}
      </Button>
    </div>
  );
}
