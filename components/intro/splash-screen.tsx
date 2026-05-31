'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRespectfulMotion } from '@/lib/hooks/use-respectful-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

interface FloatingHeart {
  id: number;
  x: number;
  duration: number;
  delay: number;
  size: number;
  drift: number;
}

const PARTICLE_COUNT = 28;
const HEART_COUNT = 6;

function AnimatedTitle({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    // dir=ltr so the Latin brand letters keep their order even on RTL (Arabic) pages
    <span className="inline-flex" dir="ltr">
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: delay + i * 0.07, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export function SplashScreen() {
  const [checked, setChecked] = useState(false);
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);
  const [seedReady, setSeedReady] = useState(false);
  const locale = useLocale();
  const t = useTranslations('splash');
  const { repeat } = useRespectfulMotion();

  // Play the intro on every full page load (hard refresh). The splash mounts in
  // Providers, which only remounts on a real page load — not on client-side
  // navigation — so this shows once per hard refresh, never between in-app routes.
  useEffect(() => {
    setShow(true);
    setChecked(true);
    setSeedReady(true);
    const t1 = setTimeout(() => setExiting(true), 2400);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => setDone(true), 500);
    return () => clearTimeout(t);
  }, [exiting]);

  // Stable random positions generated once per mount; memoized so the parent's
  // re-renders (visibility flips from the motion hook) don't reshuffle them.
  const particles = useMemo<Particle[]>(() => {
    if (!seedReady) return [];
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1.5,
      duration: Math.random() * 2.5 + 1.5,
      delay: Math.random() * 3,
    }));
  }, [seedReady]);

  const hearts = useMemo<FloatingHeart[]>(() => {
    if (!seedReady) return [];
    return Array.from({ length: HEART_COUNT }, (_, i) => ({
      id: i,
      x: 8 + i * 15,
      duration: 3.5 + Math.random() * 3,
      delay: i * 0.6,
      size: 12 + Math.random() * 16,
      drift: (Math.random() - 0.5) * 40,
    }));
  }, [seedReady]);

  if (!checked || done) return null;
  if (!show) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-bg overflow-hidden"
      animate={exiting ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Radial gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 40%, rgba(201,169,97,0.13) 0%, transparent 65%), radial-gradient(ellipse 40% 30% at 20% 80%, rgba(201,169,97,0.07) 0%, transparent 60%)',
        }}
      />

      {/* Gold sparkle particles — gated on reduced-motion + tab visibility */}
      <div className="absolute inset-0 pointer-events-none" style={{ willChange: 'transform' }}>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full bg-gold"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, willChange: 'transform, opacity' }}
            animate={{ scale: [0, 1, 0], opacity: [0, 0.7, 0], y: [0, -18] }}
            transition={{ duration: p.duration, delay: p.delay, repeat, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Floating hearts */}
      <div className="absolute inset-0 pointer-events-none" style={{ willChange: 'transform' }}>
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            className="absolute bottom-0 text-gold/15 select-none"
            style={{ left: `${h.x}%`, fontSize: h.size, willChange: 'transform, opacity' }}
            animate={{
              y: [0, -120, -240],
              opacity: [0, 0.5, 0],
              x: [0, h.drift, h.drift * 1.5],
              rotate: [0, 10, -8],
            }}
            transition={{ duration: h.duration, delay: h.delay, repeat, ease: 'easeOut' }}
          >
            ♥
          </motion.div>
        ))}
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-6 select-none">
        {/* Logo + rings */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute rounded-full border border-gold/15"
            animate={{ width: [150, 210, 150], height: [150, 210, 150], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat, ease: 'easeInOut', delay: 0.4 }}
            style={{ width: 150, height: 150, willChange: 'transform, opacity' }}
          />
          <motion.div
            className="absolute rounded-full border border-gold/25"
            animate={{ width: [130, 180, 130], height: [130, 180, 130], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat, ease: 'easeInOut', delay: 0.1 }}
            style={{ width: 130, height: 130, willChange: 'transform, opacity' }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 110,
              height: 110,
              background: 'radial-gradient(circle, rgba(201,169,97,0.18) 0%, transparent 70%)',
              willChange: 'transform, opacity',
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat, ease: 'easeInOut' }}
          />

          <motion.div
            initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 16, stiffness: 90, delay: 0.1 }}
          >
            <Image
              src="/forever-logo.png"
              alt="Forever"
              width={264}
              height={144}
              className="object-contain drop-shadow-[0_0_40px_rgba(201,169,97,0.7)] relative z-10"
              priority
            />
          </motion.div>
        </div>

        {/* Letter-by-letter title */}
        <motion.h1 className="font-display-en brand-latin text-5xl text-gold tracking-[0.18em]">
          <AnimatedTitle text="Forever" delay={0.65} />
        </motion.h1>

        {/* Subtitle (now sourced from i18n) */}
        <motion.p
          className={`text-muted text-sm tracking-wide text-center max-w-[240px] ${locale === 'ar' ? 'font-body-ar' : 'font-body-en'}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {t('subtitle')}
        </motion.p>

        {/* Expanding gold divider */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 72, opacity: 1 }}
          transition={{ duration: 1, delay: 1.9, ease: [0.2, 0.8, 0.2, 1] }}
        />

        {/* Heartbeat loading dots */}
        <motion.div
          className="flex gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full bg-gold/50"
              style={{ willChange: 'transform, opacity' }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 0.9, delay: i * 0.2, repeat, ease: 'easeInOut' }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
