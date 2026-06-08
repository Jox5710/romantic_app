'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { usePathname } from '@/lib/i18n/navigation';
import { useRespectfulMotion } from '@/lib/hooks/use-respectful-motion';

// Romantic transition: soft fade + gentle upward slide + subtle scale lift.
// Easing curve ([0.25, 0.1, 0.25, 1]) gives a natural, unhurried feel.
const romanticVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.38,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 1, 1],
    },
  },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { shouldLoop } = useRespectfulMotion();

  // Reduced-motion users (or hidden tabs) get instant page swaps — no fade.
  if (!shouldLoop) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={romanticVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ willChange: 'opacity, transform' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
