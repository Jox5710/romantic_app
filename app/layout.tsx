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
export const viewport: Viewport = {
  themeColor: '#c9a961',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
