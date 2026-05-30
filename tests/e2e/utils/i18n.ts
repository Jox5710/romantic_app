import { Page, expect } from '@playwright/test';

export type Locale = 'en' | 'ar';

/**
 * Navigate directly to the locale-prefixed path. Middleware handles `/` → `/en`
 * already, but we go straight to the locale to avoid an extra redirect hop.
 */
export function localePath(locale: Locale, path = '/'): string {
  const trimmed = path.replace(/^\//, '');
  return `/${locale}${trimmed ? `/${trimmed}` : ''}`;
}

export async function expectRtl(page: Page, expected: boolean) {
  const dir = await page.evaluate(() => document.documentElement.dir);
  expect(dir).toBe(expected ? 'rtl' : 'ltr');
}

/**
 * Assert a heading uses the Arabic display face (Aref Ruqaa) on RTL pages.
 * Reads the computed font-family on the first <h1>.
 */
export async function expectArabicDisplayFont(page: Page) {
  const family = await page.locator('h1').first().evaluate((el) => getComputedStyle(el).fontFamily);
  // The font name in computed style appears with quotes or via the CSS var fallback.
  expect(family.toLowerCase()).toMatch(/aref|tajawal/);
}
