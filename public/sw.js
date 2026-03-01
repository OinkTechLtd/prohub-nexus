// ProHub Nexus Service Worker v2.0 - Network First
const CACHE_NAME = "prohub-v2";

// Install - skip waiting to activate immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

// Activate - delete all old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - always network first, no caching for HTML
self.addEventListener("fetch", (event) => {
  // Don't cache anything - always go to network
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => new Response("Offline", { status: 503 }))
    );
  }
});

// Push notification event
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || "Новое уведомление",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/" },
    actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(data.title || "ProHub", options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
