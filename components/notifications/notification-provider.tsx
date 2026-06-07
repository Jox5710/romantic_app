'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { registerNotificationSW, showNotification, getPermission } from '@/lib/notifications';
import { subscribeToPush } from '@/lib/push';
import { isNative, nativePushPermission, registerNativePush } from '@/lib/native';

const POLL_MS = 15000; // safety-net catch-up; realtime is the primary path

/**
 * App-wide heartbeat notifier. Mounted once near the root so a partner's
 * heartbeat reaches you on ANY page / any open tab — fires a system
 * notification + vibration.
 *
 * Primary transport is Supabase realtime (instant). A slow poll runs as a
 * safety net for anything realtime misses (e.g. while the tab was hidden).
 * Both paths share a `since` high-water mark so the same beat is never notified
 * twice. True delivery while the app is fully CLOSED would need Web Push.
 */
export function NotificationProvider() {
  const { session, coupleId } = useCoupleState();
  const t = useTranslations('notifications');

  // Register the SW and, if the user already granted permission, make sure this
  // device has a current push subscription (covers returning users + key/endpoint
  // rotation) so closed-app heartbeats keep arriving.
  useEffect(() => {
    (async () => {
      // Native shell: refresh the FCM/APNs device token if already permitted.
      // The EnableNotifications button handles the first-time permission prompt.
      if (isNative()) {
        if ((await nativePushPermission()) === 'granted') void registerNativePush();
        return;
      }
      await registerNotificationSW();
      if (getPermission() === 'granted') void subscribeToPush();
    })();
  }, []);

  // Stable refs for values the listeners read, so we don't resubscribe on every
  // render.
  const sinceRef = useRef<string>(new Date().toISOString());
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!coupleId || !session) return;
    const supabase = createClient();
    const me = session.user.id;
    sinceRef.current = new Date().toISOString();

    function notifyPartnerBeat(sentAt: string) {
      // Dedupe across realtime + poll via the high-water mark.
      if (sentAt <= sinceRef.current) return;
      sinceRef.current = sentAt;
      showNotification(tRef.current('heartbeat.title'), tRef.current('heartbeat.body'), {
        url: '/heartbeat',
        tag: 'heartbeat',
      });
    }

    // 1) Realtime — instant.
    const channel = supabase
      .channel(`notify-heartbeat-${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'heartbeats', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          const row = payload.new as { from_user?: string; sent_at?: string };
          if (row.from_user && row.from_user !== me && row.sent_at) {
            notifyPartnerBeat(row.sent_at);
          }
        },
      )
      .subscribe();

    // 2) Poll — safety net for missed events.
    async function poll() {
      if (document.hidden) return;
      const { data } = await supabase
        .from('heartbeats')
        .select('from_user, sent_at')
        .eq('couple_id', coupleId!)
        .neq('from_user', me)
        .gt('sent_at', sinceRef.current)
        .order('sent_at', { ascending: true });
      if (data && data.length) notifyPartnerBeat(data[data.length - 1].sent_at as string);
    }
    const id = setInterval(poll, POLL_MS);
    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [coupleId, session]);

  return null;
}
