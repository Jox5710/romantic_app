import { Page } from '@playwright/test';

export type Theme = 'dusk' | 'day' | 'night';

/**
 * Set the theme directly via the same localStorage key the ThemeProvider reads.
 * Faster + more deterministic than clicking the header switcher.
 */
export async function setTheme(page: Page, theme: Theme) {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem('forever_theme', t);
      document.documentElement.setAttribute('data-theme', t);
    } catch {}
  }, theme);
}

/** Reads --glow-1 from the current theme so we can assert it changes. */
export async function readGlowVar(page: Page, which: 1 | 2 = 1): Promise<string> {
  return await page.evaluate((n) => {
    return getComputedStyle(document.documentElement).getPropertyValue(`--glow-${n}`).trim();
  }, which);
}
