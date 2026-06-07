import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * POST /api/push/subscribe
 * Body: { endpoint, p256dh, auth, userAgent? }
 * Stores (upserts on endpoint) the caller's Web Push subscription so the server
 * can later push closed-app notifications to this device.
 */
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { endpoint?: string; p256dh?: string; auth?: string; userAgent?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'badRequest' }, { status: 400 }); }
  const { endpoint, p256dh, auth, userAgent } = body;
  if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: 'badRequest' }, { status: 400 });

  const admin = getAdminSupabase();
  const { error } = await admin
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, endpoint, p256dh, auth, user_agent: userAgent ?? null },
      { onConflict: 'endpoint' },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
