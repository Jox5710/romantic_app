'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useTodayHeartbeats, useSendHeartbeat } from '@/lib/queries/heartbeat';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/components/tutorial/use-tutorial';

export default function HeartbeatPage() {
  const t = useTranslations('heartbeat');

  useTutorial('heartbeat', [
    { id: 'heartbeat-title', titleKey: 'heartbeat.step1.title', descKey: 'heartbeat.step1.desc' },
    { id: 'heartbeat-button', titleKey: 'heartbeat.step2.title', descKey: 'heartbeat.step2.desc' },
    { id: 'heartbeat-counts', titleKey: 'heartbeat.step3.title', descKey: 'heartbeat.step3.desc' },
  ]);
  const { session, coupleId } = useCoupleState();
  const { data: beats, refetch } = useTodayHeartbeats(coupleId);
  const send = useSendHeartbeat();
  const [pulsing, setPulsing] = useState(false);

  const [partnerUserId, setPartnerUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!coupleId || !session) return;
    const supabase = createClient();
    supabase
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', coupleId)
      .neq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setPartnerUserId(data?.user_id ?? null));
  }, [coupleId, session]);

  useEffect(() => {
    if (!coupleId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`heartbeat-${coupleId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'heartbeats', filter: `couple_id=eq.${coupleId}` }, () => {
        refetch();
        setPulsing(true);
        setTimeout(() => setPulsing(false), 1000);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [coupleId, refetch]);

  async function tap() {
    if (!coupleId || !session || !partnerUserId) return;
    await send.mutateAsync({ couple_id: coupleId, from_user: session.user.id, to_user: partnerUserId });
    setPulsing(true);
    setTimeout(() => setPulsing(false), 1000);
  }

  const myBeats = beats?.filter((b) => b.from_user === session?.user.id).length ?? 0;
  const partnerBeats = beats?.filter((b) => b.from_user !== session?.user.id).length ?? 0;

  return (
    <RouteGuard>
      <div className="min-h-dvh flex flex-col items-center justify-center gap-8 px-4 py-12">
        <div className="text-center space-y-1" data-tutorial-id="heartbeat-title">
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm">{t('subtitle')}</p>
        </div>

        <button
          type="button"
          onClick={tap}
          disabled={send.isPending}
          aria-label={t('send')}
          data-tutorial-id="heartbeat-button"
          className="relative w-40 h-40 rounded-full bg-surface2 border-2 border-gold/40 flex items-center justify-center hover:border-gold transition-all active:scale-95 shadow-gold disabled:opacity-50"
        >
          <AnimatePresence>
            {pulsing && (
              <motion.div
                key="ring"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 rounded-full border-2 border-gold"
              />
            )}
          </AnimatePresence>
          <motion.div animate={pulsing ? { scale: [1, 1.2, 0.95, 1] } : {}} transition={{ duration: 0.5 }}>
            <svg viewBox="0 0 24 24" width="60" height="60" fill="var(--gold)">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
        </button>

        <div className="flex gap-8 text-center" data-tutorial-id="heartbeat-counts">
          <div>
            <p className="text-3xl font-display-en text-gold">{myBeats}</p>
            <p className="text-xs text-muted">You sent</p>
          </div>
          <div>
            <p className="text-3xl font-display-en text-gold">{partnerBeats}</p>
            <p className="text-xs text-muted">Partner sent</p>
          </div>
        </div>

        <p className="text-xs text-muted">{t('today')}</p>
      </div>
    </RouteGuard>
  );
}
