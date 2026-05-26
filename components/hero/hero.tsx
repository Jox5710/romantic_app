'use client';

import { useTranslations } from 'next-intl';
import { Countdown } from './countdown';
import { motion } from 'framer-motion';

interface Props {
  nameA: string | null;
  nameB: string | null;
  weddingDate: string | null;
}

export function Hero({ nameA, nameB, weddingDate }: Props) {
  const t = useTranslations('hero');

  return (
    <section className="flex flex-col items-center text-center gap-8 py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        className="space-y-3"
      >
        <div className="flex items-center gap-4 justify-center">
          <span className="font-display-en text-5xl md:text-7xl text-ivory">
            {nameA ?? '…'}
          </span>
          <span className="font-display-en text-4xl md:text-6xl text-gold">&amp;</span>
          <span className="font-display-en text-5xl md:text-7xl text-ivory">
            {nameB ?? '…'}
          </span>
        </div>
        <p className="text-ivoryDim text-sm tracking-widest uppercase">
          {t('tagline')}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <Countdown weddingDate={weddingDate} />
      </motion.div>
    </section>
  );
}
