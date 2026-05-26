'use client';

import { useTranslations } from 'next-intl';

const MOODS = [
  { key: 'tender', emoji: '🥰' },
  { key: 'playful', emoji: '😄' },
  { key: 'tired', emoji: '😴' },
  { key: 'stressed', emoji: '😤' },
  { key: 'grateful', emoji: '🙏' },
  { key: 'craving_you', emoji: '💛' },
] as const;

type MoodKey = (typeof MOODS)[number]['key'];

interface Props {
  value: string;
  onChange: (mood: MoodKey) => void;
}

export function MoodPicker({ value, onChange }: Props) {
  const t = useTranslations('vibe.moods');

  return (
    <div className="flex flex-wrap gap-2">
      {MOODS.map(({ key, emoji }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={[
            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all',
            value === key
              ? 'border-gold bg-gold/10 text-gold'
              : 'border-line text-muted hover:border-gold/40 hover:text-ivory',
          ].join(' ')}
        >
          <span>{emoji}</span>
          <span>{t(key)}</span>
        </button>
      ))}
    </div>
  );
}
