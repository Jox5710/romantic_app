'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function LangSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = locale === 'en' ? 'ar' : 'en';
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  const label = locale === 'en' ? 'ع' : 'EN';

  return (
    <>
      {/* Full-screen translucent overlay that fades in while locale switch is pending */}
      <AnimatePresence>
        {isPending && (
          <motion.div
            key="locale-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="fixed inset-0 z-[200] bg-bg/60 backdrop-blur-sm pointer-events-none"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={toggle}
        disabled={isPending}
        aria-label="Switch language"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-surface text-sm font-hand text-gold hover:text-goldBright hover:bg-surface2 transition-colors shadow-pop disabled:opacity-50 overflow-hidden"
      >
        {/* Crossfade the label text on locale change */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={label}
            initial={{ opacity: 0, scale: 0.7, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -6 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </>
  );
}
