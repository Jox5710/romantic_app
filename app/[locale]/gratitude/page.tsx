'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useGratitudes, useAddGratitude } from '@/lib/queries/gratitude';
import { GoldButton } from '@/components/ui/gold-button';
import { Feather } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTutorial } from '@/components/tutorial/use-tutorial';

export default function GratitudePage() {
  const t = useTranslations('gratitude');

  useTutorial('gratitude', [
    { id: 'gratitude-title', titleKey: 'gratitude.step1.title', descKey: 'gratitude.step1.desc' },
    { id: 'gratitude-input', titleKey: 'gratitude.step2.title', descKey: 'gratitude.step2.desc' },
    { id: 'gratitude-list', titleKey: 'gratitude.step3.title', descKey: 'gratitude.step3.desc' },
  ]);
  const { session, coupleId } = useCoupleState();
  const { data: entries } = useGratitudes(coupleId);
  const add = useAddGratitude();
  const [text, setText] = useState('');

  async function submit() {
    if (!coupleId || !session || !text.trim()) return;
    await add.mutateAsync({ couple_id: coupleId, user_id: session.user.id, for_text: text });
    setText('');
  }

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div data-tutorial-id="gratitude-title">
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
        </div>

        <div className="flex gap-2" data-tutorial-id="gratitude-input">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={t('placeholder')}
            className="flex-1 bg-surface2 border border-line rounded-full px-5 py-3 text-ivory placeholder:text-muted focus:outline-none focus:border-gold text-sm"
          />
          <GoldButton onClick={submit} loading={add.isPending} disabled={!text.trim()}>
            {t('submit')}
          </GoldButton>
        </div>

        {(!entries || entries.length === 0) ? (
          <div className="text-center py-12 space-y-3">
            <Feather size={32} className="mx-auto text-muted" />
            <p className="text-ivoryDim font-display-en text-xl">{t('empty.title')}</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        ) : (
          <div className="space-y-3" data-tutorial-id="gratitude-list">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-ivory text-sm leading-relaxed">{entry.for_text}</p>
                  <p className="text-muted text-xs mt-0.5">
                    {format(new Date(entry.created_at), 'PP')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
