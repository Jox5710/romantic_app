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

  const admin = getAdminSupabase();
  const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });

  if (error) return jsonError(error.message, 500);
  return jsonOk({ success: true });
}
