import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * POST /api/push/register-device
 * Body: { token, platform: 'ios' | 'android' }
 * Stores (upserts on token) the caller's NATIVE push token (FCM/APNs) so the
 * server can later push closed-app notifications to this device. The native
 * counterpart of /api/push/subscribe (which handles browser Web Push).
 */
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { token?: string; platform?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'badRequest' }, { status: 400 }); }
  const { token, platform } = body;
  if (!token || (platform !== 'ios' && platform !== 'android')) {
    return NextResponse.json({ error: 'badRequest' }, { status: 400 });
  }

  const admin = getAdminSupabase();
  const { error } = await admin
    .from('device_tokens')
    .upsert({ user_id: user.id, token, platform }, { onConflict: 'token' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
