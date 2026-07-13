import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  completePushSetup,
  getNotificationPermission,
  getPushEnabledPreference,
  initPushNotifications,
  isPushSupported,
} from "@/lib/push-notifications";
import {
  ensureNotificationDefaults,
  prepareNotificationsOnUserGesture,
} from "@/lib/notification-preferences";

/** Registers SW, syncs push when granted, and auto-enables on first dashboard interaction. */
export function PushNotificationInit() {
  const { user } = useAuth();
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    ensureNotificationDefaults();
  }, []);

  useEffect(() => {
    if (!user?.id || !isPushSupported() || !getPushEnabledPreference()) return;
    if (startedFor.current === user.id) return;
    startedFor.current = user.id;

    const permission = getNotificationPermission();

    if (permission === "granted") {
      void initPushNotifications(user.id);
      return;
    }

    if (permission === "denied") return;

    const enableOnInteraction = () => {
      cleanup();
      const permissionPromise = prepareNotificationsOnUserGesture();
      void completePushSetup(user.id, permissionPromise);
    };

    const cleanup = () => {
      document.removeEventListener("click", enableOnInteraction, true);
      document.removeEventListener("keydown", enableOnInteraction, true);
      document.removeEventListener("touchstart", enableOnInteraction, true);
    };

    document.addEventListener("click", enableOnInteraction, { capture: true, once: true });
    document.addEventListener("keydown", enableOnInteraction, { capture: true, once: true });
    document.addEventListener("touchstart", enableOnInteraction, { capture: true, once: true });

    return cleanup;
  }, [user?.id]);

  return null;
}
