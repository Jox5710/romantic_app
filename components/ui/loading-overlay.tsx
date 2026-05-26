'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface LoadingOverlayProps {
  show: boolean;
  label?: string;
}

export function LoadingOverlay({ show, label }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-bg/70 backdrop-blur-sm rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent"
          />
          {label && (
            <p className="text-muted text-xs font-body-en">{label}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
