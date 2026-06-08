// Server-only — system-wide partner notifications.
//
// One place that, given a sender + an event type, pushes a localized notification
// to their PARTNER over BOTH transports in parallel:
//   • Web Push (VAPID) → browsers / installed PWAs
//   • FCM             → native Android (and iOS once APNs is provisioned)
// Delivered even when the partner's app is fully closed. Text is bilingual
// (en · ar) because the receiver's locale isn't known server-side — matching the
// original heartbeat behaviour.
//
// Used by every feature's push route (/api/push/heartbeat, /api/push/notify).
import { getAdminSupabase } from '@/lib/supabase/admin';
import webpush from 'web-push';
import { sendFcm, fcmConfigured } from '@/lib/fcm';

export type NotifType =
  | 'heartbeat'
  | 'vibe'
  | 'whisper'
  | 'gratitude'
  | 'bucket'
  | 'prompt'
  | 'mirror'
  | 'promise'
  | 'mission'
  | 'memory'
  | 'dinner'
  | 'canvas';

interface NotifContent {
  title: string;
  body: string;
  url: string;
}

// Bilingual payloads (English · Arabic). `tag` defaults to the type so repeated
// events of the same kind collapse into one OS notification.
const TYPE_MAP: Record<NotifType, NotifContent> = {
  heartbeat: { title: '💓 Forever', body: 'A heartbeat from your love · نبضة من حبيبك 💓', url: '/heartbeat' },
  vibe: { title: '🌈 Forever', body: 'Your love shared their vibe · شاركك حبيبك مزاجه 🌈', url: '/vibe' },
  whisper: { title: '🤫 Forever', body: 'A whisper from your love · همسة من حبيبك 🤫', url: '/whisper' },
  gratitude: { title: '🙏 Forever', body: 'Your love is grateful for you · حبيبك ممتن لك 🙏', url: '/gratitude' },
  bucket: { title: '🪣 Forever', body: 'A new shared dream was added · حلم جديد أُضيف لكما 🪣', url: '/bucket' },
  prompt: { title: '💭 Forever', body: 'Your love answered today’s prompt · أجاب حبيبك سؤال اليوم 💭', url: '/prompt' },
  mirror: { title: '🪞 Forever', body: 'Your love revealed a mirror answer · كشف حبيبك إجابته 🪞', url: '/mirror' },
  promise: { title: '🤝 Forever', body: 'Your love kept a promise · أوفى حبيبك بوعد 🤝', url: '/promises' },
  mission: { title: '🎯 Forever', body: 'Your love completed a mission · أكمل حبيبك مهمة 🎯', url: '/missions' },
  memory: { title: '📸 Forever', body: 'A new memory was added · ذكرى جديدة أُضيفت 📸', url: '/timeline' },
  dinner: { title: '🍽️ Forever', body: 'You both matched on dinner · اتفقتما على العشاء 🍽️', url: '/dinner' },
  canvas: { title: '🎨 Forever', body: 'Your love drew on your board · رسم حبيبك على لوحتكما 🎨', url: '/canvas' },
};

export function isNotifType(v: unknown): v is NotifType {
  return typeof v === 'string' && v in TYPE_MAP;
}

let vapidConfigured = false;
function configureVapid(): boolean {
  if (vapidConfigured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@forever.local';
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  vapidConfigured = true;
  return true;
}

export interface SendResult {
  success: boolean;
  sent: number;
  web: number;
  native: number;
  /** true when neither transport is configured (caller may 503). */
  unconfigured?: boolean;
}

/**
 * Push a `type` notification to the partner of `senderUserId`. Resolves the
 * couple + partner internally, then fans out to web push + FCM. No-op (sent: 0)
 * if the user has no couple/partner or the partner has no registered targets.
 */
export async function sendToPartner(senderUserId: string, type: NotifType): Promise<SendResult> {
  const vapidOk = configureVapid();
  const fcmOk = fcmConfigured();
  if (!vapidOk && !fcmOk) return { success: false, sent: 0, web: 0, native: 0, unconfigured: true };

  const admin = getAdminSupabase();

  const { data: member } = await admin
    .from('couple_members').select('couple_id').eq('user_id', senderUserId).maybeSingle();
  if (!member?.couple_id) return { success: true, sent: 0, web: 0, native: 0 };

  const { data: partner } = await admin
    .from('couple_members').select('user_id')
    .eq('couple_id', member.couple_id).neq('user_id', senderUserId).maybeSingle();
  if (!partner?.user_id) return { success: true, sent: 0, web: 0, native: 0 };
  const partnerId = partner.user_id;

  const content = TYPE_MAP[type];

  // --- Web Push (browsers / PWAs) ---
  async function sendWebPush(): Promise<number> {
    if (!vapidOk) return 0;
    const { data: subs } = await admin
      .from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', partnerId);
    if (!subs?.length) return 0;

    const payload = JSON.stringify({ title: content.title, body: content.body, url: content.url, tag: type });
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
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      }
    }));
    return n;
  }

  // --- FCM (native app) ---
  async function sendNative(): Promise<number> {
    if (!fcmOk) return 0;
    const { data: rows } = await admin
      .from('device_tokens').select('token').eq('user_id', partnerId);
    const tokens = (rows ?? []).map((r) => r.token);
    if (!tokens.length) return 0;

    const { sent, invalidTokens } = await sendFcm(tokens, {
      title: content.title, body: content.body, url: content.url, tag: type,
    });
    if (invalidTokens.length) {
      await admin.from('device_tokens').delete().in('token', invalidTokens);
    }
    return sent;
  }

  const [web, native] = await Promise.all([sendWebPush(), sendNative()]);
  return { success: true, sent: web + native, web, native };
}
