'use client';

import { type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useTutorialContext } from './tutorial-provider';
import { scaleIn } from '@/lib/animations';

function TutorialTooltip() {
  const { currentStep, totalSteps, currentStepData, nextStep, prevStep, skipTutorial, highlightRect } =
    useTutorialContext();
  const t = useTranslations('tutorial');
  const isRTL = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  if (!currentStepData) return null;

  // Compute tooltip position
  let tooltipStyle: CSSProperties = { position: 'fixed', zIndex: 160, width: 320 };
  if (!highlightRect) {
    tooltipStyle = { ...tooltipStyle, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  } else {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
    const below = highlightRect.bottom + 240 < vh;
    tooltipStyle.top = below ? highlightRect.bottom + 16 : undefined;
    tooltipStyle.bottom = below ? undefined : vh - highlightRect.top + 16;
    const centerX = highlightRect.left + highlightRect.width / 2;
    tooltipStyle.left = Math.max(16, Math.min(centerX - 160, vw - 336));
  }

  const isLast = currentStep === totalSteps - 1;

  return (
    <motion.div
      style={tooltipStyle}
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="rounded-2xl border border-gold/30 bg-surface shadow-popLg p-5 flex flex-col gap-3 pointer-events-auto"
    >
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentStep ? 'bg-gold' : 'bg-gold/25'}`}
            />
          ))}
        </div>
        <span className="text-muted text-xs font-body-en">
          {currentStep + 1} / {totalSteps}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-ivory text-sm font-display-en font-semibold leading-snug">
          {t(currentStepData.titleKey as any)}
        </h3>
        <p className="text-muted text-xs leading-relaxed">
          {t(currentStepData.descKey as any)}
        </p>
      </div>

      {/* Buttons */}
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {currentStep > 0 && (
          <button
            onClick={prevStep}
            className="text-xs text-muted hover:text-ivoryDim transition-colors px-2 py-1"
          >
            {t('common.prev')}
          </button>
        )}
        <button
          onClick={skipTutorial}
          className="text-xs text-muted/60 hover:text-muted transition-colors px-2 py-1 me-auto"
        >
          {t('common.skip')}
        </button>
        <button
          onClick={nextStep}
          className="text-xs bg-gold/90 hover:bg-gold text-bg font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          {isLast ? t('common.finish') : t('common.next')}
        </button>
      </div>
    </motion.div>
  );
}

export function TutorialOverlay() {
  const { activeTutorial, highlightRect } = useTutorialContext();
  const hl = highlightRect;

  return (
    <AnimatePresence>
      {activeTutorial && (
        <motion.div
          className="fixed inset-0 z-[150] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* SVG spotlight mask */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'auto' }}
          >
            <defs>
              <mask id="tutorial-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                {hl && (
                  <rect
                    x={hl.left - 8}
                    y={hl.top - 8}
                    width={hl.width + 16}
                    height={hl.height + 16}
                    rx="12"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.78)"
              mask="url(#tutorial-spotlight-mask)"
            />
          </svg>

          {/* Gold border ring around highlighted element */}
          {hl && (
            <motion.div
              className="absolute rounded-xl border-2 border-gold pointer-events-none"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{
                left: hl.left - 8,
                top: hl.top - 8,
                width: hl.width + 16,
                height: hl.height + 16,
              }}
            />
          )}

          {/* Tooltip */}
          <TutorialTooltip />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
