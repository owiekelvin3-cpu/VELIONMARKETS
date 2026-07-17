import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, CheckCheck } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { primeNotificationSound } from "@/lib/notification-sound";
import { pathForNotification } from "@/lib/notification-routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationList } from "@/components/notifications/NotificationList";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const inboxPath = isAdmin ? "/dashboard/admin" : "/dashboard/notifications";
  const pushTargetPath = isAdmin ? "/dashboard/admin" : "/dashboard/notifications";
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(user?.id, {
    pushTargetPath,
  });
  const { supported, enabled, permission, busy, toggle } = usePushNotifications(user?.id);
  const [open, setOpen] = useState(false);

  const preview = notifications.slice(0, 8);

  const openNotification = (n: (typeof notifications)[number]) => {
    if (!n.read) void markRead(n.id);
    setOpen(false);
    navigate(pathForNotification(n.title, !!isAdmin));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-visible rounded-full",
            "border border-border bg-surface-elevated text-foreground shadow-sm",
            "transition-colors hover:border-emerald/35 hover:bg-secondary hover:text-foreground",
            "data-[state=open]:border-emerald/35 data-[state=open]:bg-surface-elevated",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          aria-label={t("notifications.bellLabel")}
        >
          <Bell className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-emerald px-1 text-[10px] font-bold leading-none text-[#0c0c0e] ring-2 ring-surface-elevated"
              aria-hidden="true"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[min(100vw-1.5rem,22rem)] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-elevated px-4 py-3">
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-foreground">{t("notifications.title")}</p>
            {unreadCount > 0 && (
              <p className="text-[11px] text-muted">
                {t("notifications.unreadCount", { count: unreadCount })}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto bg-surface-elevated">
          <NotificationList
            items={preview}
            loading={loading}
            onItemClick={openNotification}
          />
        </div>

        <div className="border-t border-border bg-surface-elevated px-3 py-2.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(inboxPath);
            }}
            className="w-full rounded-lg px-2 py-2 text-center text-xs font-semibold text-emerald transition-colors hover:bg-emerald/10"
          >
            {t("notifications.viewAll")}
          </button>
        </div>

        {supported && (
          <div className="border-t border-border bg-surface-elevated px-4 py-3">
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
                className={cn(!enabled && "border-border")}
                disabled={busy || permission === "denied"}
                onClick={() => {
                  primeNotificationSound();
                  void toggle();
                }}
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
