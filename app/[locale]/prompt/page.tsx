'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { RouteGuard } from '@/components/route-guard';
import { useCoupleState } from '@/lib/hooks/use-couple-state';
import { useTodayPrompt, useTodayAnswers, useSubmitAnswer } from '@/lib/queries/prompt';
import { GoldButton } from '@/components/ui/gold-button';
import { Card } from '@/components/ui/card';
import { useTutorial } from '@/components/tutorial/use-tutorial';

export default function PromptPage() {
  const t = useTranslations('prompt');

  useTutorial('prompt', [
    { id: 'prompt-title', titleKey: 'prompt.step1.title', descKey: 'prompt.step1.desc' },
    { id: 'prompt-answer', titleKey: 'prompt.step2.title', descKey: 'prompt.step2.desc' },
    { id: 'prompt-reveal', titleKey: 'prompt.step3.title', descKey: 'prompt.step3.desc' },
  ]);
  const locale = useLocale();
  const { session, coupleId } = useCoupleState();
  const { data: promptData } = useTodayPrompt(locale);
  const { data: answers } = useTodayAnswers(coupleId, promptData?.prompt.id ?? null);
  const submit = useSubmitAnswer();

  const [text, setText] = useState('');
  const myAnswer = answers?.find((a) => a.user_id === session?.user.id);
  const partnerAnswer = answers?.find((a) => a.user_id !== session?.user.id);
  const bothAnswered = myAnswer && partnerAnswer;

  async function handleSubmit() {
    if (!coupleId || !session || !promptData) return;
    await submit.mutateAsync({
      couple_id: coupleId,
      prompt_id: promptData.prompt.id,
      user_id: session.user.id,
      answer: text,
      for_date: promptData.today,
    });
    setText('');
  }

  const promptText = locale === 'ar' ? promptData?.prompt.prompt_ar : promptData?.prompt.prompt_en;

  return (
    <RouteGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div data-tutorial-id="prompt-title">
          <h1 className="font-display-en text-4xl text-ivory">{t('title')}</h1>
          <p className="text-ivoryDim text-sm mt-1">{t('subtitle')}</p>
        </div>

        {promptData && (
          <Card variant="elevated" className="space-y-6" data-tutorial-id="prompt-answer">
            <p className="font-display-en text-2xl text-ivory leading-snug">{promptText}</p>
            <hr className="gold-line" />

            {!myAnswer ? (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('answerPlaceholder')}
                  className="w-full bg-surface2 border border-line rounded-xl px-4 py-3 text-ivory placeholder:text-muted focus:outline-none focus:border-gold resize-none text-sm"
                />
                <GoldButton
                  onClick={handleSubmit}
                  loading={submit.isPending}
                  disabled={!text.trim()}
                  className="w-full"
                >
                  {t('submit')}
                </GoldButton>
              </div>
            ) : !partnerAnswer ? (
              <p className="text-muted text-sm italic text-center">{t('waitingReveal')}</p>
            ) : null}

            {bothAnswered && (
              <div className="grid grid-cols-2 gap-4">
                {[myAnswer, partnerAnswer].map((a, i) => (
                  <Card key={a.id} className="space-y-2">
                    <p className="text-xs text-gold uppercase tracking-wider">
                      {i === 0 ? 'You' : 'Partner'}
                    </p>
                    <p className="text-ivory text-sm leading-relaxed">{a.answer}</p>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
