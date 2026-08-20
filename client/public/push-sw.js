self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(payload.title || "CodeCraft Academy", {
    body: payload.body || "Шинэ суралцах update байна.",
    icon: "/favicon.ico",
    data: { href: payload.href || "/notifications" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.href || "/notifications"));
});
