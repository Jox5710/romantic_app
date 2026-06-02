import { NextRequest, NextResponse } from 'next/server';

/**
 * Magic-link landing route.
 *
 * Supabase GoTrue (self-hosted) builds the email link from the request's
 * Referer header — so when a user clicks "Send magic link" while on
 * `http://<host>/<locale>`, the email URL ends up shaped like
 * `http://<host>/<locale>/auth/v1/verify?token=…&type=…&redirect_to=…`.
 *
 * That URL hits the Next.js app on the front-end port, NOT Kong → GoTrue.
 * This route catches the click and 302s to the real GoTrue verify endpoint
 * (NEXT_PUBLIC_SUPABASE_URL), preserving every query param. GoTrue then
 * verifies the token, sets the auth cookies for the host, and redirects to
 * the original `redirect_to` — landing the user back inside the app, signed in.
 */
export function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return new Response('NEXT_PUBLIC_SUPABASE_URL is not configured.', { status: 500 });
  }

  const incoming = new URL(request.url);
  const target = new URL('/auth/v1/verify', supabaseUrl);
  target.search = incoming.search;
  return NextResponse.redirect(target.toString(), { status: 302 });
}
