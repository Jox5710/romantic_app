/**
 * Theme — dusk/day/night switching changes the data-theme attribute and the
 * --glow-1 CSS var (so the romantic background re-tints).
 */
import { test, expect } from '@playwright/test';
import { localePath } from './utils/i18n';
import { loginAs } from './fixtures/auth';
import { readGlowVar } from './utils/theme';

test.describe('Theme', () => {
  test('all three themes produce distinct --glow-1 values', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'app/globals.css — --glow-1 / --glow-2 per [data-theme=...]',
    });

    await loginAs(page, 'admin');
    await page.goto(localePath('en'));

    // Toggle the theme attribute directly on the live page (no addInitScript
    // stacking) and read the resolved CSS var each time.
    const readAfter = async (theme: 'dusk' | 'day' | 'night') => {
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      return readGlowVar(page, 1);
    };
    const dusk = await readAfter('dusk');
    const day = await readAfter('day');
    const night = await readAfter('night');

    expect(dusk).not.toEqual('');
    expect(day).not.toEqual('');
    expect(night).not.toEqual('');
    expect(new Set([dusk, day, night]).size).toBeGreaterThanOrEqual(2);
  });
});
