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
  // Tutorial step keys are dynamic strings, not part of the statically-typed
  // message-key union — cast through the parameter type rather than `any`.
  const tx = t as (key: string) => string;
  const isRTL = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

  if (!currentStepData) return null;

  // Compute tooltip position. Width is responsive (never wider than the viewport
  // minus a 12px gutter each side) and the left edge is clamped so the card can
  // never overflow off-screen — critical on small/RTL phones.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const margin = 12;
  const width = Math.min(320, vw - margin * 2);

  let tooltipStyle: CSSProperties = { position: 'fixed', zIndex: 160, width };
  if (!highlightRect) {
    tooltipStyle = { ...tooltipStyle, top: '50%', left: (vw - width) / 2, transform: 'translateY(-50%)' };
  } else {
    const below = highlightRect.bottom + 240 < vh;
    tooltipStyle.top = below ? highlightRect.bottom + 16 : undefined;
    tooltipStyle.bottom = below ? undefined : vh - highlightRect.top + 16;
    const centerX = highlightRect.left + highlightRect.width / 2;
    tooltipStyle.left = Math.max(margin, Math.min(centerX - width / 2, vw - width - margin));
  }

  const isLast = currentStep === totalSteps - 1;

  return (
    <motion.div
      style={tooltipStyle}
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="rounded-2xl border border-gold/30 bg-surface shadow-popLg p-4 sm:p-5 flex flex-col gap-3 pointer-events-auto"
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
          {tx(currentStepData.titleKey)}
        </h3>
        <p className="text-muted text-xs leading-relaxed">
          {tx(currentStepData.descKey)}
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
          {/* Backdrop. With a resolved target we draw the hard spotlight scrim
              (dark, with a hole). WITHOUT a target we draw only a soft, blurred
              dim so the page never goes fully black behind the tooltip. */}
          {hl ? (
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'auto' }}>
              <defs>
                <mask id="tutorial-spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={hl.left - 8}
                    y={hl.top - 8}
                    width={hl.width + 16}
                    height={hl.height + 16}
                    rx="12"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.78)"
                mask="url(#tutorial-spotlight-mask)"
              />
            </svg>
          ) : (
            <div className="absolute inset-0 bg-bg/40 backdrop-blur-sm" style={{ pointerEvents: 'auto' }} />
          )}

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
