/**
 * Mobile responsiveness — no horizontal scroll on a representative sample of
 * routes across the 320/375/Pixel-7 projects. Header wordmark hides on <400px.
 *
 * NOTE: this spec is run by Playwright across ALL projects (desktop + mobile);
 * the assertions below are written so they pass on desktop too. The viewport-
 * specific assertions are gated by viewport width.
 */
import { test, expect } from '@playwright/test';
import { localePath } from './utils/i18n';
import { loginAs } from './fixtures/auth';

const ROUTES = ['', 'account', 'heartbeat', 'whisper', 'vibe', 'bucket', 'timeline', 'admin'] as const;

test.describe('Mobile responsive', () => {
  for (const slug of ROUTES) {
    test(`no horizontal scroll on /${slug || 'home'}`, async ({ page }, testInfo) => {
      testInfo.annotations.push({ type: 'priority', description: 'P1' });
      testInfo.annotations.push({
        type: 'suggestedFix',
        description: 'Check the page\'s max-w + px-* container, plus header items in components/layout/app-shell.tsx',
      });

      await loginAs(page, 'admin');
      await page.goto(localePath('en', slug));
      await page.waitForLoadState('domcontentloaded');

      const dims = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
        vw: window.innerWidth,
      }));
      expect(dims.sw, `${slug}: scrollWidth=${dims.sw}, clientWidth=${dims.cw}, viewport=${dims.vw}`)
        .toBeLessThanOrEqual(dims.cw + 2);
    });
  }

  test('header wordmark hides below 400px and shows above', async ({ page, viewport }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'components/layout/app-shell.tsx — `hidden xs:inline` on the "Forever" wordmark',
    });
    await loginAs(page, 'admin');
    await page.goto(localePath('en'));

    const wordmark = page.locator('span.brand-latin', { hasText: 'Forever' });
    if (viewport && viewport.width < 400) {
      // Either not in DOM at this breakpoint OR display:none
      const cnt = await wordmark.count();
      if (cnt > 0) {
        await expect(wordmark).toBeHidden();
      }
    } else {
      await expect(wordmark).toBeVisible({ timeout: 5_000 });
    }
  });
});
