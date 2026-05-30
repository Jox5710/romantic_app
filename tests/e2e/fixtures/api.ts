/**
 * Supabase REST helper — apikey-authed fetch via Kong. Used by deep specs to
 * assert that mutations actually persisted (e.g., reading back a row by id).
 */
import { request, APIRequestContext } from '@playwright/test';

export const KONG = process.env.KONG_URL || 'http://kong:8000';
export const ANON = process.env.SUPABASE_ANON_KEY!;
export const SERVICE = process.env.SERVICE_ROLE_KEY!;

export type Role = 'anon' | 'service';

export async function newApi(role: Role = 'anon', accessToken?: string): Promise<APIRequestContext> {
  const apikey = role === 'service' ? SERVICE : ANON;
  return request.newContext({
    baseURL: KONG,
    extraHTTPHeaders: {
      apikey,
      Authorization: `Bearer ${accessToken ?? apikey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  });
}

export async function signInWithPassword(email: string, password: string) {
  const ctx = await request.newContext({ baseURL: KONG });
  const r = await ctx.post('/auth/v1/token?grant_type=password', {
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    data: { email, password },
  });
  const body = await r.json();
  await ctx.dispose();
  if (!r.ok()) throw new Error(`sign-in failed: HTTP ${r.status()} ${JSON.stringify(body)}`);
  return body as { access_token: string; refresh_token: string; user: { id: string; email: string } };
}

/** Read one row by id from a public table; throws if not found. */
export async function readRow<T = Record<string, unknown>>(
  api: APIRequestContext,
  table: string,
  id: string,
): Promise<T> {
  const r = await api.get(`/rest/v1/${table}?id=eq.${id}&select=*`);
  if (!r.ok()) throw new Error(`readRow ${table} ${id}: HTTP ${r.status()}`);
  const rows = await r.json();
  if (!rows.length) throw new Error(`readRow ${table} ${id}: not found`);
  return rows[0] as T;
}
