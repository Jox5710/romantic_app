import { requireAdmin, jsonOk, jsonError } from '../_helpers';
import { getAdminSupabase } from '@/lib/supabase/admin';
import type { AdminUserRow } from '@/lib/admin-types';

export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  const admin = getAdminSupabase();

  const [usersResult, membersResult] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('couple_members').select('user_id, couple_id, couples(state, name_a, name_b)'),
  ]);

  if (usersResult.error) {
    return jsonError('Failed to list users', 500);
  }

  // Build O(1) lookup: userId → { couple_id, state, name }
  type MemberRow = {
    user_id: string;
    couple_id: string;
    couples: { state: string; name_a: string | null; name_b: string | null } | null;
  };
  const memberMap = new Map<string, MemberRow>();
  for (const m of (membersResult.data ?? []) as MemberRow[]) {
    memberMap.set(m.user_id, m);
  }

  const rows: AdminUserRow[] = usersResult.data.users.map((u) => {
    const member = memberMap.get(u.id);
    const coupleState = member?.couples?.state ?? null;
    const nameA = member?.couples?.name_a ?? null;
    const nameB = member?.couples?.name_b ?? null;
    const coupleName = nameA || nameB
      ? [nameA, nameB].filter(Boolean).join(' & ')
      : null;

    return {
      id: u.id,
      email: u.email ?? '',
      email_confirmed_at: u.email_confirmed_at ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      couple_id: member?.couple_id ?? null,
      couple_state: coupleState,
      couple_name: coupleName,
    };
  });

  // Most recently created first
  rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return jsonOk(rows);
}
