'use client';

import { motion } from 'framer-motion';

interface Props {
  size?: number;
  className?: string;
}

export function GoldSeal({ size = 64, className = '' }: Props) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -30, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={['flex items-center justify-center rounded-full bg-gold text-bg', className].join(' ')}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="currentColor">
        <path d="M12 2l2.09 6.26L20 9.27l-4.5 4.38L16.18 20 12 17.27 7.82 20l1.68-6.35L5 9.27l5.91-.01z" />
      </svg>
    </motion.div>
  );
}
