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

function markPushPrompted() {
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
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function showBrowserNotification(
  title: string,
  body: string,
  options?: { url?: string; tag?: string }
) {
  if (!isPushSupported() || Notification.permission !== "granted" || !getPushEnabledPreference()) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  if (registration.active) {
    registration.active.postMessage({
      type: "SHOW_NOTIFICATION",
      title,
      body,
      url: options?.url ?? "/dashboard",
      tag: options?.tag,
    });
    return;
  }

  await registration.showNotification(title, {
    body,
    icon: "/logo.svg",
    badge: "/favicon.svg",
    tag: options?.tag ?? "velion-notification",
    data: { url: options?.url ?? "/dashboard" },
  });
}

async function savePushSubscription(userId: string, subscription: PushSubscription) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

  await supabase.from("push_subscriptions").upsert(
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
}

async function removePushSubscriptions(userId: string) {
  await supabase.from("push_subscriptions").delete().eq("user_id", userId);
}

export async function enablePushNotifications(userId: string): Promise<NotificationPermission | "unsupported"> {
  if (!isPushSupported()) return "unsupported";

  markPushPrompted();
  await registerServiceWorker();
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    if (permission === "denied") {
      setPushEnabledPreference(false);
    }
    return permission;
  }

  setPushEnabledPreference(true);

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (vapidPublicKey) {
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
    } catch {
      /* Web Push subscription optional — in-app + SW notifications still work */
    }
  }

  return permission;
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

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidPublicKey) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await savePushSubscription(userId, subscription);
    }
  } catch {
    /* ignore */
  }
}

/** Turn notifications on for new users — requests permission when still default. */
export async function autoEnablePushNotifications(userId: string): Promise<void> {
  if (!isPushSupported() || !getPushEnabledPreference()) return;

  setPushEnabledPreference(true);
  await registerServiceWorker();

  if (Notification.permission === "granted") {
    await syncPushSubscription(userId);
    return;
  }

  if (Notification.permission === "default" && !hasBeenPromptedForPush()) {
    await enablePushNotifications(userId);
  }
}
