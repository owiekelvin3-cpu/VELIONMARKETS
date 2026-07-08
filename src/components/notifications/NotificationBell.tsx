import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const pushTargetPath = profile?.role === "admin" ? "/dashboard/admin" : "/dashboard";
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(user?.id, {
    pushTargetPath,
  });
  const { supported, enabled, permission, busy, toggle } = usePushNotifications(user?.id);
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("notifications.bellLabel")}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald px-1 text-[10px] font-bold text-black">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <p className="font-display text-sm font-semibold text-foreground">{t("notifications.title")}</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-muted">{t("notifications.loading")}</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">{t("notifications.empty")}</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (!n.read) markRead(n.id);
                }}
                className={cn(
                  "w-full border-b border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.03]",
                  !n.read && "bg-emerald/[0.04]"
                )}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald" />}
                  <div className={cn("min-w-0 flex-1", n.read && "pl-4")}>
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{n.message}</p>
                    <p className="mt-1 text-[10px] text-muted/70">{formatDate(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {supported && (
          <div className="border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{t("notifications.pushTitle")}</p>
                <p className="text-[10px] text-muted">
                  {permission === "denied"
                    ? t("notifications.pushBlocked")
                    : t("notifications.pushHint")}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={enabled && permission === "granted" ? "default" : "outline"}
                className={cn(!enabled && "border-white/10")}
                disabled={busy || permission === "denied"}
                onClick={toggle}
              >
                {permission === "granted" && enabled
                  ? t("notifications.pushOn")
                  : enabled
                    ? t("notifications.pushEnable")
                    : t("notifications.pushOff")}
              </Button>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
