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
import { ANDROID_CHANNELS } from './notify-tunes';

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
 * True on iOS/iPadOS Safari (web, NOT the native shell). Covers iPadOS 13+,
 * which masquerades as a Mac but reports touch points. Used to surface the
 * Add-to-Home-Screen path, since iOS only allows web push from an INSTALLED PWA.
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (isNative()) return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports as "MacIntel" but is touch-capable.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

/** True when running as an installed PWA (home-screen / standalone display). */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
  const displayStandalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  return iosStandalone || displayStandalone;
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

/**
 * Create one Android notification channel per notification type, each with its
 * own custom sound ("tune") + vibration. On Android 8+ sound/vibration are fixed
 * per channel at creation time and can't be set per message, so this is the only
 * way to give each event its own tune. No-op off Android / outside the shell, and
 * idempotent (createChannel updates an existing channel). Uses the
 * @capacitor/local-notifications plugin via the injected global.
 */
let channelsCreated = false;
export async function ensureNotificationChannels(): Promise<void> {
  const c = cap();
  const LN = c?.Plugins?.LocalNotifications;
  if (!c?.isNativePlatform?.() || nativePlatform() !== 'android' || !LN || channelsCreated) return;
  channelsCreated = true;
  for (const ch of ANDROID_CHANNELS) {
    try {
      await LN.createChannel({
        id: ch.id,
        name: ch.name,
        description: ch.description,
        importance: ch.importance,
        sound: `${ch.sound}.wav`, // resolves res/raw/<name>.wav
        vibration: true,
        visibility: 1,
        lights: true,
        lightColor: '#c9a961',
      });
    } catch { /* plugin missing / channel error — non-fatal */ }
  }
}

/**
 * High-accuracy current position. Uses the native @capacitor/geolocation plugin
 * inside the shell (which requests the OS location permission the manifest now
 * declares); falls back to web `navigator.geolocation` in a browser/PWA. Returns
 * null on denial/unavailability so callers can show a friendly message.
 */
export async function nativeGetPosition(): Promise<{ lat: number; lng: number } | null> {
  const c = cap();
  const Geo = c?.Plugins?.Geolocation;
  if (c?.isNativePlatform?.() && Geo) {
    try {
      const perm = (await Geo.requestPermissions()) as { location?: string };
      if (perm?.location === 'denied') return null;
      const pos = (await Geo.getCurrentPosition({ enableHighAccuracy: true, timeout: 12_000 })) as {
        coords?: { latitude: number; longitude: number };
      };
      if (pos?.coords) return { lat: pos.coords.latitude, lng: pos.coords.longitude };
      return null;
    } catch {
      return null;
    }
  }
  // Web fallback
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
    );
  });
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

  // Make sure each notification type's channel (custom sound + vibration) exists
  // before the first push arrives.
  void ensureNotificationChannels();

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
