'use client';

import { useEffect } from 'react';
import { isNative, hideNativeSplash } from '@/lib/native';

/**
 * Splash controller (renders nothing).
 *
 * The visible splash is `#boot-splash`, server-rendered in the root layout so it
 * paints on the very first frame (before hydration) — no "late" gap. This
 * component only decides WHEN it leaves:
 *
 *  • Web: once the app is interactive (fonts ready + a paint), with a short
 *    minimum so it's a graceful reveal and a hard cap so it can never get stuck.
 *    Shown once per browser session (sessionStorage), matching the old behaviour.
 *  • Native app: there is no web splash (the OS splash covers load); we just
 *    dismiss that native splash once React has mounted = the app is ready.
 */
export function SplashScreen() {
  useEffect(() => {
    if (isNative()) {
      // App is interactive now — drop the native launch splash.
      requestAnimationFrame(() => { void hideNativeSplash(); });
      return;
    }

    const el = document.getElementById('boot-splash');
    if (!el) return;
    // The pre-hydration script hid it (already played this session) — clean it up.
    if (el.classList.contains('boot-gone')) { el.remove(); return; }

    // Don't replay on later refresh/navigation within this tab session.
    try { sessionStorage.setItem('forever_splash_played', '1'); } catch {}

    const start = Date.now();
    const MIN_MS = 1100;  // long enough to actually SEE the brand + pulse animation
    const CAP_MS = 2600;  // hard ceiling — never "stuck"
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      el.classList.add('boot-hide');
      window.setTimeout(() => el.remove(), 520); // after the CSS fade (.45s + buffer)
    };

    const schedule = () => {
      const wait = Math.max(0, MIN_MS - (Date.now() - start));
      window.setTimeout(finish, wait);
    };

    const cap = window.setTimeout(finish, CAP_MS);

    // Exit as soon as fonts are ready and a frame has painted.
    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (fonts?.ready) {
      fonts.ready.then(() => requestAnimationFrame(schedule)).catch(() => requestAnimationFrame(schedule));
    } else {
      requestAnimationFrame(schedule);
    }

    return () => window.clearTimeout(cap);
  }, []);

  return null;
}
