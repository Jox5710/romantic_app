'use client';

import { useTranslations } from 'next-intl';
import type { WhisperFeeling } from '@/lib/supabase/types';

const FEELINGS: WhisperFeeling[] = [
  'unseen','distant','tender','weary','anxious','small','alone','frustrated','hurt','longing',
];

interface Props {
  value: WhisperFeeling;
  onChange: (f: WhisperFeeling) => void;
}

export function FeelingChips({ value, onChange }: Props) {
  const t = useTranslations('whisper.feelings');

  return (
    <div className="flex flex-wrap gap-2">
      {FEELINGS.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          aria-pressed={value === f}
          className={[
            'px-3 py-1.5 rounded-full border text-sm transition-all',
            value === f ? 'border-gold bg-gold/10 text-gold' : 'border-line text-muted hover:border-gold/40',
          ].join(' ')}
        >
          {t(f)}
        </button>
      ))}
    </div>
  );
}
