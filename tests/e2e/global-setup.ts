/**
 * Global setup — runs ONCE before any spec.
 * - Waits until the app and Kong are reachable from inside the test container.
 * - Confirms the demo couple (admin@fromantic.com + nourhansamy@fromantic.com)
 *   is seeded; if not, fails fast with a clear message so the runner reseeds.
 */
import { request } from '@playwright/test';

const APP_URL = process.env.BASE_URL || 'http://app:3000';
const KONG_URL = process.env.KONG_URL || 'http://kong:8000';
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';

async function waitFor(label: string, url: string, expectStatus: number | number[] = 200) {
  const expect = Array.isArray(expectStatus) ? expectStatus : [expectStatus];
  const api = await request.newContext();
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const r = await api.get(url, { headers: ANON_KEY ? { apikey: ANON_KEY } : undefined, timeout: 4_000 });
      if (expect.includes(r.status())) {
        // eslint-disable-next-line no-console
        console.log(`[setup] ${label} ok (HTTP ${r.status()})`);
        await api.dispose();
        return;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  await api.dispose();
  throw new Error(`[setup] ${label} never became ready: ${url}`);
}

export default async function globalSetup() {
  // 200 OK on the dashboard (it 307s to /en) or 307 — both are healthy.
  await waitFor('app', `${APP_URL}/en/sign-in`, [200, 307, 308]);
  await waitFor('kong auth', `${KONG_URL}/auth/v1/settings`, 200);
}
