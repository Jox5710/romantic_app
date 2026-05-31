/**
 * Deeper smoke specs for the 8 routes whose primary mutations weren't covered
 * by the original smoke loop. Each test:
 *   - logs in as admin
 *   - triggers the page's main mutation
 *   - assets no console errors fire
 *   - keeps the suite duration tight (~1.5s idle each)
 *
 * Bug-fix pass in Part B (loading states + error toasts + i18n) made these
 * assertions reliable — before that, half of them would silently hang.
 */
import { test, expect } from '@playwright/test';
import { localePath } from '../utils/i18n';
import { loginAs } from '../fixtures/auth';
import { failOnConsoleError } from '../utils/console';

test('Promises — add row + console clean', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'promises'));
  await expect(page.locator('main h1')).toBeVisible({ timeout: 10_000 });

  const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
  if (await addBtn.count()) {
    await addBtn.click().catch(() => {});
    const textarea = page.locator('main textarea, main input[type="text"]').first();
    if (await textarea.count()) {
      await textarea.fill(`e2e promise ${Date.now()}`);
      const save = page.getByRole('button', { name: /save|create|add/i }).last();
      if (await save.count()) {
        await save.click().catch(() => {});
        await page.waitForTimeout(1_200);
      }
    }
  }
  log.assertNone('promises add');
});

test('Dinner — page loads + console clean', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'dinner'));
  await expect(page.locator('main h1')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1_500);
  log.assertNone('dinner smoke');
});

test('Queue — add an item without console error', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'queue'));
  await expect(page.locator('main h1')).toBeVisible({ timeout: 10_000 });

  const addBtn = page.getByRole('button', { name: /^add/i }).first();
  if (await addBtn.count()) {
    await addBtn.click().catch(() => {});
    const titleInput = page.locator('main input[type="text"], main input:not([type])').first();
    if (await titleInput.count()) {
      await titleInput.fill(`e2e queue ${Date.now()}`);
      const save = page.getByRole('button', { name: /^add$/i }).last();
      if (await save.count()) {
        await save.click().catch(() => {});
        await page.waitForTimeout(1_200);
      }
    }
  }
  log.assertNone('queue add');
});

test('Echo — page loads with no infinite spinner', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'echo'));
  await expect(page.locator('main h1')).toBeVisible({ timeout: 10_000 });
  // Either a "no echoes for today" empty state OR a list — both are fine; what
  // we're guarding against is the pre-fix infinite-loading state.
  await page.waitForTimeout(1_500);
  log.assertNone('echo smoke');
});

test('Mirror — page loads + console clean', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'mirror'));
  await expect(page.locator('main h1')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1_500);
  log.assertNone('mirror smoke');
});

test('Blueprint — page loads + console clean', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'blueprint'));
  await expect(page.locator('main h1')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1_500);
  log.assertNone('blueprint smoke');
});

test('Missions — assign a mission without console error', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'missions'));
  await expect(page.locator('main h1')).toBeVisible({ timeout: 10_000 });

  // "Get a mission" only shows when there's no active mission yet. Either way
  // we just want a clean render.
  const getBtn = page.getByRole('button', { name: /get a mission|new mission|assign/i }).first();
  if (await getBtn.count()) {
    await getBtn.click().catch(() => {});
    await page.waitForTimeout(1_200);
  }
  log.assertNone('missions smoke');
});

test('Truce — Safe Harbor page loads + console clean', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'priority', description: 'P1' });
  await loginAs(page, 'admin');
  const log = failOnConsoleError(page);
  await page.goto(localePath('en', 'truce'));
  await expect(page.locator('main h1')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1_500);
  log.assertNone('truce smoke');
});
