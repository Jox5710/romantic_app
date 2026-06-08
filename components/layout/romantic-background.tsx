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
 * App-wide ambient background: a slow-rotating galaxy nebula built from
 * radial-gradient overlays (using --glow-1 / --glow-2 / --gold CSS vars),
 * three layered glow blobs, and a few gently floating hearts.
 *
 * The palette comes entirely from per-theme CSS vars defined in globals.css so
 * it re-tints automatically across dusk / day / night with zero JS.
 *
 * All looping motion is gated by useRespectfulMotion: reduced-motion users get
 * a completely static render (no CPU). Sits at -z-[1], above the AmbientStars
 * layer (-z-[2]), behind all page content.
 */
export function RomanticBackground() {
  const { repeat, shouldLoop } = useRespectfulMotion();

  // Reduced to 4 hearts (from 5) — still lovely, cheaper on mobile
  const hearts = useMemo<Heart[]>(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        id: i,
        x: 10 + i * 23,
        size: 11 + (i % 3) * 7,
        duration: 16 + i * 4,
        delay: i * 3,
        drift: (i % 2 === 0 ? 1 : -1) * (18 + i * 7),
      })),
    [],
  );

  return (
    <div
      className="fixed inset-0 -z-[1] overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* ── Galaxy nebula core ──────────────────────────────────────────
          A large conic+radial composite rotates very slowly around the
          center of the viewport, giving the impression of a distant
          galaxy arm turning overhead. Built entirely from CSS vars so it
          re-tints per theme.
      ─────────────────────────────────────────────────────────────── */}
      <motion.div
        className="absolute motion-reduce:hidden"
        style={{
          width: '140vw',
          height: '140vw',
          top: '50%',
          left: '50%',
          marginTop: '-70vw',
          marginLeft: '-70vw',
          background: [
            'radial-gradient(ellipse 55% 35% at 45% 50%, var(--glow-1) 0%, transparent 70%)',
            'radial-gradient(ellipse 30% 55% at 60% 45%, var(--glow-2) 0%, transparent 65%)',
            'radial-gradient(ellipse 20% 20% at 52% 48%, rgba(201,169,97,0.07) 0%, transparent 60%)',
          ].join(', '),
          willChange: 'transform',
        }}
        animate={shouldLoop ? { rotate: [0, 360] } : undefined}
        transition={{ duration: 180, repeat, ease: 'linear' }}
      />

      {/* ── Nebula drift cloud — offset to upper third ─────────────── */}
      <motion.div
        className="absolute rounded-full motion-reduce:hidden"
        style={{
          width: '75vw',
          height: '50vw',
          top: '-5vw',
          left: '15vw',
          background:
            'radial-gradient(ellipse, var(--glow-1) 0%, var(--glow-2) 40%, transparent 72%)',
          filter: 'blur(2px)',
          willChange: 'transform, opacity',
        }}
        animate={
          shouldLoop
            ? {
                x: [0, 25, -15, 0],
                y: [0, 15, -10, 0],
                opacity: [0.5, 0.85, 0.6, 0.5],
                scale: [1, 1.08, 0.96, 1],
              }
            : undefined
        }
        transition={{ duration: 42, repeat, ease: 'easeInOut' }}
      />

      {/* ── Glow blob 1 — top-left anchor ─────────────────────────── */}
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

      {/* ── Glow blob 2 — bottom-right anchor ─────────────────────── */}
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

      {/* ── Glow blob 3 — center drift ────────────────────────────── */}
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

      {/* ── Floating hearts ───────────────────────────────────────── */}
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute bottom-[-5%] text-gold/10 select-none motion-reduce:hidden"
          style={{ left: `${h.x}%`, fontSize: h.size, willChange: 'transform, opacity' }}
          animate={
            shouldLoop
              ? {
                  y: ['0%', '-1100%'],
                  x: [0, h.drift, h.drift * 1.4],
                  opacity: [0, 0.45, 0],
                  rotate: [0, 10, -6],
                }
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
