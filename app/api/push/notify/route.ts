import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { sendToPartner, isNotifType } from '@/lib/server-notify';

export const runtime = 'nodejs';

/**
 * POST /api/push/notify   Body: { type }
 * Generic partner-notification endpoint. The SENDER calls this right after a
 * successful action (vibe, whisper, gratitude, …); the server pushes a localized
 * notification to their partner over web push + FCM. Used by every feature via
 * the `notifyPartner(type)` client helper. (Heartbeat keeps its own route.)
 */
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { type?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'badRequest' }, { status: 400 }); }
  if (!isNotifType(body.type)) return NextResponse.json({ error: 'badType' }, { status: 400 });

  const result = await sendToPartner(user.id, body.type);
  if (result.unconfigured) return NextResponse.json({ error: 'pushNotConfigured' }, { status: 503 });
  return NextResponse.json(result);
}
