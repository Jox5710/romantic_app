'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useVibes, useUpsertVibe } from '@/lib/queries/vibe';
import { MoodPicker } from './mood-picker';
import { GoldButton } from '@/components/ui/gold-button';
import { Field } from '@/components/ui/field';
import { Card } from '@/components/ui/card';

export function VibeSync() {
  const t = useTranslations('vibe');
  const { session, coupleId } = useCoupleState();
  const { data: vibes, refetch } = useVibes(coupleId);
  const upsert = useUpsertVibe();

  const [mood, setMood] = useState('tender');
  const [energy, setEnergy] = useState(3);
  const [craving, setCraving] = useState('');

  const partnerVibe = vibes?.find((v) => v.user_id !== session?.user.id);

  useEffect(() => {
    if (!coupleId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`vibe-${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vibe_pings', filter: `couple_id=eq.${coupleId}` }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [coupleId, refetch]);

  async function save() {
    if (!coupleId || !session) return;
    await upsert.mutateAsync({ couple_id: coupleId, user_id: session.user.id, mood, energy, craving });
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto px-4 py-8">
      <div>
        <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
        <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
      </div>

      <Card variant="elevated" className="space-y-5">
        <h2 className="text-gold text-sm uppercase tracking-wider">{t('myVibe')}</h2>
        <MoodPicker value={mood} onChange={setMood} />

        <div className="space-y-2">
          <p className="text-xs text-ivoryDim uppercase tracking-wider">{t('energy')}</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEnergy(n)}
                aria-pressed={energy === n}
                className={[
                  'w-9 h-9 rounded-full border text-sm font-medium transition-all',
                  energy >= n ? 'border-gold bg-gold/10 text-gold' : 'border-line text-muted',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <Field
          label={t('craving')}
          placeholder={t('cravingPlaceholder')}
          value={craving}
          onChange={(e) => setCraving(e.target.value)}
        />

        <GoldButton onClick={save} loading={upsert.isPending} className="w-full">
          Save vibe
        </GoldButton>
      </Card>

      {partnerVibe ? (
        <Card variant="elevated" className="space-y-3">
          <h2 className="text-gold text-sm uppercase tracking-wider">{t('partnerVibe')}</h2>
          <p className="text-ivory text-lg">{partnerVibe.mood}</p>
          {partnerVibe.energy && (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className={['w-3 h-3 rounded-full', (partnerVibe.energy ?? 0) >= n ? 'bg-gold' : 'bg-surface2'].join(' ')} />
              ))}
            </div>
          )}
          {partnerVibe.craving && <p className="text-ivoryDim text-sm italic">&ldquo;{partnerVibe.craving}&rdquo;</p>}
        </Card>
      ) : (
        <div className="text-center py-8 text-muted text-sm">{t('empty.body')}</div>
      )}
    </div>
  );
}
