'use client';

import { useEffect } from 'react';
import { useTutorialContext, type TutorialStep } from './tutorial-provider';

export function useTutorial(key: string, steps: TutorialStep[]) {
  const { registerPageTutorial, startTutorial, isCompleted } = useTutorialContext();

  useEffect(() => {
    registerPageTutorial(key, steps);

    try {
      const alreadySeen = localStorage.getItem(`forever_tutorial_${key}`);
      if (!alreadySeen && !isCompleted(key)) {
        const t = setTimeout(() => startTutorial(key, steps), 800);
        return () => clearTimeout(t);
      }
    } catch {}
  // Only re-run when the key (page) changes, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
