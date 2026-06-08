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
  // minus a margin each side) and all edges are fully clamped — critical on
  // small/RTL phones. We also respect safe-area insets on notched devices.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

  // Safe-area insets: read a hidden sentinel element with padding set to
  // env(safe-area-inset-top/bottom) if available, else use conservative
  // fallback constants so the tooltip never slips under notches / home bars.
  let safeTop = 0;
  let safeBottom = 0;
  if (typeof document !== 'undefined') {
    // Inline style trick: a zero-size element whose padding resolves the env()
    // value. This avoids needing CSS variables in globals.css.
    try {
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:fixed;pointer-events:none;opacity:0;' +
        'padding-top:env(safe-area-inset-top,0px);' +
        'padding-bottom:env(safe-area-inset-bottom,0px);' +
        'width:0;height:0';
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      safeTop = parseFloat(cs.paddingTop) || 0;
      safeBottom = parseFloat(cs.paddingBottom) || 0;
      document.body.removeChild(probe);
    } catch { /* ignore — safe areas fall back to 0 */ }
  }

  // Effective viewport bounds after safe areas.
  const margin = 14;
  const minY = margin + safeTop;
  const maxY = vh - margin - safeBottom;
  const width = Math.min(320, vw - margin * 2);

  // Estimated tooltip height for pre-placement checks (actual render may vary).
  const TOOLTIP_H = 200;

  let tooltipStyle: CSSProperties = { position: 'fixed', zIndex: 160, width };

  if (!highlightRect) {
    // No target: centre in the usable viewport.
    const top = Math.max(minY, (vh - TOOLTIP_H) / 2);
    tooltipStyle = { ...tooltipStyle, top, left: (vw - width) / 2 };
  } else {
    // Horizontal: centre on the target, clamped within safe margins.
    const centerX = highlightRect.left + highlightRect.width / 2;
    const rawLeft = isRTL
      ? highlightRect.right - width                    // anchor to inline-end in RTL
      : centerX - width / 2;
    const clampedLeft = Math.max(margin, Math.min(rawLeft, vw - width - margin));

    // Vertical: prefer below the target.
    const spaceBelow = maxY - (highlightRect.bottom + 16);
    const spaceAbove = (highlightRect.top - 16) - minY;
    const fitsBelow = spaceBelow >= TOOLTIP_H;
    const fitsAbove = spaceAbove >= TOOLTIP_H;

    let top: number;
    if (fitsBelow) {
      // Preferred: place below.
      top = highlightRect.bottom + 16;
    } else if (fitsAbove) {
      // Fallback: place above (anchor from bottom of tooltip).
      top = highlightRect.top - 16 - TOOLTIP_H;
    } else {
      // Neither fits: centre vertically in the usable viewport.
      top = Math.max(minY, (vh - TOOLTIP_H) / 2);
    }

    // Final clamp so it never leaves the visible screen.
    top = Math.max(minY, Math.min(top, maxY - TOOLTIP_H));

    tooltipStyle = { ...tooltipStyle, top, left: clampedLeft };
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
