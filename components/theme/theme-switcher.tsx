'use client';

import { useTheme } from './theme-provider';
import { useTranslations } from 'next-intl';
import { Sun, Sunset, Moon } from 'lucide-react';

const themes = [
  { key: 'day', icon: Sun },
  { key: 'dusk', icon: Sunset },
  { key: 'night', icon: Moon },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('theme');

  return (
    <div
      role="group"
      aria-label="Choose theme"
      className="flex items-center gap-1 rounded-full bg-surface px-2 py-1 shadow-pop"
    >
      {themes.map(({ key, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => setTheme(key)}
          aria-label={t(key)}
          aria-pressed={theme === key}
          className={[
            'flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300',
            theme === key
              ? 'bg-gold text-bg shadow-gold'
              : 'text-muted hover:text-gold',
          ].join(' ')}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
