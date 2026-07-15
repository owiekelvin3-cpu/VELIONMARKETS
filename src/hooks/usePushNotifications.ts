import { useCallback, useEffect, useState } from "react";
import { unlockNotificationAudio } from "@/lib/notification-sound";
import { ensureNotificationDefaults } from "@/lib/notification-preferences";
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

  const syncState = useCallback(() => {
    setSupported(isPushSupported());
    const perm = getNotificationPermission();
    setPermission(perm);
    setEnabled(getPushEnabledPreference() && perm === "granted");
  }, []);

  useEffect(() => {
    ensureNotificationDefaults();
    syncState();
  }, [syncState]);

  useEffect(() => {
    if (!userId || !supported) return;

    registerServiceWorker().then(() => {
      if (getPushEnabledPreference() && Notification.permission === "granted") {
        syncPushSubscription(userId);
      }
    });
  }, [userId, supported]);

  const requestPermission = useCallback(async () => {
    if (!userId) return permission;
    setBusy(true);
    unlockNotificationAudio();
    try {
      const result = await enablePushNotifications(userId);
      setPermission(result);
      setEnabled(result === "granted");
      return result;
    } finally {
      setBusy(false);
    }
  }, [userId, permission]);

  const enable = requestPermission;

  const disable = useCallback(async () => {
    if (!userId) return;
    setBusy(true);
    try {
      await disablePushNotifications(userId);
      setEnabled(false);
      setPermission(getNotificationPermission());
    } finally {
      setBusy(false);
    }
  }, [userId]);

  const toggle = useCallback(async () => {
    if (busy) return;
    if (enabled) {
      await disable();
    } else {
      await requestPermission();
    }
  }, [busy, enabled, disable, requestPermission]);

  return {
    supported,
    enabled,
    permission,
    busy,
    enable,
    disable,
    toggle,
    requestPermission,
    setEnabled: (value: boolean) => {
      setPushEnabledPreference(value);
      setEnabled(value && Notification.permission === "granted");
    },
  };
}
