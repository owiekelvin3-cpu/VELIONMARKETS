/* VELION MARKETS — Web push service worker */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "VELION MARKETS", body: "You have a new notification.", url: "/dashboard", silent: false };

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/logo.svg",
      badge: "/favicon.svg",
      tag: payload.tag || "velion-notification",
      renotify: true,
      silent: payload.silent === true,
      vibrate: [100, 50, 100],
      data: { url: payload.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  const target = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus().then((focused) => {
            if ("navigate" in focused) {
              return focused.navigate(target);
            }
          });
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(target);
      }
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data?.type !== "SHOW_NOTIFICATION") return;

  const { title, body, url, tag, silent } = event.data;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo.svg",
      badge: "/favicon.svg",
      tag: tag || "velion-notification",
      renotify: true,
      silent: silent === true,
      vibrate: [100, 50, 100],
      data: { url: url || "/dashboard" },
    })
  );
});
