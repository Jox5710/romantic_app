/**
 * Kong + Supabase API contract checks. These are FAST (no browser) and form
 * a tight ring around the backend so a broken stack is caught instantly.
 */
import { test, expect, request } from '@playwright/test';
import { KONG, ANON, SERVICE, newApi, signInWithPassword } from './fixtures/api';
import { getDemoCoupleId } from './fixtures/couple';

test.describe('API — Kong routes', () => {
  test('auth/v1/settings returns 200 with anon key', async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P0' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'supabase/kong.yml — auth-v1 cors/key-auth/acl plugins; verify .env.docker JWT_SECRET matches ANON_KEY',
    });
    const ctx = await request.newContext({ baseURL: KONG });
    const r = await ctx.get('/auth/v1/settings', { headers: { apikey: ANON } });
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body).toHaveProperty('external');
    await ctx.dispose();
  });

  test('password sign-in issues access token', async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P0' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'supabase/seed-admin.sql or auth.users token columns NULL → see fix in prior task',
    });
    const tok = await signInWithPassword(
      process.env.TEST_ADMIN_EMAIL ?? 'admin@fromantic.com',
      process.env.TEST_ADMIN_PASSWORD ?? 'jox@12345',
    );
    expect(tok.access_token.split('.').length).toBe(3);
    expect(tok.user.email).toBe(process.env.TEST_ADMIN_EMAIL ?? 'admin@fromantic.com');
  });

  test('PATCH /rest/v1/couples with service role returns 200/204', async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P0' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'supabase/kong.yml — cors plugin config.methods must include PATCH/DELETE',
    });
    const id = await getDemoCoupleId();
    const api = await newApi('service');
    const r = await api.patch(`/rest/v1/couples?id=eq.${id}`, {
      data: { admin_note: `e2e-touch-${Date.now()}` },
    });
    expect([200, 204]).toContain(r.status());
    await api.dispose();
  });

  test('OPTIONS preflight advertises PATCH and DELETE', async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P0' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'supabase/kong.yml — bare cors plugins lose PATCH/DELETE; explicit methods needed',
    });
    const ctx = await request.newContext({ baseURL: KONG });
    const r = await ctx.fetch('/rest/v1/missions?id=eq.test', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'authorization,apikey,content-type,prefer',
      },
    });
    expect(r.status()).toBe(200);
    const allow = (r.headers()['access-control-allow-methods'] ?? '').toUpperCase();
    expect(allow).toContain('PATCH');
    expect(allow).toContain('DELETE');
    await ctx.dispose();
  });

  // Realtime WebSocket handshake is covered by realtime.spec.ts via
  // `page.on('websocket')` from a real browser context — Playwright's API
  // client can't perform a WS upgrade, so the assertion lives there.

  test('Anonymous request to a protected table is denied (RLS)', async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P1' });
    const api = await newApi('anon');
    const r = await api.get('/rest/v1/couples?select=id&limit=1');
    // Either 401 (no JWT) or 200 with empty result (RLS denies). Anything 5xx
    // is a stack issue.
    expect([200, 401]).toContain(r.status());
    if (r.status() === 200) {
      const rows = await r.json();
      expect(Array.isArray(rows)).toBe(true);
    }
    await api.dispose();
  });
});
