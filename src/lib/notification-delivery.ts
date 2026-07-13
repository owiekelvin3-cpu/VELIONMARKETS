import { dispatchNotificationToast } from "@/components/notifications/NotificationToast";
import { playNotificationSound } from "@/lib/notification-sound";
import { showBrowserNotification } from "@/lib/push-notifications";
import type { Notification } from "@/types/database";

export function deliverNotification(
  notification: Notification,
  options?: { url?: string; playSound?: boolean }
) {
  dispatchNotificationToast(notification);

  if (options?.playSound !== false) {
    void playNotificationSound();
  }

  void showBrowserNotification(notification.title, notification.message, {
    url: options?.url ?? "/dashboard",
    tag: notification.id,
  });
}
