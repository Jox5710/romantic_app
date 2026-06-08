'use client';

import { useTheme } from './theme-provider';
import { useTranslations } from 'next-intl';
import { Sun, Sunset, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

const themes = [
  { key: 'day', icon: Sun },
  { key: 'dusk', icon: Sunset },
  { key: 'night', icon: Moon },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme, isTransitioning } = useTheme();
  const t = useTranslations('theme');
  const reducedMotion = useReducedMotion();

  return (
    <>
      {/* Full-screen radial overlay that fades out after a theme change,
          masking the palette swap so it feels like a smooth reveal rather
          than an abrupt colour flash. Skipped for users who prefer reduced motion. */}
      {!reducedMotion && (
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              key="theme-overlay"
              initial={{ opacity: 0.55 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className="fixed inset-0 z-[199] pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(201,169,97,0.18) 0%, rgba(0,0,0,0.55) 100%)',
              }}
            />
          )}
        </AnimatePresence>
      )}

      <div
        role="group"
        aria-label="Choose theme"
        className="flex items-center gap-1 rounded-full bg-surface px-2 py-1 shadow-pop"
      >
        {themes.map(({ key, icon: Icon }) => {
          const isActive = theme === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              aria-label={t(key)}
              aria-pressed={isActive}
              className="relative flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-200"
            >
              {/* Animated background pill for the active state */}
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.span
                    key="active-pill"
                    layoutId="theme-active-pill"
                    className="absolute inset-0 rounded-full bg-gold shadow-gold"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 280 }}
                    aria-hidden="true"
                  />
                )}
              </AnimatePresence>
              <span className={['relative z-10 transition-colors duration-200', isActive ? 'text-bg' : 'text-muted hover:text-gold'].join(' ')}>
                <Icon size={14} />
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
