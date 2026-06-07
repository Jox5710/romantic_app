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
  src: '../fonts/Playfair_Display/PlayfairDisplay-VariableFont_wght.woff2',
  variable: '--font-playfair',
  display: 'swap',
  weight: '400 900',
});

// Arabic display headers + couple names (calligraphic).
// preload:false — only Arabic pages use these, so English pages shouldn't
// eagerly fetch them (they still load on-demand via `display: swap`).
const arefRuqaa = localFont({
  src: [
    { path: '../fonts/Aref_Ruqaa/ArefRuqaa-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Aref_Ruqaa/ArefRuqaa-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-aref-ruqaa',
  display: 'swap',
  preload: false,
});

// Arabic body / subtitles / descriptions
const tajawal = localFont({
  src: [
    { path: '../fonts/Tajawal/Tajawal-Light.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/Tajawal/Tajawal-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Tajawal/Tajawal-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/Tajawal/Tajawal-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-tajawal',
  display: 'swap',
  preload: false,
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
  preload: false, // decorative accent — load on demand, don't block first paint
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Title + description come from the root [layout.tsx](../layout.tsx). Setting
// them here would clobber the root's `title.template`, so this layout adds
// nothing — locale-specific overrides (if ever needed) belong on individual
// `page.tsx` files.
export const metadata: Metadata = {};

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
