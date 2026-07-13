import { primeNotificationSound, setNotificationSoundEnabled } from "@/lib/notification-sound";
import {
  beginPushPermissionRequest,
  setPushEnabledPreference,
} from "@/lib/push-notifications";

/** Ensure push + sound preferences are explicitly on unless the user turned them off. */
export function ensureNotificationDefaults() {
  setPushEnabledPreference(true);
  setNotificationSoundEnabled(true);
}

/**
 * Call at the start of a user gesture (login button, first dashboard click).
 * Primes sound and starts the browser permission prompt when still "default".
 */
export function prepareNotificationsOnUserGesture(): Promise<NotificationPermission> | null {
  ensureNotificationDefaults();
  primeNotificationSound();
  return beginPushPermissionRequest();
}
