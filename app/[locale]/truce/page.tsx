'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { GoldButton } from '@/components/ui/gold-button';
import { Feather } from 'lucide-react';
import { addMinutes, differenceInSeconds } from 'date-fns';
import { useTutorial } from '@/components/tutorial/use-tutorial';

interface TruceSession {
  id: string;
  triggered_by: string;
  expires_at: string;
  i_feel: string | null;
  partner_i_feel: string | null;
  resolved_at: string | null;
}

function useActiveTruce(coupleId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['truce', coupleId],
    enabled: !!coupleId,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data } = await supabase
        .from('truce_sessions')
        .select('*')
        .eq('couple_id', coupleId!)
        .is('resolved_at', null)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();
      return data as TruceSession | null;
    },
  });
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(differenceInSeconds(new Date(expiresAt), new Date()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(differenceInSeconds(new Date(expiresAt), new Date()));
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining <= 0) return <span className="text-muted text-sm">Harbor closed</span>;

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <p className="text-gold font-mono text-2xl">{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</p>
  );
}

export default function TrucePage() {
  const t = useTranslations('truce');

  useTutorial('truce', [
    { id: 'truce-title', titleKey: 'truce.step1.title', descKey: 'truce.step1.desc' },
    { id: 'truce-timer', titleKey: 'truce.step2.title', descKey: 'truce.step2.desc' },
    { id: 'truce-feel', titleKey: 'truce.step3.title', descKey: 'truce.step3.desc' },
  ]);
  const { session, coupleId } = useCoupleState();
  const { data: active } = useActiveTruce(coupleId);
  const qc = useQueryClient();
  const supabase = createClient();
  const [text, setText] = useState('');

  const trigger = useMutation({
    mutationFn: async () => {
      if (!coupleId || !session) return;
      await supabase.from('truce_sessions').insert({
        couple_id: coupleId,
        triggered_by: session.user.id,
        expires_at: addMinutes(new Date(), 20).toISOString(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['truce', coupleId] }),
  });

  const shareFeeling = useMutation({
    mutationFn: async () => {
      if (!active || !session) return;
      const isInitiator = active.triggered_by === session.user.id;
      if (isInitiator) {
        await supabase.from('truce_sessions').update({ i_feel: text }).eq('id', active.id);
      } else {
        await supabase.from('truce_sessions').update({ partner_i_feel: text }).eq('id', active.id);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['truce', coupleId] }); setText(''); },
  });

  const myFeeling = active?.triggered_by === session?.user.id ? active?.i_feel : active?.partner_i_feel;

  return (
    <RouteGuard>
      <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Feather size={28} className="text-blue-400" />
          <div>
            <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
            <p className="text-ivoryDim text-sm mt-0.5">{t('subtitle')}</p>
          </div>
        </div>

        {active ? (
          <div className="space-y-6">
            <Card variant="elevated" className="text-center space-y-3 py-8 border-blue-900/40">
              <p className="text-blue-300 text-xs uppercase tracking-widest">{t('active.title')}</p>
              <p className="text-ivoryDim text-sm">{t('active.subtitle')}</p>
              <Countdown expiresAt={active.expires_at} />
            </Card>

            {!myFeeling ? (
              <Card variant="elevated" className="space-y-4">
                <p className="text-xs text-muted uppercase tracking-widest">{t('active.iFeelPrompt')}</p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('active.iFeelPlaceholder')}
                  rows={4}
                  className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-ivory placeholder:text-muted focus:outline-none focus:border-blue-500 resize-none text-sm"
                />
                <GoldButton
                  onClick={() => shareFeeling.mutate()}
                  loading={shareFeeling.isPending}
                  disabled={!text.trim()}
                  className="w-full"
                >
                  {t('active.submit')}
                </GoldButton>
              </Card>
            ) : (
              <Card variant="elevated" className="space-y-2 border-blue-900/20">
                <p className="text-xs text-muted uppercase tracking-wider">Your feelings, shared</p>
                <p className="text-ivory italic">&ldquo;{myFeeling}&rdquo;</p>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Card variant="elevated" className="text-center py-12 space-y-4">
              <p className="text-3xl">🌊</p>
              <p className="text-ivory">{t('empty.body')}</p>
            </Card>
            <GoldButton
              onClick={() => trigger.mutate()}
              loading={trigger.isPending}
              className="w-full"
              variant="ghost"
            >
              {t('trigger')}
            </GoldButton>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
