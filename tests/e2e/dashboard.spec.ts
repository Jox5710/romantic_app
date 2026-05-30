/**
 * Dashboard — hero with bilingual names, module grid, navigation feel.
 */
import { test, expect } from '@playwright/test';
import { localePath } from './utils/i18n';
import { failOnConsoleError } from './utils/console';
import { loginAs } from './fixtures/auth';

test.beforeEach(async ({ page }) => {
  await loginAs(page, 'admin');
});

test.describe('Dashboard — hero + grid', () => {
  test('hero shows both couple names with the & separator (EN)', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P1' });
    await page.goto(localePath('en'));
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible({ timeout: 10_000 });
    // Latin names are not deterministic (user may have edited), but the
    // separator must be `&` and at least one name span is visible.
    await expect(page.getByText('&', { exact: true })).toBeVisible();
    await expect(hero.locator('span').nth(0)).not.toBeEmpty();
    await expect(hero.locator('span').nth(2)).not.toBeEmpty();
  });

  test('hero uses و in Arabic locale', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P1' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'components/hero/hero.tsx — {isArabic ? "و" : "&"} expression',
    });
    await page.goto(localePath('ar'));
    await expect(page.getByText('و', { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test('module grid renders all 20 cards and they link out correctly', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P1' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'components/layout/module-grid.tsx — modules array (20 entries)',
    });
    await page.goto(localePath('en'));
    // Wait for the heartbeat card (a stable, tutorial-tagged element) to mount —
    // signals the module grid has rendered.
    await expect(page.locator('[data-tutorial-id="home-heartbeat-card"]')).toBeVisible({ timeout: 15_000 });

    // Each module card is an <a> under /en/...
    const links = page.locator('a[href^="/en/"]').filter({ hasNot: page.locator('img') });
    expect(await links.count()).toBeGreaterThanOrEqual(20);

    // Click heartbeat → should navigate without a full SealedLoading flash.
    const log = failOnConsoleError(page);
    await page.locator('[data-tutorial-id="home-heartbeat-card"]').click();
    await page.waitForURL((url) => url.pathname.endsWith('/heartbeat'), { timeout: 8_000 });
    log.assertNone('home → heartbeat');
  });
});
