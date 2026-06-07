import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  // Template ensures each tab shows e.g. "Whisper · Forever" — and any page
  // can opt out by setting its own absolute title.
  title: { default: 'Forever', template: '%s · Forever' },
  description: 'A private sanctuary for the two of you.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Forever' },
  other: { 'mobile-web-app-capable': 'yes' },
  // Next.js App Router auto-detects app/icon.png + app/apple-icon.png, so we
  // don't need to repeat them here — listing them anyway makes the link tags
  // explicit and lets us set the type/sizes hints.
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png', sizes: '512x512' }],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '192x192' }],
  },
};

// themeColor + viewport live in the `viewport` export now (Next 14 requirement).
// viewportFit: 'cover' is the on-switch for env(safe-area-inset-*) on iOS —
// without it, the safe-* utility classes in globals.css all resolve to 0 and
// the fixed header sits behind the notch.
export const viewport: Viewport = {
  themeColor: '#c9a961',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Critical CSS for the pre-hydration splash — inlined so it applies on the very
// first paint, before any bundle loads. The dark brand background fills the
// screen instantly (no white flash); the logo pulses until the app is
// interactive, then SplashScreen (the controller) fades #boot-splash out.
const BOOT_SPLASH_CSS = `
#boot-splash{position:fixed;inset:0;z-index:300;display:flex;align-items:center;
justify-content:center;background:#0a0a0f;transition:opacity .45s ease}
#boot-splash.boot-hide{opacity:0;pointer-events:none}
#boot-splash.boot-gone{display:none}
#boot-splash img{width:min(58vw,240px);height:auto;
filter:drop-shadow(0 0 36px rgba(201,169,97,.45));animation:bootPulse 1.6s ease-in-out infinite}
@keyframes bootPulse{0%,100%{opacity:.72;transform:scale(.985)}50%{opacity:1;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){#boot-splash img{animation:none;opacity:1}}
`;

// Runs during initial HTML parse (before hydration). Hides the splash up-front
// (display:none via a class — the node stays put so hydration isn't disturbed,
// the next-themes pattern) when it shouldn't show: inside the native app (the OS
// splash covers load) or when it already played this browser session (so
// refresh/navigation don't replay).
const BOOT_SPLASH_INIT = `(function(){try{var e=document.getElementById('boot-splash');if(!e)return;` +
  `var n=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());` +
  `var p=false;try{p=!!sessionStorage.getItem('forever_splash_played')}catch(_){}` +
  `if(n||p){e.className='boot-gone'}}catch(_){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <style dangerouslySetInnerHTML={{ __html: BOOT_SPLASH_CSS }} />
        <div id="boot-splash" aria-hidden="true" suppressHydrationWarning>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/forever-logo.png" alt="" />
        </div>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SPLASH_INIT }} />
        {children}
      </body>
    </html>
  );
}
