'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let cached: SupabaseClient<Database> | null = null;

/**
 * Browser Supabase client. Uses auth-helpers' `createClientComponentClient`,
 * which persists the session in COOKIES (not localStorage) so our server
 * Route Handlers — `/api/llm/*`, `/api/admin/*` — can read the same session via
 * `createRouteHandlerClient({ cookies })`. With the plain `supabase-js` client
 * the session lived only in localStorage, so every authenticated API call
 * returned 401 (e.g. "Get a mission" failed silently). The session cookie is
 * kept fresh by the matching `createMiddlewareClient` call in `middleware.ts`.
 */
export function createClient(): SupabaseClient<Database> {
  if (!cached) {
    cached = createClientComponentClient<Database>();
  }
  return cached;
}
