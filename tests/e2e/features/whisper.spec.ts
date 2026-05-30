import { test, expect } from '@playwright/test';
import { localePath } from '../utils/i18n';
import { loginAs } from '../fixtures/auth';
import { failOnConsoleError } from '../utils/console';

test.describe('Whisper', () => {
  test('page loads + soften degrades gracefully without an Edge Function', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P1' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'app/[locale]/whisper/page.tsx — soften() try/catch + toast(softenUnavailable)',
    });

    await loginAs(page, 'admin');
    const log = failOnConsoleError(page);
    await page.goto(localePath('en', 'whisper'));
    await expect(page.locator('main h1')).toBeVisible({ timeout: 10_000 });

    // Look for the "What happened?" textarea/input
    const what = page.getByPlaceholder(/what happened/i).or(page.getByLabel(/what happened/i)).first();
    if (await what.count()) {
      await what.fill('You forgot the milk again.');

      // Try the soften CTA — should NOT crash. The Edge Function is intentionally
      // not deployed in dev; the page should show a friendly toast instead of erroring.
      const soften = page.getByRole('button', { name: /soften/i });
      if (await soften.count()) {
        await soften.click();
        await page.waitForTimeout(2_000); // give the request time to 503 + the toast time to render
      }
    }

    // No uncaught console errors (a 503 from /functions/v1/soften prints a network log
    // but should NOT bubble as console.error after our graceful-degrade fix).
    log.assertNone('whisper — soften graceful');
  });
});
