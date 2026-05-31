'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useCurrentMirrorSession, usePastMirrorSessions, useSubmitMirrorAnswer } from '@/lib/queries/mirror';
import { GoldButton } from '@/components/ui/gold-button';
import { Card } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/components/tutorial/use-tutorial';

export default function MirrorPage() {
  const t = useTranslations('mirror');

  useTutorial('mirror', [
    { id: 'mirror-title', titleKey: 'mirror.step1.title', descKey: 'mirror.step1.desc' },
    { id: 'mirror-question', titleKey: 'mirror.step2.title', descKey: 'mirror.step2.desc' },
    { id: 'mirror-reveal', titleKey: 'mirror.step3.title', descKey: 'mirror.step3.desc' },
  ]);
  const locale = useLocale();
  const { session, coupleId } = useCoupleState();
  const { data: session_ } = useCurrentMirrorSession(coupleId);
  const { data: past } = usePastMirrorSessions(coupleId);
  const submit = useSubmitMirrorAnswer();

  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);

  const myAnswer = session_?.mirror_answers?.find(
    (a: { user_id: string }) => a.user_id === session?.user.id,
  );
  const partnerAnswer = session_?.mirror_answers?.find(
    (a: { user_id: string }) => a.user_id !== session?.user.id,
  );
  const questionText = locale === 'ar'
    ? session_?.mirror_questions?.question_ar
    : session_?.mirror_questions?.question_en;

  async function handleSubmit() {
    if (!session_ || !session) return;
    await submit.mutateAsync({ session_id: session_.id, user_id: session.user.id, answer });
    setAnswer('');
  }

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div data-tutorial-id="mirror-title">
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
        </div>

        {session_ ? (
          <Card variant="elevated" className="space-y-6" data-tutorial-id="mirror-question">
            <p className="text-xs text-muted uppercase tracking-wider">
              {t('week', { date: format(new Date(session_.week_of), 'PP') })}
            </p>
            <p className="font-display-en text-2xl text-ivory leading-snug">{questionText}</p>
            <hr className="gold-line" />

            {!myAnswer ? (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={t('answerPlaceholder')}
                  className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-ivory placeholder:text-muted focus:outline-none focus:border-gold resize-none text-sm"
                />
                <GoldButton onClick={handleSubmit} loading={submit.isPending} disabled={!answer.trim()} className="w-full">
                  {t('submit')}
                </GoldButton>
              </div>
            ) : !partnerAnswer ? (
              <p className="text-muted text-sm italic text-center">{t('waiting')}</p>
            ) : (
              <>
                {!revealed ? (
                  <GoldButton onClick={() => setRevealed(true)} className="w-full">{t('reveal')} ✦</GoldButton>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      {[
                        { label: t('you'), ans: myAnswer },
                        { label: t('partner'), ans: partnerAnswer },
                      ].map(({ label, ans }) => (
                        <Card key={label} className="space-y-2">
                          <p className="text-xs text-gold uppercase">{label}</p>
                          <p className="text-ivory text-sm leading-relaxed">{ans.answer}</p>
                        </Card>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </>
            )}
          </Card>
        ) : (
          <div className="text-center py-16 space-y-3">
            <Eye size={32} className="mx-auto text-muted" />
            <p className="font-display-en text-2xl text-ivory">{t('empty.title')}</p>
            <p className="text-muted text-sm">{t('empty.body')}</p>
          </div>
        )}

        {past && past.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-muted uppercase tracking-wider">{t('pastTitle')}</p>
            {past.map((s: { id: string; week_of: string; mirror_questions: { question_en: string; question_ar: string }; mirror_answers: Array<{ answer: string; user_id: string }> }) => {
              const q = locale === 'ar' ? s.mirror_questions?.question_ar : s.mirror_questions?.question_en;
              return (
                <Card key={s.id} className="space-y-2 opacity-70 hover:opacity-100 transition-opacity">
                  <p className="text-xs text-muted">{format(new Date(s.week_of), 'PP')}</p>
                  <p className="text-ivoryDim text-sm">{q}</p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
