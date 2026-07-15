import { primeNotificationSound, setNotificationSoundEnabled } from "@/lib/notification-sound";
import {
  beginPushPermissionRequest,
  setPushEnabledPreference,
} from "@/lib/push-notifications";

const PUSH_ENABLED_KEY = "velion-push-enabled";
const SOUND_ENABLED_KEY = "velion-notification-sound";

/** Seed push + sound preferences only when the user has never chosen. */
export function ensureNotificationDefaults() {
  try {
    if (localStorage.getItem(PUSH_ENABLED_KEY) === null) {
      setPushEnabledPreference(true);
    }
    if (localStorage.getItem(SOUND_ENABLED_KEY) === null) {
      setNotificationSoundEnabled(true);
    }
  } catch {
    /* private mode / blocked storage */
  }
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
