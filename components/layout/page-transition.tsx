'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from '@/lib/i18n/navigation';
import { pageVariants } from '@/lib/animations';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
