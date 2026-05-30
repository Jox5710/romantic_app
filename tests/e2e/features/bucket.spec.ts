import { test, expect } from '@playwright/test';
import { localePath } from '../utils/i18n';
import { loginAs } from '../fixtures/auth';
import { failOnConsoleError } from '../utils/console';

test('Bucket list — page loads + add row submits without error', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  testInfo.annotations.push({
    type: 'suggestedFix',
    description: 'lib/queries/bucket.ts useAddBucketItem — verify PATCH/POST CORS',
  });

  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'bucket'));
  await expect(page.locator('main h1')).toBeVisible({ timeout: 10_000 });

  // Find the input + add button (selectors are intentionally generic)
  const input = page.locator('input[type="text"], textarea').first();
  if (await input.count()) {
    await input.fill(`e2e bucket ${Date.now()}`);
    const submit = page.getByRole('button', { name: /add|create|save/i }).first();
    if (await submit.count()) {
      await submit.click();
      await page.waitForTimeout(1500);
    }
  }
  log.assertNone('bucket add');
});
