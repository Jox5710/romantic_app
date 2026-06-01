/**
 * Smoke tests for the remaining 13 feature pages. Each:
 *  - navigates while logged in as admin (paired couple)
 *  - asserts the localized title renders
 *  - fails if there's any console error during ~3s of idle
 *
 * The map uses Leaflet + free OpenStreetMap tiles — no API key required, so we
 * just assert it renders the title like every other page.
 */
import { test, expect } from '@playwright/test';
import { localePath } from '../utils/i18n';
import { loginAs } from '../fixtures/auth';
import { failOnConsoleError } from '../utils/console';

const ROUTES: { slug: string; titleRe: RegExp; priority: 'P1' | 'P2' }[] = [
  { slug: 'gratitude',     titleRe: /gratitude/i,            priority: 'P2' },
  { slug: 'mirror',        titleRe: /mirror/i,               priority: 'P2' },
  { slug: 'promises',      titleRe: /promis/i,               priority: 'P2' },
  { slug: 'blueprint',     titleRe: /blueprint/i,            priority: 'P2' },
  { slug: 'missions',      titleRe: /mission/i,              priority: 'P1' },
  { slug: 'constellation', titleRe: /constellation/i,        priority: 'P2' },
  { slug: 'echo',          titleRe: /echo/i,                 priority: 'P2' },
  { slug: 'canvas',        titleRe: /canvas/i,               priority: 'P2' },
  { slug: 'dinner',        titleRe: /swipe to eat|dinner/i,  priority: 'P2' },
  { slug: 'truce',         titleRe: /safe harbor|truce/i,    priority: 'P2' },
  { slug: 'voices',        titleRe: /voice/i,                priority: 'P2' },
  { slug: 'queue',         titleRe: /queue/i,                priority: 'P2' },
  { slug: 'map',           titleRe: /map/i,                  priority: 'P2' },
];

for (const { slug, titleRe, priority } of ROUTES) {
  test(`Smoke — /${slug} loads with title + no console errors`, async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: priority });
    await loginAs(page, 'admin');
    const log = failOnConsoleError(page);
    await page.goto(localePath('en', slug));
    await expect(page.locator('main h1')).toHaveText(titleRe, { timeout: 10_000 });

    // Brief idle to surface late console errors
    await page.waitForTimeout(1_500);
    log.assertNone(`${slug} smoke`);
  });
}
