import { requireAdmin, jsonOk, jsonError } from '../_helpers';
import { getAdminSupabase } from '@/lib/supabase/admin';

/**
 * POST /api/admin/set-password
 * Body: { userId: string, password: string }
 *
 * Admin-only. Sets a known password for any account via the service-role
 * Admin API (passwords are bcrypt-hashed in the DB and cannot be read back, so
 * resetting to a known value is the only way to "recover" access).
 */
export async function POST(request: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  let userId: string;
  let password: string;
  try {
    const body = await request.json();
    if (!body?.userId || typeof body.userId !== 'string') throw new Error();
    if (!body?.password || typeof body.password !== 'string' || body.password.length < 6) {
      return jsonError('Password must be at least 6 characters', 400);
    }
    userId = body.userId;
    password = body.password;
  } catch {
    return jsonError('Invalid request body — expected { userId, password }', 400);
  }

  const admin = getAdminSupabase();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });

  if (error) return jsonError(error.message, 500);
  return jsonOk({ success: true });
}
