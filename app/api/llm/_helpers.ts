/**
 * Shared utilities for every /api/llm/* Route Handler.
 *
 * - Session gating (uses the legacy auth-helpers since that's what's already
 *   in package.json — no need to add a second Supabase auth dependency).
 * - Uniform JSON success / error envelopes so the client side has a single
 *   shape to consume.
 */

import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { MissingKeyError } from '@/lib/llm/gemini';

/**
 * Returns the authenticated user id, or null if the request has no valid
 * Supabase session cookie. Route handlers should bail with 401 on null.
 */
export async function getSessionUserId(): Promise<string | null> {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Returns the Supabase client too — handy when the route needs to read
 *  couple data through RLS. */
export async function getSessionSupabase() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export function jsonOk<T>(body: T) {
  return NextResponse.json(body);
}

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/**
 * Single try/catch wrapper for the actual Gemini call. Maps known failure
 * modes to HTTP status codes so the client can pick the right toast.
 */
export async function runWithLlmGuards<T>(
  fn: () => Promise<T>,
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof MissingKeyError) {
      return { ok: false, status: 503, error: 'llmUnavailable' };
    }
    // Any other Gemini SDK error — generic 502 (we tried, upstream failed).
    return { ok: false, status: 502, error: 'llmUnavailable' };
  }
}
