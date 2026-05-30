import { test, expect } from '@playwright/test';
import { localePath } from '../utils/i18n';
import { loginAs } from '../fixtures/auth';
import { failOnConsoleError } from '../utils/console';

test('Time Capsule — page loads without crash', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'capsule'));
  await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  log.assertNone('capsule');
});
