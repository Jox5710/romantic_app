'use client';

import { useEffect } from 'react';
import { useTutorialContext, type TutorialStep } from './tutorial-provider';

export function useTutorial(key: string, steps: TutorialStep[], enabled: boolean = true) {
  const { registerPageTutorial, startTutorial, isCompleted } = useTutorialContext();

  useEffect(() => {
    registerPageTutorial(key, steps);

    // Only auto-start once the page has signalled it's ready (content + tutorial
    // targets are mounted). Starting earlier highlights elements that don't exist yet.
    if (!enabled) return;

    try {
      const alreadySeen = localStorage.getItem(`forever_tutorial_${key}`);
      if (!alreadySeen && !isCompleted(key)) {
        // Wait until the first step's target is actually in the DOM before starting,
        // so the spotlight never opens over a missing element.
        const firstId = steps[0]?.id;
        let tries = 0;
        let t: ReturnType<typeof setTimeout>;
        const tryStart = () => {
          const ready = !firstId || document.querySelector(`[data-tutorial-id="${firstId}"]`);
          if (ready) startTutorial(key, steps);
          else if (tries++ < 15) t = setTimeout(tryStart, 150);
        };
        t = setTimeout(tryStart, 400);
        return () => clearTimeout(t);
      }
    } catch {}
  // Re-run when the page key or the enabled flag changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
}
