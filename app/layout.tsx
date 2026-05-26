import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Forever',
  description: 'A private sanctuary for the two of you.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Forever' },
  themeColor: '#c9a961',
  other: { 'mobile-web-app-capable': 'yes' },
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
