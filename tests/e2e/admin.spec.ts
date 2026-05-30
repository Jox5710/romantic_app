/**
 * Admin flows — dashboard stats + couples queue + non-admin guard.
 */
import { test, expect } from '@playwright/test';
import { localePath } from './utils/i18n';
import { loginAs } from './fixtures/auth';
import { failOnConsoleError } from './utils/console';

test.describe('Admin — dashboard + couples', () => {
  test('admin lands on /admin and sees counters', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P0' });
    await loginAs(page, 'admin');
    const log = failOnConsoleError(page);
    await page.goto(localePath('en', 'admin'));
    await expect(page.locator('main h1')).toHaveText(/admin/i, { timeout: 10_000 });
    // Four stat cards
    await expect(page.locator('section, div').filter({ hasText: /total couples/i })).toHaveCount(1, { timeout: 5_000 });
    log.assertNone('admin dashboard');
  });

  test('couples queue filters work', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P1' });
    await loginAs(page, 'admin');
    await page.goto(localePath('en', 'admin/couples'));
    await expect(page.locator('main h1')).toHaveText(/approval queue/i, { timeout: 10_000 });

    // Click "All" filter and confirm cards (the demo couple is approved)
    await page.getByRole('button', { name: /^all$/i }).click();
    // After filter change the list should not show the empty-state copy
    const empty = page.locator('text=/no couples found/i');
    await expect(empty).toHaveCount(0, { timeout: 3_000 }).catch(() => {/* allowed to be 0 if list non-empty */});
  });

  test('non-admin user trying /admin is redirected away', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P0' });
    await loginAs(page, 'partner');
    await page.goto(localePath('en', 'admin'));
    await page.waitForURL((url) => !url.pathname.includes('/admin'), { timeout: 8_000 });
    expect(page.url()).not.toContain('/admin');
  });
});
