'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dusk' | 'day' | 'night';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** True for a short window (~420ms) after the theme changes — used by ThemeSwitcher to show a transition overlay. */
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dusk',
  setTheme: () => undefined,
  isTransitioning: false,
});

function getSmartDefault(): Theme {
  if (typeof window === 'undefined') return 'dusk';
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored && ['dusk', 'day', 'night'].includes(stored)) return stored;
  const hour = new Date().getHours();
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'day';
  if (hour >= 22 || hour < 6) return 'night';
  return 'dusk';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dusk');
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setThemeState(getSmartDefault());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const setTheme = useCallback((t: Theme) => {
    if (t === theme) return;
    setIsTransitioning(true);
    setThemeState(t);
    // Clear the transition flag after the overlay has faded out (~0.38s fade).
    window.setTimeout(() => setIsTransitioning(false), 440);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
