'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { usePromises, useAddPromise, useCheckPromise } from '@/lib/queries/promises';
import { GoldButton } from '@/components/ui/gold-button';
import { GoldSeal } from '@/components/ui/gold-seal';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { ScrollText, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PromiseCadence } from '@/lib/supabase/types';
import { useTutorial } from '@/components/tutorial/use-tutorial';

export default function PromisesPage() {
  const t = useTranslations('promises');
  const tc = useTranslations('common');

  useTutorial('promises', [
    { id: 'promises-title', titleKey: 'promises.step1.title', descKey: 'promises.step1.desc' },
    { id: 'promises-list', titleKey: 'promises.step2.title', descKey: 'promises.step2.desc' },
    { id: 'promises-seal', titleKey: 'promises.step3.title', descKey: 'promises.step3.desc' },
  ]);
  const { session, coupleId } = useCoupleState();
  const { data: promises } = usePromises(coupleId);
  const add = useAddPromise();
  const check = useCheckPromise();

  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');
  const [cadence, setCadence] = useState<PromiseCadence>('once');
  const [checkedId, setCheckedId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ id: string; kept: boolean } | null>(null);

  async function submit() {
    if (!coupleId || !session || !text.trim()) return;
    await add.mutateAsync({ couple_id: coupleId, author_id: session.user.id, text, cadence });
    setText(''); setShowForm(false);
  }

  async function handleCheck(id: string, kept: boolean, currentKept: number, currentBroken: number) {
    setCheckedId(id);
    await check.mutateAsync({ promise_id: id, kept, currentKept, currentBroken });
    setFeedbackMsg({ id, kept });
    setTimeout(() => { setFeedbackMsg(null); setCheckedId(null); }, 2000);
  }

  const cadences: PromiseCadence[] = ['once', 'daily', 'weekly', 'monthly', 'yearly'];

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
            <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
          </div>
          <GoldButton size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> {t('add')}</GoldButton>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card variant="elevated" className="space-y-4">
                <Field label={t('form.text')} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
                <div className="space-y-1.5">
                  <label className="text-xs text-ivoryDim uppercase tracking-wider">{t('form.cadence')}</label>
                  <div className="flex flex-wrap gap-2">
                    {cadences.map((c) => (
                      <button key={c} type="button" onClick={() => setCadence(c)}
                        className={['px-3 py-1.5 rounded-full border text-xs transition-all', cadence === c ? 'border-gold bg-gold/10 text-gold' : 'border-line text-muted'].join(' ')}>
                        {t(`form.cadences.${c}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <GoldButton onClick={submit} loading={add.isPending} disabled={!text.trim()}>{tc('save')}</GoldButton>
                  <GoldButton variant="ghost" onClick={() => setShowForm(false)}>{tc('cancel')}</GoldButton>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!promises?.length ? (
          <div className="text-center py-16 space-y-3">
            <ScrollText size={32} className="mx-auto text-muted" />
            <p className="font-display-en text-2xl text-ivory">{t('empty.title')}</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {promises.map((p) => (
              <Card key={p.id} variant="elevated" className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-ivory">{p.text}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted capitalize">{p.cadence}</span>
                      <span className="text-xs text-gold">✓ {p.kept_count}</span>
                      <span className="text-xs text-muted">✗ {p.broken_count}</span>
                    </div>
                  </div>
                  {feedbackMsg?.id === p.id ? (
                    <div className="flex flex-col items-center gap-1">
                      {feedbackMsg.kept ? <GoldSeal size={36} /> : <p className="text-xs text-ivoryDim italic">{t('brokenMessage')}</p>}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <GoldButton size="sm" onClick={() => handleCheck(p.id, true, p.kept_count, p.broken_count)} loading={checkedId === p.id}>
                        {t('kept')}
                      </GoldButton>
                      <GoldButton size="sm" variant="ghost" onClick={() => handleCheck(p.id, false, p.kept_count, p.broken_count)} loading={checkedId === p.id}>
                        {t('broken')}
                      </GoldButton>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
