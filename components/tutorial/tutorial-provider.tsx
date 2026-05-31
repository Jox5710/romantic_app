'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { usePathname } from '@/lib/i18n/navigation';

export interface TutorialStep {
  id: string;
  titleKey: string;
  descKey: string;
}

interface TutorialContextValue {
  activeTutorial: string | null;
  currentStep: number;
  totalSteps: number;
  highlightRect: DOMRect | null;
  currentStepData: TutorialStep | null;
  isCompleted: (key: string) => boolean;
  startTutorial: (key: string, steps: TutorialStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  canTriggerPageTutorial: boolean;
  triggerPageTutorial: () => void;
  registerPageTutorial: (key: string, steps: TutorialStep[]) => void;
}

const TutorialContext = createContext<TutorialContextValue>({
  activeTutorial: null,
  currentStep: 0,
  totalSteps: 0,
  highlightRect: null,
  currentStepData: null,
  isCompleted: () => false,
  startTutorial: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTutorial: () => {},
  canTriggerPageTutorial: false,
  triggerPageTutorial: () => {},
  registerPageTutorial: () => {},
});

export function useTutorialContext() {
  return useContext(TutorialContext);
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  // Whichever page calls useTutorial() last "owns" the trigger button. This
  // makes (?) work on nested routes like /admin/couples without us having to
  // map pathname segments back to tutorial keys.
  const [currentPageKey, setCurrentPageKey] = useState<string | null>(null);
  const registeredRef = useRef<Record<string, TutorialStep[]>>({});
  const pathname = usePathname();

  // Load completed tutorials from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('forever_tutorials_completed');
      if (stored) setCompletedTutorials(JSON.parse(stored));
    } catch {}
  }, []);

  // Compute highlight rect whenever step or tutorial changes
  const computeRect = useCallback(() => {
    if (!activeTutorial) { setHighlightRect(null); return; }
    const steps = registeredRef.current[activeTutorial];
    if (!steps) return;
    const step = steps[currentStep];
    if (!step) return;
    const el = document.querySelector(`[data-tutorial-id="${step.id}"]`);
    setHighlightRect(el ? el.getBoundingClientRect() : null);
  }, [activeTutorial, currentStep]);

  // On step/tutorial change, POLL for the target element (it may not be mounted
  // the instant the tutorial starts). Only set a rect once found. If it never
  // appears, highlightRect stays null and the overlay renders a soft (not black)
  // backdrop instead of dimming the whole page.
  useEffect(() => {
    if (!activeTutorial) { setHighlightRect(null); return; }
    const steps = registeredRef.current[activeTutorial];
    const step = steps?.[currentStep];
    if (!step) return;

    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const poll = () => {
      const el = document.querySelector(`[data-tutorial-id="${step.id}"]`);
      if (el) {
        setHighlightRect(el.getBoundingClientRect());
        return;
      }
      setHighlightRect(null);
      if (tries++ < 15) timer = setTimeout(poll, 120);
    };
    poll();
    return () => clearTimeout(timer);
  }, [activeTutorial, currentStep]);

  // Re-measure on resize / scroll
  useEffect(() => {
    if (!activeTutorial) return;
    window.addEventListener('resize', computeRect);
    window.addEventListener('scroll', computeRect, { passive: true });
    return () => {
      window.removeEventListener('resize', computeRect);
      window.removeEventListener('scroll', computeRect);
    };
  }, [activeTutorial, computeRect]);

  // Clear tutorial + page-key on navigation. The new page will set its own
  // key when its useTutorial() fires; until then there's no trigger target.
  useEffect(() => {
    setActiveTutorial(null);
    setCurrentStep(0);
    setHighlightRect(null);
    setCurrentPageKey(null);
  }, [pathname]);

  function persistCompletion(key: string, prev: string[]) {
    const next = Array.from(new Set([...prev, key]));
    setCompletedTutorials(next);
    try {
      localStorage.setItem('forever_tutorials_completed', JSON.stringify(next));
      localStorage.setItem(`forever_tutorial_${key}`, 'seen');
    } catch {}
  }

  function completeTutorial() {
    if (!activeTutorial) return;
    persistCompletion(activeTutorial, completedTutorials);
    setActiveTutorial(null);
    setCurrentStep(0);
    setHighlightRect(null);
  }

  function startTutorial(key: string, steps: TutorialStep[]) {
    registeredRef.current[key] = steps;
    setActiveTutorial(key);
    setCurrentStep(0);
  }

  function nextStep() {
    const steps = registeredRef.current[activeTutorial!] ?? [];
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeTutorial();
    }
  }

  function prevStep() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  function registerPageTutorial(key: string, steps: TutorialStep[]) {
    registeredRef.current[key] = steps;
    setCurrentPageKey(key);
  }

  const canTriggerPageTutorial = !!currentPageKey && currentPageKey in registeredRef.current;

  function triggerPageTutorial() {
    if (!currentPageKey) return;
    const steps = registeredRef.current[currentPageKey];
    if (steps) startTutorial(currentPageKey, steps);
  }

  const steps = activeTutorial ? (registeredRef.current[activeTutorial] ?? []) : [];
  const currentStepData = steps[currentStep] ?? null;

  return (
    <TutorialContext.Provider
      value={{
        activeTutorial,
        currentStep,
        totalSteps: steps.length,
        highlightRect,
        currentStepData,
        isCompleted: (key) => completedTutorials.includes(key),
        startTutorial,
        nextStep,
        prevStep,
        skipTutorial: completeTutorial,
        canTriggerPageTutorial,
        triggerPageTutorial,
        registerPageTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}
