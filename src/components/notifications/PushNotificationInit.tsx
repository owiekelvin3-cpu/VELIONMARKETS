import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  autoEnablePushNotifications,
  getPushEnabledPreference,
  isPushSupported,
  registerServiceWorker,
  syncPushSubscription,
} from "@/lib/push-notifications";

/** Auto-enables browser push for signed-in users (on by default after signup). */
export function PushNotificationInit() {
  const { user } = useAuth();
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || !isPushSupported()) return;
    if (startedFor.current === user.id) return;
    startedFor.current = user.id;

    if (!getPushEnabledPreference()) return;

    if (Notification.permission === "granted") {
      registerServiceWorker().then(() => syncPushSubscription(user.id));
      return;
    }

    void autoEnablePushNotifications(user.id);
  }, [user?.id]);

  return null;
}
