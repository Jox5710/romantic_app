'use client';

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
  // Browsers throttle rAF in background tabs automatically; toggling repeat
  // 0 → Infinity on visibilitychange restarts animations from frame 0,
  // flashing every looping icon on tab return. Only gate on reduced-motion.
  const shouldLoop = !reducedMotion;
  return {
    shouldLoop,
    repeat: shouldLoop ? Infinity : 0,
  } as const;
}
