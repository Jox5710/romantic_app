import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Forever native shell.
 *
 * The app is a thin native wrapper around the LIVE SSR web app — `server.url`
 * points the WebView straight at the production site, so the native app is
 * byte-for-byte identical to the web app and updates the instant the web app is
 * redeployed (no store resubmission for UI changes).
 *
 * `webDir` (./www) only holds a placeholder; it is never shown because
 * `server.url` is set, but Capacitor requires the directory to exist.
 */
const config: CapacitorConfig = {
  appId: 'com.forever.app',
  appName: 'Forever',
  webDir: 'www',
  server: {
    url: 'https://51-21-73-40.nip.io',
    cleartext: false,
    // Only allow navigation to our own host inside the app; external links are
    // opened in the system browser by the @capacitor/app/Browser plugins.
    allowNavigation: ['51-21-73-40.nip.io'],
  },
  ios: {
    // Restrict the WebView to our domain so app-bound APIs (Notifications,
    // service worker, push) are permitted by WKWebView.
    limitsNavigationsToAppBoundDomains: true,
    backgroundColor: '#0a0a0f',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0a0f',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#0a0a0f',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
