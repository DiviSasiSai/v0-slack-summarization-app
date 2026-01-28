// Service Worker for Push Notifications

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated")
  event.waitUntil(clients.claim())
})

self.addEventListener("push", (event) => {
  console.log("Push notification received")

  if (!event.data) {
    console.log("No data in push event")
    return
  }

  try {
    const data = event.data.json()

    const options = {
      body: data.body || "New notification",
      icon: data.icon || "/icon.svg",
      badge: data.badge || "/icon.svg",
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      tag: data.tag || "default",
      renotify: data.renotify || false,
    }

    event.waitUntil(self.registration.showNotification(data.title || "Notification", options))
  } catch (error) {
    console.error("Error showing notification:", error)
  }
})

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked")
  event.notification.close()

  const urlToOpen = event.notification.data?.url || "/dashboard"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus()
          if (client.navigate) {
            return client.navigate(urlToOpen)
          }
          return client
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed")
})

// Handle background sync (optional, for future use)
self.addEventListener("sync", (event) => {
  console.log("Background sync:", event.tag)
})
