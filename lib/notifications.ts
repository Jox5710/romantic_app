'use client';

/**
 * Web Notifications + vibration helper (client-only).
 *
 * Capabilities WITHOUT a push backend:
 *   • app open / tab focused          → notification + vibration ✅
 *   • app open on another tab (bg)    → notification via the service worker ✅
 *     (desktop reliably; mobile while the browser process is alive)
 *   • app fully closed                → ❌ needs Web Push (VAPID) — future work
 *
 * Vibration always fires (no permission needed); the OS notification needs the
 * user to have granted Notification permission.
 */

let swReg: ServiceWorkerRegistration | null = null;

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPermission(): NotificationPermission {
  if (!notificationsSupported()) return 'denied';
  return Notification.permission;
}

export async function registerNotificationSW(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    swReg = await navigator.serviceWorker.register('/sw.js');
  } catch {
    /* SW registration can fail on insecure origins / private mode — ignore. */
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') await registerNotificationSW();
    return result;
  } catch {
    return 'denied';
  }
}

export function vibrate(pattern: number | number[] = [120, 60, 120]): void {
  try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
}

/**
 * Show a notification (+ vibrate). Vibration happens regardless of permission;
 * the visual notification only if permission was granted. Prefers the SW
 * registration so it works from a backgrounded tab / on mobile.
 */
export async function showNotification(
  title: string,
  body: string,
  opts: { url?: string; tag?: string } = {},
): Promise<void> {
  vibrate();
  if (!notificationsSupported() || Notification.permission !== 'granted') return;

  const options = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: opts.tag,
    renotify: !!opts.tag,
    vibrate: [120, 60, 120],
    data: { url: opts.url ?? '/' },
  } as NotificationOptions;

  try {
    if (!swReg && 'serviceWorker' in navigator) {
      swReg = await navigator.serviceWorker.ready;
    }
    if (swReg) { await swReg.showNotification(title, options); return; }
  } catch { /* fall through to the legacy constructor */ }

  try { new Notification(title, options); } catch { /* nothing else we can do */ }
}
