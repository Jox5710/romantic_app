import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Run on everything except API routes, Next internals, and files with an extension.
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
