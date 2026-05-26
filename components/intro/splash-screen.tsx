'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import Image from 'next/image';

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

function AnimatedTitle({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span className="inline-flex">
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
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const locale = useLocale();

  useEffect(() => {
    const seen = sessionStorage.getItem('forever_intro_seen');
    if (seen) {
      setChecked(true);
      setDone(true);
      return;
    }
    setShow(true);
    setChecked(true);

    const pts: Particle[] = Array.from({ length: 48 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1.5,
      duration: Math.random() * 2.5 + 1.5,
      delay: Math.random() * 3,
    }));
    setParticles(pts);

    const hts: FloatingHeart[] = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: 5 + i * 9.5,
      duration: 3.5 + Math.random() * 3,
      delay: i * 0.5,
      size: 12 + Math.random() * 16,
      drift: (Math.random() - 0.5) * 40,
    }));
    setHearts(hts);

    const t1 = setTimeout(() => setExiting(true), 3400);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => {
      setDone(true);
      sessionStorage.setItem('forever_intro_seen', '1');
    }, 600);
    return () => clearTimeout(t);
  }, [exiting]);

  if (!checked || done) return null;
  if (!show) return null;

  const subtitle =
    locale === 'ar' ? 'ملاذ خاص لكما وحدكما' : 'A private sanctuary, just for you two';

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

      {/* Gold sparkle particles */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-gold pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ scale: [0, 1, 0], opacity: [0, 0.7, 0], y: [0, -18] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Floating hearts */}
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute bottom-0 text-gold/15 pointer-events-none select-none"
          style={{ left: `${h.x}%`, fontSize: h.size }}
          animate={{
            y: [0, -120, -240],
            opacity: [0, 0.5, 0],
            x: [0, h.drift, h.drift * 1.5],
            rotate: [0, 10, -8],
          }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: 'easeOut' }}
        >
          ♥
        </motion.div>
      ))}

      {/* Center content */}
      <div className="flex flex-col items-center gap-6 select-none">
        {/* Logo + rings */}
        <div className="relative flex items-center justify-center">
          {/* Outer slow expanding ring */}
          <motion.div
            className="absolute rounded-full border border-gold/15"
            animate={{ width: [150, 210, 150], height: [150, 210, 150], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            style={{ width: 150, height: 150 }}
          />
          {/* Middle ring */}
          <motion.div
            className="absolute rounded-full border border-gold/25"
            animate={{ width: [130, 180, 130], height: [130, 180, 130], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
            style={{ width: 130, height: 130 }}
          />
          {/* Inner glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 110,
              height: 110,
              background: 'radial-gradient(circle, rgba(201,169,97,0.18) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
        <motion.h1 className="font-display-en text-5xl text-gold tracking-[0.18em]">
          <AnimatedTitle text="Forever" delay={0.65} />
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className={`text-muted text-sm tracking-wide text-center max-w-[220px] ${locale === 'ar' ? 'font-body-ar' : 'font-body-en'}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {subtitle}
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
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 0.9, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
