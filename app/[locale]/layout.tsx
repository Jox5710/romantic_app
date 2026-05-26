import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';
import { Cormorant_Garamond, Manrope, Tajawal, Caveat } from 'next/font/google';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/layout/app-shell';
import { AmbientStars } from '@/components/layout/ambient-stars';
import { PageTransition } from '@/components/layout/page-transition';
import { HtmlLocaleAttrs } from '@/components/layout/html-locale-attrs';
import { locales, type Locale } from '@/lib/i18n/config';
import type { Metadata } from 'next';

// --- Fonts ---
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

// Aref Ruqaa is not available in next/font/google, use Tajawal as Arabic display
const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
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
          cormorant.variable,
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
