'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { GoldButton } from '@/components/ui/gold-button';
import { useToast } from '@/components/ui/toast';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useTutorial } from '@/components/tutorial/use-tutorial';

export default function AwaitingPage() {
  const t = useTranslations('auth.awaiting');
  const { toast } = useToast();
  const locale = useLocale();
  const { coupleState, coupleId } = useCoupleState();
  const [submitting, setSubmitting] = useState(false);

  // Full document load (not SPA) so the dashboard mounts fresh on approval —
  // same reasoning as the sign-in redirect (avoids a blank first render).
  const goHome = () => window.location.assign(`/${locale}`);

  useTutorial('awaiting', [
    { id: 'awaiting-title', titleKey: 'awaiting.step1.title', descKey: 'awaiting.step1.desc' },
    { id: 'awaiting-submit', titleKey: 'awaiting.step2.title', descKey: 'awaiting.step2.desc' },
    { id: 'awaiting-title', titleKey: 'awaiting.step3.title', descKey: 'awaiting.step3.desc' },
  ]);

  useEffect(() => {
    if (coupleState === 'approved') {
      goHome();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleState]);

  useEffect(() => {
    if (!coupleId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`couple-state-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${coupleId}`,
        },
        (payload) => {
          if ((payload.new as { state: string }).state === 'approved') {
            goHome();
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId]);

  async function submitForReview() {
    if (!coupleId) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('couples')
      .update({ state: 'pending_admin' })
      .eq('id', coupleId);
    if (error) toast(error.message);
    setSubmitting(false);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center animate-fade-up">
        <div className="w-20 h-20 mx-auto rounded-full border-2 border-gold shimmer" />
        <div className="space-y-2" data-tutorial-id="awaiting-title">
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm">{t('subtitle')}</p>
        </div>

        {coupleState === 'invited' && (
          <p className="text-muted text-sm italic">{t('waitingForPartner')}</p>
        )}

        {coupleState === 'mutual' && (
          <GoldButton onClick={submitForReview} loading={submitting} size="lg" className="w-full" data-tutorial-id="awaiting-submit">
            {t('submitForReview')}
          </GoldButton>
        )}

        {coupleState === 'pending_admin' && (
          <p className="text-muted text-sm italic">{t('pending')}</p>
        )}
      </div>
    </div>
  );
}
