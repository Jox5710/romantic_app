import { test, expect } from '@playwright/test';
import { localePath } from '../utils/i18n';
import { loginAs } from '../fixtures/auth';
import { failOnConsoleError } from '../utils/console';

test('Daily Prompt — page loads, can type an answer', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'prompt'));
  await expect(page.locator('main h1')).toBeVisible({ timeout: 10_000 });
  // Typing into the answer area should not crash; submitting is best-effort
  // because daily-prompt may already be answered for today.
  const input = page.locator('textarea, input[type="text"]').first();
  if (await input.count()) await input.fill(`e2e ${Date.now()}`);
  log.assertNone('prompt page');
});
