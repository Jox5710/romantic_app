/**
 * Helpers for working with the seeded demo couple
 * (admin@fromantic.com + nourhansamy@fromantic.com).
 *
 * Most specs read/write against this couple; per-test isolation comes from
 * scoping mutations to fresh child rows (a new memory, a new whisper, etc.)
 * and cleaning them up by id in afterEach.
 */
import { newApi, signInWithPassword, ANON } from './api';

let cachedCoupleId: string | null = null;

/**
 * Returns the demo couple's id. Cached for the suite — the seed is idempotent.
 */
export async function getDemoCoupleId(): Promise<string> {
  if (cachedCoupleId) return cachedCoupleId;

  // Sign in as admin to bypass RLS; query couple_members for our user_id.
  const tok = await signInWithPassword(
    process.env.TEST_ADMIN_EMAIL ?? 'admin@fromantic.com',
    process.env.TEST_ADMIN_PASSWORD ?? 'jox@12345',
  );
  const api = await newApi('anon', tok.access_token);
  const r = await api.get(`/rest/v1/couple_members?user_id=eq.${tok.user.id}&select=couple_id`);
  const rows = await r.json();
  await api.dispose();
  if (!rows.length) throw new Error('demo couple not seeded — run supabase/seed-partner.sql');
  cachedCoupleId = rows[0].couple_id;
  return cachedCoupleId!;
}

/**
 * Resets the demo couple's state to "approved" — used by tests that munged it
 * (e.g., admin decline/bless flows).
 */
export async function resetCoupleToApproved(coupleId: string) {
  const api = await newApi('service');
  await api.patch(`/rest/v1/couples?id=eq.${coupleId}`, {
    data: { state: 'approved', admin_note: null },
  });
  await api.dispose();
}
