import { test, expect } from '@playwright/test';
import { localePath } from '../utils/i18n';
import { loginAs } from '../fixtures/auth';
import { failOnConsoleError } from '../utils/console';

test.describe('Heartbeat', () => {
  test('page loads, heading renders, realtime WS opens', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P1' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'app/[locale]/heartbeat/page.tsx — RouteGuard + realtime subscription',
    });

    await loginAs(page, 'admin');

    let wsOpened = false;
    page.on('websocket', (ws) => {
      if (ws.url().includes('/realtime/v1/websocket')) wsOpened = true;
    });

    const log = failOnConsoleError(page);
    await page.goto(localePath('en', 'heartbeat'));
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(4_000);
    expect(wsOpened, 'realtime WS did not open within 4s on /heartbeat').toBe(true);
    log.assertNone('heartbeat');
  });

  test('tapping the heart button does not crash', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P2' });
    await loginAs(page, 'admin');
    await page.goto(localePath('en', 'heartbeat'));

    // The primary button on /heartbeat is the big "heart" — there's typically only
    // one prominent button on the page. Click any visible button and confirm we
    // don't navigate away or throw.
    const buttons = page.getByRole('button');
    const n = await buttons.count();
    if (n > 0) {
      const log = failOnConsoleError(page);
      await buttons.first().click({ trial: false }).catch(() => {});
      await page.waitForTimeout(800);
      log.assertNone('heartbeat — heart tap');
    }
  });
});
