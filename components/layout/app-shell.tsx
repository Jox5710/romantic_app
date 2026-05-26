'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { LangSwitcher } from './lang-switcher';
import { Link } from '@/lib/i18n/navigation';
import { useTutorialContext } from '@/components/tutorial/tutorial-provider';

function TutorialTriggerButton() {
  const { canTriggerPageTutorial, triggerPageTutorial } = useTutorialContext();

  if (!canTriggerPageTutorial) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      onClick={triggerPageTutorial}
      aria-label="Open tutorial"
      className="flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-gold/30 text-xs font-semibold text-gold hover:text-goldBright hover:border-gold/60 transition-colors shadow-pop"
    >
      ?
    </motion.button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 bg-bg/80 backdrop-blur-sm border-b border-line">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.1 }}
        >
          <Link href="/" className="flex items-center gap-2 text-gold">
            <Image
              src="/forever-logo.png"
              alt="Forever"
              width={110}
              height={60}
              className="object-contain drop-shadow-[0_0_10px_rgba(201,169,97,0.55)]"
              priority
            />
            <span className="font-display-en text-2xl">Forever</span>
          </Link>
        </motion.div>

        <div className="flex items-center gap-2">
          <TutorialTriggerButton />
          <ThemeSwitcher />
          <LangSwitcher />
        </div>
      </header>

      <main className="relative z-10 flex-1 pt-24">
        {children}
      </main>
    </div>
  );
}
