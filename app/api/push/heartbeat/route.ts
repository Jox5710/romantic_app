import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import webpush from 'web-push';
import { sendFcm, fcmConfigured } from '@/lib/fcm';

export const runtime = 'nodejs';

let configured = false;
function configureVapid(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@forever.local';
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

const TITLE = '💓 Forever';
const BODY = 'A heartbeat from your love · نبضة من حبيبك 💓';

/**
 * POST /api/push/heartbeat
 * Called by the SENDER right after they tap a heartbeat. Looks up the partner's
 * push targets (service-role) and pushes to each — delivered even if the
 * partner's app is fully closed. Two transports run in parallel:
 *   • Web Push (VAPID) → browsers / installed PWAs
 *   • FCM             → native iOS/Android app installs (relays to APNs)
 * Bilingual text since the receiver's locale isn't known here.
 */
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const vapidOk = configureVapid();
  const fcmOk = fcmConfigured();
  if (!vapidOk && !fcmOk) return NextResponse.json({ error: 'pushNotConfigured' }, { status: 503 });

  const admin = getAdminSupabase();

  const { data: member } = await admin
    .from('couple_members').select('couple_id').eq('user_id', user.id).maybeSingle();
  if (!member?.couple_id) return NextResponse.json({ success: true, sent: 0 });

  const { data: partner } = await admin
    .from('couple_members').select('user_id')
    .eq('couple_id', member.couple_id).neq('user_id', user.id).maybeSingle();
  if (!partner?.user_id) return NextResponse.json({ success: true, sent: 0 });
  const partnerId = partner.user_id;

  // --- Web Push (browsers / PWAs) ---
  async function sendWebPush(): Promise<number> {
    if (!vapidOk) return 0;
    const { data: subs } = await admin
      .from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', partnerId);
    if (!subs?.length) return 0;

    const payload = JSON.stringify({ title: TITLE, body: BODY, url: '/heartbeat', tag: 'heartbeat' });
    let n = 0;
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        n++;
      } catch (e: unknown) {
        const code = (e as { statusCode?: number })?.statusCode;
        // 404/410 = subscription expired or unsubscribed → prune it.
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      }
    }));
    return n;
  }

  // --- FCM (native iOS/Android app) ---
  async function sendNative(): Promise<number> {
    if (!fcmOk) return 0;
    const { data: rows } = await admin
      .from('device_tokens').select('token').eq('user_id', partnerId);
    const tokens = (rows ?? []).map((r) => r.token);
    if (!tokens.length) return 0;

    const { sent, invalidTokens } = await sendFcm(tokens, {
      title: TITLE, body: BODY, url: '/heartbeat', tag: 'heartbeat',
    });
    if (invalidTokens.length) {
      await admin.from('device_tokens').delete().in('token', invalidTokens);
    }
    return sent;
  }

  const [web, native] = await Promise.all([sendWebPush(), sendNative()]);
  return NextResponse.json({ success: true, sent: web + native, web, native });
}
