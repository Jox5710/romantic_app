import createIntlMiddleware from 'next-intl/middleware';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/i18n/config';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

// Run next-intl first (it produces the response — possibly a locale redirect),
// then attach the Supabase middleware client to that SAME response so it can
// refresh the auth session cookie. Keeping the cookie fresh on every page
// navigation is what lets our Route Handlers (/api/llm/*, /api/admin/*) read a
// valid session via createRouteHandlerClient({ cookies }).
export async function middleware(req: NextRequest) {
  const res = intlMiddleware(req);
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();
  return res;
}

export const config = {
  // Run on everything except API routes, Next internals, and files with an extension.
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
