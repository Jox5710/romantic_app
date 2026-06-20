/* Forever service worker — notification display + click handling.
 *
 * Showing notifications through a service-worker registration (rather than
 * `new Notification()`) is what makes them appear when the tab is backgrounded
 * and is the ONLY path that works on mobile Chrome. True push-when-closed would
 * additionally need the Web Push API (VAPID + a push backend) — not set up yet.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Per-type vibration "tunes" — keep in sync with lib/notify-tunes.ts (a service
// worker is a static file and can't import the TS module).
var VIBRATION_PATTERNS = {
  heartbeat: [80, 40, 80, 40, 160],
  vibe: [40, 30, 40, 30, 40],
  whisper: [30],
  gratitude: [120, 60, 120],
  bucket: [200],
  prompt: [60, 40, 60],
  mirror: [50, 50, 50, 50, 50],
  promise: [150, 80, 150],
  mission: [80, 40, 80, 40, 80, 40, 200],
  memory: [100, 50, 100],
  dinner: [70, 40, 70, 40, 70],
  canvas: [40, 40, 120],
};

// Web Push — fires even when the app/tab is fully closed. The push payload is
// JSON { title, body, url, tag } sent by /api/push/heartbeat.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || 'Forever';
  const vibrate = VIBRATION_PATTERNS[data.tag] || [120, 60, 120];
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: vibrate,
      tag: data.tag || 'forever',
      renotify: true,
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of wins) {
        if ('focus' in client) {
          try { await client.navigate(targetUrl); } catch (_) {}
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })(),
  );
});
