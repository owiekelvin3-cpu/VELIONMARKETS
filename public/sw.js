/* VELION MARKETS — Web push service worker */

self.addEventListener("push", (event) => {
  let payload = { title: "VELION MARKETS", body: "You have a new notification.", url: "/dashboard" };

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
      icon: "/velion-markets-logo.png",
      badge: "/favicon.svg",
      tag: payload.tag || "velion-notification",
      renotify: true,
      data: { url: payload.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SHOW_NOTIFICATION") return;

  const { title, body, url, tag } = event.data;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/velion-markets-logo.png",
      badge: "/favicon.svg",
      tag: tag || "velion-notification",
      renotify: true,
      data: { url: url || "/dashboard" },
    })
  );
});
