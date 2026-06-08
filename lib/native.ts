'use client';

/**
 * Native shell bridge (Capacitor).
 *
 * The web app is wrapped, unchanged, by a Capacitor native shell (see the
 * sibling `mobile/` project) that loads the live site in a WebView. When
 * running inside that shell, the runtime injects a `window.Capacitor` global
 * that proxies to the installed native plugins (Haptics, PushNotifications…).
 *
 * We talk to that global directly rather than importing any `@capacitor/*`
 * npm package, so:
 *   • the main web app gains NO new dependency, and
 *   • a normal browser / PWA never loads a single byte of native code —
 *     every helper here short-circuits to `false`/web fallbacks when
 *     `window.Capacitor` is absent.
 */

import { vibrate } from './notifications';

type CapPlugin = {
  [method: string]: (...args: unknown[]) => Promise<unknown>;
} & {
  addListener: (
    event: string,
    cb: (data: unknown) => void,
  ) => Promise<{ remove: () => void }>;
};

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: Record<string, CapPlugin>;
}

function cap(): CapacitorGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

/** True only inside the Capacitor native shell (iOS/Android app). */
export function isNative(): boolean {
  return !!cap()?.isNativePlatform?.();
}

/** 'ios' | 'android' | 'web' — 'web' in a normal browser. */
export function nativePlatform(): 'ios' | 'android' | 'web' {
  const p = cap()?.getPlatform?.();
  return p === 'ios' || p === 'android' ? p : 'web';
}

/**
 * Fire a short haptic. On native uses the Haptics plugin (real taptic engine /
 * vibrator); on web falls back to the existing `navigator.vibrate` helper.
 */
export async function nativeHaptic(): Promise<void> {
  const c = cap();
  const Haptics = c?.Plugins?.Haptics;
  if (c?.isNativePlatform?.() && Haptics) {
    try {
      await Haptics.impact({ style: 'MEDIUM' });
      return;
    } catch {
      /* fall through to web vibrate */
    }
  }
  vibrate();
}

/**
 * Dismiss the Capacitor launch splash (native only). Called once the web app is
 * interactive so the app shows a single splash (OS splash → app), never the
 * web splash on top of it.
 */
export async function hideNativeSplash(): Promise<void> {
  const c = cap();
  const Splash = c?.Plugins?.SplashScreen;
  if (!c?.isNativePlatform?.() || !Splash) return;
  try {
    await Splash.hide();
  } catch {
    /* plugin missing / already hidden — ignore */
  }
}

/** Current native push permission, mapped onto the web NotificationPermission shape. */
export async function nativePushPermission(): Promise<NotificationPermission> {
  const c = cap();
  const Push = c?.Plugins?.PushNotifications;
  if (!c?.isNativePlatform?.() || !Push) return 'default';
  try {
    const r = (await Push.checkPermissions()) as { receive?: string };
    if (r?.receive === 'granted') return 'granted';
    if (r?.receive === 'denied') return 'denied';
    return 'default';
  } catch {
    return 'default';
  }
}

let pushListenersWired = false;

/**
 * Register this device for native push (FCM on Android / APNs on iOS) and POST
 * the resulting device token to the server. Safe to call repeatedly: listeners
 * are wired once, and calling when permission is already granted just refreshes
 * the token. No-ops outside the native shell.
 *
 * On the free-Apple-ID iOS build the APNs entitlement is absent, so native
 * registration simply never yields a token — this fails gracefully (no crash).
 */
export async function registerNativePush(): Promise<void> {
  const c = cap();
  const Push = c?.Plugins?.PushNotifications;
  if (!c?.isNativePlatform?.() || !Push) return;

  // Wire listeners exactly once. Each step is independently guarded so a single
  // plugin hiccup (e.g. FCM not yet configured) can never bubble up and crash
  // the app — the #1 cause of the "grant permission → app dies" report.
  if (!pushListenersWired) {
    pushListenersWired = true;

    // Native delivered the FCM/APNs token → store it server-side.
    try {
      await Push.addListener('registration', (data: unknown) => {
        const token = (data as { value?: string })?.value;
        if (!token) return;
        fetch('/api/push/register-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, platform: nativePlatform() }),
        }).catch(() => {});
      });
    } catch { /* listener wiring failed — non-fatal */ }

    // Registration errored natively (e.g. missing google-services.json). Swallow
    // it here so it never surfaces as an unhandled native exception.
    try {
      await Push.addListener('registrationError', () => { /* ignore — push just won't arrive */ });
    } catch { /* ignore */ }

    // User tapped a notification → deep-link to the relevant page.
    try {
      await Push.addListener('pushNotificationActionPerformed', (data: unknown) => {
        const url = (data as { notification?: { data?: { url?: string } } })
          ?.notification?.data?.url;
        if (url && typeof url === 'string') {
          try { window.location.href = url; } catch { /* ignore */ }
        }
      });
    } catch { /* ignore */ }
  }

  try {
    const perm = (await Push.requestPermissions()) as { receive?: string };
    if (perm?.receive !== 'granted') return;
    await Push.register();
  } catch {
    /* permission/register failed — ignore, app stays alive */
  }
}
