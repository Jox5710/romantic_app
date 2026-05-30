'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useRespectfulMotion } from '@/lib/hooks/use-respectful-motion';

interface Heart {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

/**
 * App-wide ambient background: slowly drifting, heavily-blurred gold "glow" blobs
 * plus a few floating hearts. The palette comes from the per-theme CSS vars
 * --glow-1 / --glow-2 (defined in globals.css), so it re-tints automatically when
 * the theme changes (dusk = gold, day = rose, night = amber) with zero JS.
 *
 * All looping motion is gated by useRespectfulMotion: reduced-motion users and
 * hidden tabs get a static gradient (no CPU). Sits behind page content (-z-[1]),
 * above the body background, complementing the AmbientStars layer.
 */
export function RomanticBackground() {
  const { repeat, shouldLoop } = useRespectfulMotion();

  const hearts = useMemo<Heart[]>(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        x: 8 + i * 20,
        size: 12 + (i % 3) * 6,
        duration: 14 + i * 3,
        delay: i * 2.5,
        drift: (i % 2 === 0 ? 1 : -1) * (20 + i * 6),
      })),
    [],
  );

  return (
    <div className="fixed inset-0 -z-[1] overflow-hidden pointer-events-none" aria-hidden>
      {/* Glow blob 1 — top-left */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '60vw',
          height: '60vw',
          top: '-15vw',
          left: '-10vw',
          background: 'radial-gradient(circle, var(--glow-1) 0%, transparent 70%)',
          willChange: 'transform',
        }}
        animate={shouldLoop ? { x: [0, 40, -20, 0], y: [0, 30, 10, 0], scale: [1, 1.12, 1] } : undefined}
        transition={{ duration: 26, repeat, ease: 'easeInOut' }}
      />

      {/* Glow blob 2 — bottom-right */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '55vw',
          height: '55vw',
          bottom: '-18vw',
          right: '-12vw',
          background: 'radial-gradient(circle, var(--glow-2) 0%, transparent 70%)',
          willChange: 'transform',
        }}
        animate={shouldLoop ? { x: [0, -35, 15, 0], y: [0, -25, -10, 0], scale: [1, 1.15, 1] } : undefined}
        transition={{ duration: 32, repeat, ease: 'easeInOut', delay: 1.5 }}
      />

      {/* Glow blob 3 — center drift */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '40vw',
          height: '40vw',
          top: '30%',
          left: '35%',
          background: 'radial-gradient(circle, var(--glow-1) 0%, transparent 75%)',
          willChange: 'transform',
        }}
        animate={shouldLoop ? { x: [0, 30, -30, 0], y: [0, -20, 20, 0], opacity: [0.6, 1, 0.6] } : undefined}
        transition={{ duration: 38, repeat, ease: 'easeInOut' }}
      />

      {/* Floating hearts */}
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute bottom-[-5%] text-gold/10 select-none"
          style={{ left: `${h.x}%`, fontSize: h.size, willChange: 'transform, opacity' }}
          animate={
            shouldLoop
              ? { y: ['0%', '-1100%'], x: [0, h.drift, h.drift * 1.4], opacity: [0, 0.5, 0], rotate: [0, 12, -8] }
              : undefined
          }
          transition={{ duration: h.duration, delay: h.delay, repeat, ease: 'easeOut' }}
        >
          ♥
        </motion.div>
      ))}
    </div>
  );
}
