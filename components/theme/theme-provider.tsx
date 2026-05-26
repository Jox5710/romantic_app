'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dusk' | 'day' | 'night';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dusk',
  setTheme: () => undefined,
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

  useEffect(() => {
    setThemeState(getSmartDefault());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  function setTheme(t: Theme) {
    setThemeState(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
