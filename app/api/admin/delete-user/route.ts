import { requireAdmin, jsonOk, jsonError } from '../_helpers';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  let userId: string;
  try {
    const body = await request.json();
    if (!body?.userId || typeof body.userId !== 'string') throw new Error();
    userId = body.userId;
  } catch {
    return jsonError('Invalid request body — expected { userId: string }', 400);
  }

  // Cannot delete yourself
  if (userId === check.userId) {
    return jsonError('Cannot delete your own account', 400);
  }

  // Cannot delete another admin
  const admin = getAdminSupabase();
  const { data: targetAdmin } = await admin
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (targetAdmin) {
    return jsonError('Cannot delete an admin account', 400);
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return jsonError(error.message, 500);
  return jsonOk({ success: true });
}
