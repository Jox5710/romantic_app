/**
 * Auth flows — sign-in (password), redirect-on-session, sign-out via UserMenu.
 *
 * Note: magic-link and OAuth flows are intentionally not covered here because
 * they need MailHog + a configured Google/Apple sandbox. We add a smoke
 * assertion that the UI renders.
 */
import { test, expect } from '@playwright/test';
import { localePath } from './utils/i18n';
import { failOnConsoleError } from './utils/console';
import { loginAs, logout } from './fixtures/auth';

test.describe('Auth — sign-in & redirect', () => {
  test('sign-in page renders with magic + password tabs and OAuth buttons', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P0' });
    const log = failOnConsoleError(page);
    await page.goto(localePath('en', 'sign-in'));
    // Heading
    await expect(page.locator('h1', { hasText: /welcome back/i })).toBeVisible();
    // Tabs — exact-match strings to avoid colliding with "Send magic link" submit.
    await expect(page.getByRole('button', { name: 'Magic Link', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Password', exact: true })).toBeVisible();
    // OAuth row
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apple' })).toBeVisible();
    log.assertNone('sign-in render');
  });

  test('password sign-in lands on home WITHOUT a manual refresh', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P0' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description:
        'app/[locale]/(auth)/sign-in/page.tsx — redirect effect reads useCoupleState; if broken, see CoupleStateProvider in lib/hooks/couple-state-context.tsx',
    });
    await page.goto(localePath('en', 'sign-in'));
    await page.getByRole('button', { name: 'Password', exact: true }).click();
    const pwForm = page.locator('form').filter({ has: page.locator('input[type="password"]') });
    await expect(pwForm.locator('input[type="password"]')).toBeVisible({ timeout: 5_000 });
    await pwForm.locator('input[type="email"]').fill(process.env.TEST_ADMIN_EMAIL ?? 'admin@fromantic.com');
    await pwForm.locator('input[type="password"]').first().fill(process.env.TEST_ADMIN_PASSWORD ?? 'jox@12345');
    await pwForm.locator('button[type="submit"]').click();

    // After sign-in we should leave /sign-in. Either way, /sign-in must not be the final URL.
    await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 20_000 });
    expect(page.url()).not.toContain('/sign-in');
  });

  test('wrong password shows a localized error toast', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P1' });
    await page.goto(localePath('en', 'sign-in'));
    await page.getByRole('button', { name: 'Password', exact: true }).click();
    const pwForm = page.locator('form').filter({ has: page.locator('input[type="password"]') });
    await expect(pwForm.locator('input[type="password"]')).toBeVisible({ timeout: 5_000 });
    await pwForm.locator('input[type="email"]').fill('admin@fromantic.com');
    await pwForm.locator('input[type="password"]').first().fill('not-the-password');
    await pwForm.locator('button[type="submit"]').click();
    // The page renders the inline error message at the top of the form
    await expect(page.locator('text=/invalid email or password|invalid login credentials/i')).toBeVisible({
      timeout: 6_000,
    });
  });

  test('header user menu signs out and redirects to /sign-in', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P0' });
    testInfo.annotations.push({
      type: 'suggestedFix',
      description: 'components/layout/user-menu.tsx — signOut + router.replace',
    });

    await loginAs(page, 'admin');
    await page.goto(localePath('en'));

    // Header avatar — opens menu
    const avatar = page.locator('button[aria-haspopup="menu"]');
    await expect(avatar).toBeVisible({ timeout: 10_000 });
    await avatar.click();

    // Sign out item
    await page.getByRole('menuitem', { name: /sign out/i }).click();
    await page.waitForURL((url) => url.pathname.endsWith('/sign-in'), { timeout: 10_000 });
    expect(page.url()).toMatch(/\/sign-in$/);

    // Menu hidden on sign-in
    await expect(page.locator('button[aria-haspopup="menu"]')).toHaveCount(0);
  });

  test('unauthenticated request to a guarded route redirects to /sign-in', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'priority', description: 'P0' });
    await logout(page);
    await page.goto(localePath('en', 'heartbeat'));
    await page.waitForURL((url) => url.pathname.endsWith('/sign-in'), { timeout: 10_000 });
  });
});
