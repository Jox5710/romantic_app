'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useMemories, useAddMemory } from '@/lib/queries/memories';
import { GoldButton } from '@/components/ui/gold-button';
import { Card } from '@/components/ui/card';
import { Field, TextareaField } from '@/components/ui/field';
import { BookOpen, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useTutorial } from '@/components/tutorial/use-tutorial';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  caption: z.string().min(1),
  occurred_at: z.string().min(1),
  body: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function TimelinePage() {
  const t = useTranslations('timeline');

  useTutorial('timeline', [
    { id: 'timeline-title', titleKey: 'timeline.step1.title', descKey: 'timeline.step1.desc' },
    { id: 'timeline-add-button', titleKey: 'timeline.step2.title', descKey: 'timeline.step2.desc' },
    { id: 'timeline-list', titleKey: 'timeline.step3.title', descKey: 'timeline.step3.desc' },
  ]);
  const { session, coupleId } = useCoupleState();
  const { data: memories, isLoading } = useMemories(coupleId);
  const addMemory = useAddMemory();
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    if (!coupleId || !session) return;
    await addMemory.mutateAsync({
      couple_id: coupleId,
      created_by: session.user.id,
      occurred_at: new Date(values.occurred_at).toISOString(),
      caption: values.caption,
      body: values.body,
    });
    reset();
    setShowForm(false);
  }

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-start justify-between">
          <div data-tutorial-id="timeline-title">
            <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
            <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
          </div>
          <div data-tutorial-id="timeline-add-button">
            <GoldButton size="sm" onClick={() => setShowForm(true)}>
              <Plus size={14} /> {t('add')}
            </GoldButton>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <Card variant="elevated" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-gold text-sm uppercase tracking-wider">{t('add')}</h2>
                  <button type="button" onClick={() => setShowForm(false)} className="text-muted hover:text-ivory">
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Field label={t('form.caption')} error={errors.caption?.message} {...register('caption')} />
                  <Field label={t('form.date')} type="date" error={errors.occurred_at?.message} {...register('occurred_at')} />
                  <TextareaField textarea label={t('form.body')} {...register('body')} />
                  <GoldButton type="submit" loading={isSubmitting} className="w-full">Save memory</GoldButton>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(n => <div key={n} className="h-24 rounded-2xl shimmer" />)}
          </div>
        ) : !memories?.length ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen size={32} className="mx-auto text-muted" />
            <p className="font-display-en text-2xl text-ivory">{t('empty.title')}</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        ) : (
          <div className="relative" data-tutorial-id="timeline-list">
            <div className="absolute start-4 top-0 bottom-0 w-px bg-line" />
            <div className="space-y-6 ps-10">
              {memories.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  <div className="absolute -start-6 top-5 w-3 h-3 rounded-full border-2 border-gold bg-bg" />
                  <Card variant="elevated" className="space-y-2">
                    <p className="text-xs text-gold font-medium">
                      {format(new Date(m.occurred_at), 'PP')}
                    </p>
                    <p className="font-display-en text-xl text-ivory">{m.caption}</p>
                    {m.body && <p className="text-ivoryDim text-sm leading-relaxed">{m.body}</p>}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
