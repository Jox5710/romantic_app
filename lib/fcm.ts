// Server-only — native push via Firebase Cloud Messaging (FCM).
// FCM delivers to Android directly and relays to APNs for iOS, so one SDK
// covers both platforms. Lazily initialised from a service-account JSON in the
// FIREBASE_SERVICE_ACCOUNT env var (same env pattern as the VAPID keys).
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let app: App | null = null;

/** Returns the FCM app, or null if no service account is configured. */
function getApp(): App | null {
  if (app) return app;
  if (getApps().length) { app = getApps()[0]; return app; }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const svc = JSON.parse(raw);
    app = initializeApp({ credential: cert(svc) });
    return app;
  } catch {
    return null;
  }
}

export function fcmConfigured(): boolean {
  return getApp() !== null;
}

export interface FcmPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Send a notification to many device tokens. Returns the list of tokens that
 * are permanently invalid (unregistered/expired) so the caller can prune them —
 * the native analogue of pruning 404/410 Web Push subscriptions.
 */
export async function sendFcm(tokens: string[], payload: FcmPayload): Promise<{ sent: number; invalidTokens: string[] }> {
  const a = getApp();
  if (!a || tokens.length === 0) return { sent: 0, invalidTokens: [] };

  const tag = payload.tag ?? 'forever';
  const res = await getMessaging(a).sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: { url: payload.url ?? '/', tag },
    android: {
      priority: 'high',
      notification: { tag, defaultVibrateTimings: true },
    },
    apns: {
      payload: { aps: { sound: 'default', 'thread-id': tag } },
    },
  });

  const invalidTokens: string[] = [];
  res.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument'
      ) {
        invalidTokens.push(tokens[i]);
      }
    }
  });

  return { sent: res.successCount, invalidTokens };
}
