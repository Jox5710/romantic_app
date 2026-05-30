import { test, expect } from '@playwright/test';
import { localePath } from '../utils/i18n';
import { loginAs } from '../fixtures/auth';
import { failOnConsoleError } from '../utils/console';

test('Vibe — page loads, no console errors', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'vibe'));
  await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  log.assertNone('vibe load');
});
