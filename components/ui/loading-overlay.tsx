'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRespectfulMotion } from '@/lib/hooks/use-respectful-motion';

interface LoadingOverlayProps {
  show: boolean;
  label?: string;
  /** When true, fills the viewport (`fixed inset-0`) instead of the nearest positioned ancestor. */
  fullscreen?: boolean;
}

export function LoadingOverlay({ show, label, fullscreen = false }: LoadingOverlayProps) {
  const { repeat } = useRespectfulMotion();
  const positionCls = fullscreen
    ? 'fixed inset-0 z-[60]'
    : 'absolute inset-0 z-30 rounded-2xl';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`${positionCls} flex flex-col items-center justify-center gap-3 bg-bg/70 backdrop-blur-sm`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            style={{ willChange: 'transform' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat, ease: 'linear' }}
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
