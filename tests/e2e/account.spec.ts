/**
 * Account page — bilingual names + wedding date persistence.
 */
import { test, expect } from '@playwright/test';
import { localePath } from './utils/i18n';
import { loginAs } from './fixtures/auth';
import { getDemoCoupleId } from './fixtures/couple';
import { newApi, signInWithPassword } from './fixtures/api';

test.describe('Account', () => {
  test('fields hydrate from the DB', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P1' });
    await loginAs(page, 'admin');
    await page.goto(localePath('en', 'account'));
    await expect(page.locator('main h1')).toHaveText(/couple settings/i, { timeout: 10_000 });

    // The Field component renders its label as a span, not <label for>, so
    // getByLabel doesn't work. Pick the first text input under main form
    // — that's name_a — and assert it hydrated from the DB.
    const firstInput = page.locator('main form input[type="text"], main form input:not([type])').first();
    await expect(firstInput).toBeVisible({ timeout: 10_000 });
    await expect(firstInput).not.toHaveValue('', { timeout: 8_000 });
  });

  test('changing the wedding date persists across reload', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P1' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'app/[locale]/account/page.tsx — save() PATCH to couples',
    });

    await loginAs(page, 'admin');
    await page.goto(localePath('en', 'account'));

    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible({ timeout: 10_000 });
    const previous = await dateInput.inputValue();
    const next = '2099-12-31';
    await dateInput.fill(next);

    await page.getByRole('button', { name: /save changes/i }).click();

    // Toast appears
    await expect(page.locator('text=/^saved$/i').first()).toBeVisible({ timeout: 6_000 });

    // Reload and verify it stuck
    await page.reload();
    await expect(page.locator('input[type="date"]').first()).toHaveValue(next, { timeout: 8_000 });

    // Restore previous value (best-effort cleanup; uses service role)
    const id = await getDemoCoupleId();
    const api = await newApi('service');
    await api.patch(`/rest/v1/couples?id=eq.${id}`, {
      data: { wedding_date: previous ? new Date(previous).toISOString() : null },
    });
    await api.dispose();
  });
});
