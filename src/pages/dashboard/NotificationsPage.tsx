import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCheck } from "@/lib/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import { NotificationList } from "@/components/notifications/NotificationList";
import { NotificationPermissionBanner } from "@/components/notifications/NotificationPermissionBanner";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { pathForNotification } from "@/lib/notification-routing";
import { cn } from "@/lib/utils";

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(user?.id, {
    pushTargetPath: "/dashboard/notifications",
    enableDelivery: false,
  });
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("dashboard.navGroupAccount")}
        title={t("notifications.title")}
        subtitle={t("notifications.pageSubtitle")}
        actions={
          unreadCount > 0 ? (
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => void markAllRead()}>
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t("notifications.markAllRead")}
            </Button>
          ) : undefined
        }
      />

      <NotificationPermissionBanner />

      <div className="inline-flex flex-wrap gap-0.5 rounded-full border border-border bg-secondary/30 p-1">
        {(
          [
            { id: "all" as const, label: t("notifications.filterAll") },
            {
              id: "unread" as const,
              label: t("notifications.filterUnread", { count: unreadCount }),
            },
          ]
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              filter === f.id
                ? "bg-foreground text-background shadow-sm"
                : "text-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DashboardSheet flush className="overflow-hidden !p-0">
        <NotificationList
          items={filtered}
          loading={loading}
          emptyLabel={
            filter === "unread" ? t("notifications.emptyUnread") : t("notifications.empty")
          }
          onItemClick={(n) => {
            if (!n.read) void markRead(n.id);
            navigate(pathForNotification(n.title, !!isAdmin));
          }}
        />
      </DashboardSheet>
    </div>
  );
}
