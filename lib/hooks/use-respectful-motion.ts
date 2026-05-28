'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Gates infinite-loop Framer Motion animations so they only run when:
 *   1. The user has not opted into `prefers-reduced-motion: reduce`
 *   2. The current document/tab is visible
 *
 * Replace `repeat: Infinity` with `repeat` from this hook:
 *
 *   const { repeat } = useRespectfulMotion();
 *   <motion.span animate={{ scale: [0, 1, 0] }}
 *                transition={{ duration: 2, repeat, ease: 'easeInOut' }} />
 *
 * When the user switches tabs or sets prefers-reduced-motion, `repeat` becomes 0
 * so the animation plays exactly once and stops — no wasted CPU, no jank on
 * resume, no accessibility violation.
 */
export function useRespectfulMotion() {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = () => setVisible(document.visibilityState === 'visible');
    handler();
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const shouldLoop = !reducedMotion && visible;
  return {
    shouldLoop,
    repeat: shouldLoop ? Infinity : 0,
  } as const;
}
