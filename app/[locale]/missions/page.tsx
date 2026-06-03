'use client';

import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { GoldButton } from '@/components/ui/gold-button';
import { GoldSeal } from '@/components/ui/gold-seal';
import { format, addDays } from 'date-fns';
import { Swords } from 'lucide-react';
import { useTutorial } from '@/components/tutorial/use-tutorial';
import { useToast } from '@/components/ui/toast';

interface Mission {
  id: string;
  assigned_to: string;
  text: string;
  deadline_at: string;
  completed_at: string | null;
  verified_at: string | null;
}

function useMissions(coupleId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['missions', coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      const { data } = await supabase
        .from('missions')
        .select('*')
        .eq('couple_id', coupleId!)
        .order('created_at', { ascending: false });
      return (data ?? []) as Mission[];
    },
  });
}

export default function MissionsPage() {
  const t = useTranslations('missions');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { toast } = useToast();

  useTutorial('missions', [
    { id: 'missions-title', titleKey: 'missions.step1.title', descKey: 'missions.step1.desc' },
    { id: 'missions-card', titleKey: 'missions.step2.title', descKey: 'missions.step2.desc' },
    { id: 'missions-complete', titleKey: 'missions.step3.title', descKey: 'missions.step3.desc' },
  ]);
  const { session, coupleId } = useCoupleState();
  const { data: missions = [] } = useMissions(coupleId);
  const qc = useQueryClient();
  const supabase = createClient();

  const myMission = missions.find((m) => m.assigned_to === session?.user.id && !m.verified_at);
  const partnerMission = missions.find((m) => m.assigned_to !== session?.user.id && !m.verified_at);

  const assign = useMutation({
    mutationFn: async () => {
      if (!coupleId || !session) return;
      // Ask Gemini for a personalized mission via our server-side route.
      // The route reads the couple's names through RLS and crafts the prompt.
      const r = await fetch('/api/llm/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      if (!r.ok) throw new Error('mission generation failed');
      const j = (await r.json()) as { mission?: string };
      const text = j.mission?.trim();
      if (!text) throw new Error('empty mission');
      await supabase.from('missions').insert({
        couple_id: coupleId,
        assigned_to: session.user.id,
        text,
        deadline_at: addDays(new Date(), 2).toISOString(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['missions', coupleId] }),
    onError: () => toast(tc('error'), 'error'),
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('missions').update({ completed_at: new Date().toISOString() }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['missions', coupleId] }),
    onError: () => toast(tc('error'), 'error'),
  });

  const verify = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('missions').update({ verified_at: new Date().toISOString() }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['missions', coupleId] }),
    onError: () => toast(tc('error'), 'error'),
  });

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Swords size={28} className="text-gold" />
          <div>
            <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
            <p className="text-ivoryDim text-sm mt-0.5">{t('subtitle')}</p>
          </div>
        </div>

        {/* My mission */}
        <div className="space-y-3">
          <h2 className="text-gold text-xs uppercase tracking-widest">{t('header')}</h2>
          {myMission ? (
            <Card variant="elevated" className="space-y-4">
              <p className="text-ivory leading-relaxed">{myMission.text}</p>
              <p className="text-xs text-muted">{t('deadline', { date: format(new Date(myMission.deadline_at), 'PPP') })}</p>
              {myMission.completed_at ? (
                <div className="flex items-center gap-3">
                  <GoldSeal />
                  <p className="text-gold">{t('status.completed')}</p>
                </div>
              ) : (
                <GoldButton onClick={() => complete.mutate(myMission.id)} loading={complete.isPending} size="sm">
                  {t('accomplish')}
                </GoldButton>
              )}
            </Card>
          ) : (
            <Card variant="elevated" className="text-center py-8 space-y-3">
              <p className="text-muted text-sm">{t('empty.body')}</p>
              <GoldButton onClick={() => assign.mutate()} loading={assign.isPending} size="sm">
                {t('getMission')}
              </GoldButton>
            </Card>
          )}
        </div>

        {/* Partner's mission — verify */}
        {partnerMission?.completed_at && !partnerMission.verified_at && (
          <div className="space-y-3">
            <h2 className="text-gold text-xs uppercase tracking-widest">{t('verify')}</h2>
            <Card variant="elevated" className="space-y-4">
              <p className="text-ivory">{partnerMission.text}</p>
              <GoldButton onClick={() => verify.mutate(partnerMission.id)} loading={verify.isPending} size="sm">
                {t('confirmVerify')} ✦
              </GoldButton>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
