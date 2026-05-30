/**
 * Visual regression — baselines on chromium-desktop only. Run with
 * `--update-snapshots` first time (and after any intentional UI change), then
 * the suite will fail on unintended visual diffs.
 *
 * We disable animations + fix the timezone to keep frames deterministic.
 */
import { test, expect } from '@playwright/test';
import { localePath } from './utils/i18n';
import { loginAs } from './fixtures/auth';
import { setTheme } from './utils/theme';

// Only run visual checks on chromium-desktop; on other projects skip entirely.
test.skip(({ browserName }, testInfo) => testInfo.project.name !== 'chromium-desktop',
  'Visual baselines are chromium-desktop only to avoid font-rendering flakiness');

async function freezePage(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }`,
  });
  // Hide the splash overlay if still painting and the ambient stars (random positions)
  await page.addStyleTag({
    content: `[class*='absolute'] [class*='rounded-full'] { opacity: 0 !important; }`,
  });
}

test.describe('Visual regression', () => {
  test('sign-in card (EN dusk)', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    await setTheme(page, 'dusk');
    await page.goto(localePath('en', 'sign-in'));
    await freezePage(page);
    await expect(page).toHaveScreenshot('sign-in-en-dusk.png', { fullPage: false });
  });

  test('sign-in card (AR dusk)', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    await setTheme(page, 'dusk');
    await page.goto(localePath('ar', 'sign-in'));
    await freezePage(page);
    await expect(page).toHaveScreenshot('sign-in-ar-dusk.png', { fullPage: false });
  });

  test('dashboard hero (EN dusk)', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    await setTheme(page, 'dusk');
    await loginAs(page, 'admin');
    await page.goto(localePath('en'));
    await freezePage(page);
    await expect(page.locator('section').first()).toHaveScreenshot('dashboard-hero-en-dusk.png');
  });

  test('dashboard hero (AR dusk)', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    await setTheme(page, 'dusk');
    await loginAs(page, 'admin');
    await page.goto(localePath('ar'));
    await freezePage(page);
    await expect(page.locator('section').first()).toHaveScreenshot('dashboard-hero-ar-dusk.png');
  });

  test('admin couples list (EN dusk)', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    await setTheme(page, 'dusk');
    await loginAs(page, 'admin');
    await page.goto(localePath('en', 'admin/couples'));
    await freezePage(page);
    await expect(page).toHaveScreenshot('admin-couples-en-dusk.png', { fullPage: false });
  });

  test('account form (EN dusk)', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    await setTheme(page, 'dusk');
    await loginAs(page, 'admin');
    await page.goto(localePath('en', 'account'));
    await freezePage(page);
    await expect(page).toHaveScreenshot('account-en-dusk.png', { fullPage: false });
  });

  test('account form (day theme)', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    await setTheme(page, 'day');
    await loginAs(page, 'admin');
    await page.goto(localePath('en', 'account'));
    await freezePage(page);
    await expect(page).toHaveScreenshot('account-en-day.png', { fullPage: false });
  });

  test('account form (night theme)', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    await setTheme(page, 'night');
    await loginAs(page, 'admin');
    await page.goto(localePath('en', 'account'));
    await freezePage(page);
    await expect(page).toHaveScreenshot('account-en-night.png', { fullPage: false });
  });
});
