'use client';

import { useTranslations } from 'next-intl';
import { useCountdown } from '@/lib/hooks/use-countdown';

interface Props {
  weddingDate: string | null;
}

export function Countdown({ weddingDate }: Props) {
  const t = useTranslations('hero.countdown');
  const tCommon = useTranslations('common');
  const { days, hours, minutes, seconds, isPast } = useCountdown(weddingDate);

  if (!weddingDate) return null;

  const units = [
    { value: days, label: tCommon('days') },
    { value: hours, label: tCommon('hours') },
    { value: minutes, label: tCommon('minutes') },
    { value: seconds, label: tCommon('seconds') },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-widest text-muted">
        {isPast ? t('past') : t('title')}
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        {units.map(({ value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-surface2 border border-line shadow-pop"
          >
            <span className="font-display-en text-3xl text-gold tabular-nums leading-none">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs text-muted mt-1">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
