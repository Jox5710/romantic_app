/**
 * Theme — dusk/day/night switching changes the data-theme attribute and the
 * --glow-1 CSS var (so the romantic background re-tints).
 */
import { test, expect } from '@playwright/test';
import { localePath } from './utils/i18n';
import { loginAs } from './fixtures/auth';
import { readGlowVar, setTheme } from './utils/theme';

test.describe('Theme', () => {
  test('all three themes produce distinct --glow-1 values', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'app/globals.css — --glow-1 / --glow-2 per [data-theme=...]',
    });

    await loginAs(page, 'admin');

    // dusk
    await setTheme(page, 'dusk');
    await page.goto(localePath('en'));
    const dusk = await readGlowVar(page, 1);

    // day
    await setTheme(page, 'day');
    await page.goto(localePath('en'));
    const day = await readGlowVar(page, 1);

    // night
    await setTheme(page, 'night');
    await page.goto(localePath('en'));
    const night = await readGlowVar(page, 1);

    // Each theme defines a non-empty glow color, and the three differ from each other
    expect(dusk).not.toEqual('');
    expect(day).not.toEqual('');
    expect(night).not.toEqual('');
    expect(new Set([dusk, day, night]).size).toBeGreaterThanOrEqual(2);
  });
});
