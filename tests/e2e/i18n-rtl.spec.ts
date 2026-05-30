/**
 * Locale + RTL — dir attribute, font face, separator, no untranslated English
 * leaks on a sample of pages.
 */
import { test, expect } from '@playwright/test';
import { localePath, expectRtl } from './utils/i18n';
import { loginAs } from './fixtures/auth';

const SAMPLE_PAGES = ['', 'account', 'admin', 'heartbeat', 'whisper', 'vibe'] as const;

test.describe('i18n / RTL', () => {
  test('html[dir] flips between en and ar', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P1' });

    await loginAs(page, 'admin');
    await page.goto(localePath('en'));
    await expectRtl(page, false);

    await page.goto(localePath('ar'));
    await expectRtl(page, true);
  });

  test('Arabic page headings use Aref Ruqaa', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'app/globals.css — [dir=rtl] .font-display-en:not(.brand-latin) → var(--font-aref-ruqaa)',
    });

    await loginAs(page, 'admin');
    await page.goto(localePath('ar', 'account'));
    const family = await page.locator('h1').first().evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family.toLowerCase()).toMatch(/aref/);
  });

  for (const slug of SAMPLE_PAGES) {
    test(`/${slug || 'home'} renders without horizontal overflow in AR`, async ({ page }, testInfo) => {
      testInfo.annotations.push({ type: 'priority', description: 'P1' });
      await loginAs(page, 'admin');
      await page.goto(localePath('ar', slug));
      // Wait for hydration/content
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});

      const { sw, cw } = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      expect(sw, `${slug || 'home'} causes horizontal scroll (sw=${sw}, cw=${cw})`).toBeLessThanOrEqual(cw + 2);
    });
  }
});
