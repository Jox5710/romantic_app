import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';
import { Manrope, Caveat } from 'next/font/google';
import localFont from 'next/font/local';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/layout/app-shell';
import { AmbientStars } from '@/components/layout/ambient-stars';
import { RomanticBackground } from '@/components/layout/romantic-background';
import { PageTransition } from '@/components/layout/page-transition';
import { HtmlLocaleAttrs } from '@/components/layout/html-locale-attrs';
import { locales, type Locale } from '@/lib/i18n/config';
import type { Metadata } from 'next';

// --- Fonts (local files in app/fonts) ---
// English display headers
const playfair = localFont({
  src: '../fonts/Playfair_Display/PlayfairDisplay-VariableFont_wght.ttf',
  variable: '--font-playfair',
  display: 'swap',
  weight: '400 900',
});

// Arabic display headers + couple names (calligraphic)
const arefRuqaa = localFont({
  src: [
    { path: '../fonts/Aref_Ruqaa/ArefRuqaa-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/Aref_Ruqaa/ArefRuqaa-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-aref-ruqaa',
  display: 'swap',
});

// Arabic body / subtitles / descriptions
const tajawal = localFont({
  src: [
    { path: '../fonts/Tajawal/Tajawal-Light.ttf', weight: '300', style: 'normal' },
    { path: '../fonts/Tajawal/Tajawal-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/Tajawal/Tajawal-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../fonts/Tajawal/Tajawal-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-tajawal',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-caveat',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Forever',
  description: 'A private sanctuary for the two of you.',
};

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  unstable_setRequestLocale(locale);
  const messages = locale === 'ar' ? arMessages : enMessages;
  const isArabic = locale === 'ar';
  const bodyFont = isArabic ? tajawal.variable : manrope.variable;

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <HtmlLocaleAttrs locale={locale} />
      <div
        className={[
          playfair.variable,
          arefRuqaa.variable,
          manrope.variable,
          tajawal.variable,
          caveat.variable,
          bodyFont,
          isArabic ? 'font-body-ar' : 'font-body-en',
          'antialiased',
        ].join(' ')}
      >
        <Providers>
          <AmbientStars />
          <RomanticBackground />
          <AppShell>
            <PageTransition>
              {children}
            </PageTransition>
          </AppShell>
        </Providers>
      </div>
    </NextIntlClientProvider>
  );
}
