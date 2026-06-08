import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { sendToPartner } from '@/lib/server-notify';

export const runtime = 'nodejs';

/**
 * POST /api/push/heartbeat
 * Called by the SENDER right after they tap a heartbeat. Pushes a heartbeat
 * notification to the partner over web push + FCM (delivered even if the
 * partner's app is fully closed). Thin wrapper over the shared `sendToPartner`
 * pipeline (see lib/server-notify.ts).
 */
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const result = await sendToPartner(user.id, 'heartbeat');
  if (result.unconfigured) return NextResponse.json({ error: 'pushNotConfigured' }, { status: 503 });
  return NextResponse.json(result);
}
