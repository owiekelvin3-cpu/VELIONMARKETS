import { useCallback, useEffect, useState } from "react";
import {
  disablePushNotifications,
  enablePushNotifications,
  getNotificationPermission,
  getPushEnabledPreference,
  isPushSupported,
  registerServiceWorker,
  setPushEnabledPreference,
  syncPushSubscription,
} from "@/lib/push-notifications";

export function usePushNotifications(userId: string | undefined) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    const perm = getNotificationPermission();
    setPermission(perm);
    setEnabled(getPushEnabledPreference() && perm !== "denied");
  }, []);

  useEffect(() => {
    if (!userId || !supported) return;

    registerServiceWorker().then(() => {
      if (getPushEnabledPreference() && Notification.permission === "granted") {
        syncPushSubscription(userId);
      }
    });
  }, [userId, supported]);

  const enable = useCallback(async () => {
    if (!userId) return permission;
    setBusy(true);
    const result = await enablePushNotifications(userId);
    setPermission(result);
    setEnabled(result === "granted" || (getPushEnabledPreference() && result !== "denied"));
    setBusy(false);
    return result;
  }, [userId, permission]);

  const disable = useCallback(async () => {
    if (!userId) return;
    setBusy(true);
    await disablePushNotifications(userId);
    setEnabled(false);
    setBusy(false);
  }, [userId]);

  const toggle = useCallback(async () => {
    if (enabled) {
      await disable();
    } else {
      await enable();
    }
  }, [enabled, enable, disable]);

  return {
    supported,
    enabled,
    permission,
    busy,
    enable,
    disable,
    toggle,
    setEnabled: (value: boolean) => {
      setPushEnabledPreference(value);
      setEnabled(value);
    },
  };
}
