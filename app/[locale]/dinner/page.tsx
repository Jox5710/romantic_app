'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { GoldButton } from '@/components/ui/gold-button';
import { Field } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Plus, X, Check } from 'lucide-react';
import { useTutorial } from '@/components/tutorial/use-tutorial';

interface DinnerOption {
  id: string;
  name: string;
  category: 'restaurant' | 'home_cook';
  note: string | null;
  swipe_a: 'yes' | 'no' | null;
  swipe_b: 'yes' | 'no' | null;
  matched_at: string | null;
}

function useDinnerOptions(coupleId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['dinner', coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      const { data } = await supabase
        .from('dinner_options')
        .select('*')
        .eq('couple_id', coupleId!)
        .order('created_at', { ascending: false });
      return (data ?? []) as DinnerOption[];
    },
  });
}

export default function DinnerPage() {
  const t = useTranslations('dinner');
  const tc = useTranslations('common');
  const { toast } = useToast();

  useTutorial('dinner', [
    { id: 'dinner-title', titleKey: 'dinner.step1.title', descKey: 'dinner.step1.desc' },
    { id: 'dinner-options', titleKey: 'dinner.step2.title', descKey: 'dinner.step2.desc' },
    { id: 'dinner-swipe', titleKey: 'dinner.step3.title', descKey: 'dinner.step3.desc' },
  ]);
  const { coupleId } = useCoupleState();
  const { data: options = [] } = useDinnerOptions(coupleId);
  const qc = useQueryClient();
  const supabase = createClient();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'restaurant' | 'home_cook'>('restaurant');
  const [note, setNote] = useState('');

  // Determine which swipe field is mine (A = initiator, B = partner)
  // We use swipe_a for the first user who swipes, swipe_b for the second
  const isUserA = options.length > 0
    ? options[0].swipe_a !== null || options.every((o) => o.swipe_b === null)
    : true;

  const pendingForMe = options.filter((o) => {
    const mySwipe = isUserA ? o.swipe_a : o.swipe_b;
    return !o.matched_at && mySwipe === null;
  });

  const current = pendingForMe[0];
  const matches = options.filter((o) => o.matched_at);

  const swipe = useMutation({
    mutationFn: async ({ id, vote }: { id: string; vote: 'yes' | 'no' }) => {
      const field = isUserA ? 'swipe_a' : 'swipe_b';
      const other = isUserA ? options.find((o) => o.id === id)?.swipe_b : options.find((o) => o.id === id)?.swipe_a;
      const matched = vote === 'yes' && other === 'yes';
      if (field === 'swipe_a') {
        await supabase.from('dinner_options').update({ swipe_a: vote, matched_at: matched ? new Date().toISOString() : null }).eq('id', id);
      } else {
        await supabase.from('dinner_options').update({ swipe_b: vote, matched_at: matched ? new Date().toISOString() : null }).eq('id', id);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dinner', coupleId] }),
    onError: () => toast(tc('error'), 'error'),
  });

  const addOption = useMutation({
    mutationFn: async () => {
      if (!coupleId) return;
      await supabase.from('dinner_options').insert({ couple_id: coupleId, name, category, note: note || null });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dinner', coupleId] }); setName(''); setNote(''); setShowForm(false); },
    onError: () => toast(tc('error'), 'error'),
  });

  return (
    <RouteGuard>
      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Utensils size={28} className="text-gold" />
          <div>
            <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
            <p className="text-ivoryDim text-sm mt-0.5">{t('subtitle')}</p>
          </div>
        </div>

        {/* Match banner */}
        {matches.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-gold text-xs uppercase tracking-widest">{t('matchesHeader')}</h2>
            {matches.map((m) => (
              <Card key={m.id} variant="elevated" className="flex items-center gap-3 border-gold/40">
                <span className="text-2xl">🎉</span>
                <p className="text-ivory font-medium">{m.name}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Swipe card */}
        {current ? (
          <div className="space-y-4">
            <p className="text-xs text-muted uppercase tracking-widest text-center">
              {pendingForMe.length} option{pendingForMe.length !== 1 ? 's' : ''} to decide
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: -100 }}
                transition={{ duration: 0.25 }}
              >
                <Card variant="elevated" className="text-center py-10 space-y-3">
                  <p className="text-3xl">{current.category === 'restaurant' ? '🍽️' : '🏠'}</p>
                  <h2 className="font-display-en text-3xl text-ivory">{current.name}</h2>
                  {current.note && <p className="text-ivoryDim text-sm">{current.note}</p>}
                  <p className="text-xs text-muted">{t(`categories.${current.category}`)}</p>
                </Card>
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => swipe.mutate({ id: current.id, vote: 'no' })}
                disabled={swipe.isPending}
                className="w-16 h-16 rounded-full border-2 border-red-500/50 text-red-400 flex items-center justify-center hover:bg-red-500/10 active:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('swipeNo')}
              >
                {swipe.isPending ? (
                  <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <X size={24} />
                )}
              </button>
              <button
                type="button"
                onClick={() => swipe.mutate({ id: current.id, vote: 'yes' })}
                disabled={swipe.isPending}
                className="w-16 h-16 rounded-full border-2 border-gold/50 text-gold flex items-center justify-center hover:bg-gold/10 active:bg-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('swipeYes')}
              >
                {swipe.isPending ? (
                  <span className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <Check size={24} />
                )}
              </button>
            </div>
          </div>
        ) : !showForm && (
          <div className="text-center py-12 space-y-4">
            <p className="text-4xl">🍴</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        )}

        {/* Add option */}
        {showForm ? (
          <Card variant="elevated" className="space-y-4">
            <Field label={t('form.name')} value={name} onChange={(e) => setName(e.target.value)} placeholder="Pasta Carbonara" />
            <div className="flex gap-2">
              {(['restaurant', 'home_cook'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={['px-3 py-1.5 rounded-full text-sm border transition-colors',
                    category === cat ? 'bg-gold text-bg border-gold' : 'border-line text-muted'].join(' ')}
                >
                  {t(`categories.${cat}`)}
                </button>
              ))}
            </div>
            <Field label={t('form.note')} value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional details…" />
            <div className="flex gap-2">
              <GoldButton onClick={() => addOption.mutate()} loading={addOption.isPending} size="sm" disabled={!name.trim()}>{tc('add')}</GoldButton>
              <GoldButton variant="ghost" size="sm" onClick={() => setShowForm(false)}>{tc('cancel')}</GoldButton>
            </div>
          </Card>
        ) : (
          <GoldButton variant="ghost" onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus size={16} /> {t('addOption')}
          </GoldButton>
        )}
      </div>
    </RouteGuard>
  );
}
