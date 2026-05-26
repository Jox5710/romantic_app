'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Props {
  label: string;
}

export function AnniversaryBanner({ label }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className="mx-4 rounded-2xl border border-gold/40 bg-surface px-5 py-3 flex items-center gap-3 shadow-gold"
    >
      <Sparkles size={16} className="text-gold shrink-0" />
      <p className="text-gold font-display-en text-lg">{label}</p>
    </motion.div>
  );
}
