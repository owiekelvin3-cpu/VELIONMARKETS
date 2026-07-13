import { supabase } from "@/lib/supabase";

const PUSH_ENABLED_KEY = "velion-push-enabled";
const PUSH_PROMPTED_KEY = "velion-push-prompted";

export function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window;
}

/** Notifications are on by default unless the user explicitly turns them off. */
export function getPushEnabledPreference(): boolean {
  return localStorage.getItem(PUSH_ENABLED_KEY) !== "false";
}

export function setPushEnabledPreference(enabled: boolean) {
  localStorage.setItem(PUSH_ENABLED_KEY, enabled ? "true" : "false");
}

export function hasBeenPromptedForPush(): boolean {
  return localStorage.getItem(PUSH_PROMPTED_KEY) === "true";
}

export function markPushPrompted() {
  localStorage.setItem(PUSH_PROMPTED_KEY, "true");
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.warn("[push] Service worker registration failed:", error);
    return null;
  }
}

export async function showBrowserNotification(
  title: string,
  body: string,
  options?: { url?: string; tag?: string; silent?: boolean }
) {
  if (!isPushSupported() || Notification.permission !== "granted" || !getPushEnabledPreference()) {
    return;
  }

  const payload = {
    body,
    icon: "/logo.svg",
    badge: "/favicon.svg",
    tag: options?.tag ?? "velion-notification",
    renotify: true,
    silent: options?.silent ?? false,
    vibrate: [100, 50, 100] as number[],
    data: { url: options?.url ?? "/dashboard" },
  };

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, payload);
    return;
  } catch {
    /* fall through */
  }

  try {
    new Notification(title, payload);
  } catch (error) {
    console.warn("[push] Could not show notification:", error);
  }
}

async function savePushSubscription(userId: string, subscription: PushSubscription) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) console.warn("[push] Failed to save subscription:", error.message);
}

async function removePushSubscriptions(userId: string) {
  await supabase.from("push_subscriptions").delete().eq("user_id", userId);
}

async function subscribeToWebPush(userId: string) {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidPublicKey) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    if (subscription) {
      await savePushSubscription(userId, subscription);
    }
  } catch (error) {
    console.warn("[push] Web Push subscription skipped:", error);
  }
}

/** Start permission prompt inside a user-gesture handler (do not await before calling). */
export function beginPushPermissionRequest(): Promise<NotificationPermission> | null {
  if (!isPushSupported()) return null;

  markPushPrompted();
  void registerServiceWorker();

  if (Notification.permission !== "default") {
    return Promise.resolve(Notification.permission);
  }

  return Notification.requestPermission();
}

export async function completePushSetup(
  userId: string,
  permissionPromise?: Promise<NotificationPermission> | null
): Promise<NotificationPermission | "unsupported"> {
  if (!isPushSupported()) return "unsupported";

  setPushEnabledPreference(true);
  await registerServiceWorker();

  const permission = permissionPromise ? await permissionPromise : Notification.permission;

  if (permission === "granted") {
    await subscribeToWebPush(userId);
  } else if (permission === "denied") {
    setPushEnabledPreference(false);
  }

  return permission;
}

export async function enablePushNotifications(userId: string): Promise<NotificationPermission | "unsupported"> {
  if (!isPushSupported()) return "unsupported";

  const permissionPromise = beginPushPermissionRequest();
  return completePushSetup(userId, permissionPromise);
}

export async function disablePushNotifications(userId: string) {
  setPushEnabledPreference(false);

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  } catch {
    /* ignore */
  }

  await removePushSubscriptions(userId);
}

export async function syncPushSubscription(userId: string) {
  if (!isPushSupported() || !getPushEnabledPreference() || Notification.permission !== "granted") return;

  await registerServiceWorker();
  await subscribeToWebPush(userId);
}

/** Register SW when permission already granted — does not prompt (browser requires user gesture). */
export async function initPushNotifications(userId: string): Promise<void> {
  if (!isPushSupported() || !getPushEnabledPreference()) return;

  await registerServiceWorker();

  if (Notification.permission === "granted") {
    await syncPushSubscription(userId);
  }
}
