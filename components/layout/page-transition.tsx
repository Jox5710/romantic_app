'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from '@/lib/i18n/navigation';
import { pageVariants } from '@/lib/animations';
import { useRespectfulMotion } from '@/lib/hooks/use-respectful-motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { shouldLoop } = useRespectfulMotion();

  // Reduced-motion users (or hidden tabs) get instant page swaps — no fade.
  if (!shouldLoop) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ willChange: 'opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
