'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { GoldButton } from '@/components/ui/gold-button';
import { useToast } from '@/components/ui/toast';
import { useRouter } from '@/lib/i18n/navigation';
import { useCoupleState } from '@/lib/hooks/use-couple-state';

export default function AwaitingPage() {
  const t = useTranslations('auth.awaiting');
  const { toast } = useToast();
  const router = useRouter();
  const { coupleState, coupleId } = useCoupleState();

  useEffect(() => {
    if (coupleState === 'approved') {
      router.replace('/');
    }
  }, [coupleState, router]);

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
            router.replace('/');
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [coupleId, router]);

  async function submitForReview() {
    if (!coupleId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('couples')
      .update({ state: 'pending_admin' })
      .eq('id', coupleId);
    if (error) toast(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center animate-fade-up">
        <div className="w-20 h-20 mx-auto rounded-full border-2 border-gold shimmer" />
        <div className="space-y-2">
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm">{t('subtitle')}</p>
        </div>

        {coupleState === 'mutual' && (
          <GoldButton onClick={submitForReview} size="lg" className="w-full">
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
