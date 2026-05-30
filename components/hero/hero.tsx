'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Countdown } from './countdown';
import { motion } from 'framer-motion';

interface Props {
  nameA: string | null;
  nameB: string | null;
  nameAAr?: string | null;
  nameBAr?: string | null;
  weddingDate: string | null;
}

export function Hero({ nameA, nameB, nameAAr, nameBAr, weddingDate }: Props) {
  const t = useTranslations('hero');
  const isArabic = useLocale() === 'ar';

  const displayA = (isArabic ? nameAAr ?? nameA : nameA) ?? '…';
  const displayB = (isArabic ? nameBAr ?? nameB : nameB) ?? '…';
  const nameFont = isArabic ? 'font-display-ar' : 'font-display-en';

  return (
    <section className="flex flex-col items-center text-center gap-8 py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3 sm:gap-4 justify-center flex-wrap">
          <span className={`${nameFont} text-4xl sm:text-5xl md:text-7xl text-ivory`}>
            {displayA}
          </span>
          <span className={`${nameFont} text-3xl sm:text-4xl md:text-6xl text-gold`}>
            {isArabic ? 'و' : '&'}
          </span>
          <span className={`${nameFont} text-4xl sm:text-5xl md:text-7xl text-ivory`}>
            {displayB}
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
