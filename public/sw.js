const CACHE_NAME = 'kpi-tracker-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Web push (FCM) — show notification when a push arrives
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: 'KPI Tracker', body: event.data.text() } };
  }
  const n = payload.notification || payload.data || {};
  event.waitUntil(
    self.registration.showNotification(n.title || 'KPI Tracker', {
      body: n.body || 'Time to log your goals!',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      data: { url: n.click_action || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy — app always tries the network,
  // falls back to cache only when offline
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
