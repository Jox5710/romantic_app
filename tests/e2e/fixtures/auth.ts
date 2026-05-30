/**
 * UI-based login. We go to /en/sign-in, fill the password tab, and wait for
 * the redirect off /sign-in. Slower than localStorage injection (~2s/login)
 * but the supabase-js session format is brittle to recreate by hand — UI flow
 * is the only fully reliable path.
 */
import { Page, expect } from '@playwright/test';
import { signInWithPassword } from './api';

export type Role = 'admin' | 'partner';

const credentials: Record<Role, { email: string; password: string }> = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL ?? 'admin@fromantic.com',
    password: process.env.TEST_ADMIN_PASSWORD ?? 'jox@12345',
  },
  partner: {
    email: process.env.TEST_PARTNER_EMAIL ?? 'nourhansamy@fromantic.com',
    password: process.env.TEST_PARTNER_PASSWORD ?? 'nourhan@youssef',
  },
};

export interface LoggedInSession {
  email: string;
  userId: string;
}

/**
 * Sign in via the password tab in the UI. Returns once the page has navigated
 * away from /sign-in.
 *
 * For tests that JUST need the auth token (e.g., API-only assertions), use
 * `signInWithPassword` from fixtures/api.ts directly — it doesn't need a Page.
 */
export async function loginAs(page: Page, role: Role): Promise<LoggedInSession> {
  const { email, password } = credentials[role];

  // Pre-fetch the token so we can return user info quickly.
  const tok = await signInWithPassword(email, password);

  // Pre-mark every tutorial as seen so the spotlight scrim doesn't intercept
  // clicks on the dashboard / feature pages. Tests should opt-in to tutorial
  // assertions explicitly via a separate fixture if they need it.
  await page.addInitScript(() => {
    try {
      const keys = ['home', 'whisper', 'heartbeat', 'capsule', 'mirror', 'bucket', 'timeline', 'voices', 'canvas', 'admin'];
      const seen = JSON.stringify(keys);
      localStorage.setItem('forever_tutorials_completed', seen);
      for (const k of keys) localStorage.setItem(`forever_tutorial_${k}`, 'seen');
    } catch {}
  });

  await page.goto('/en/sign-in');
  await page.getByRole('button', { name: 'Password', exact: true }).click();
  // Scope every input/submit to the form that holds a password input — this
  // disambiguates the magic-link form, the password sign-in form, and the
  // sign-up form (which appears under the same tab).
  const pwForm = page.locator('form').filter({ has: page.locator('input[type="password"]') });
  await expect(pwForm.locator('input[type="password"]')).toBeVisible({ timeout: 5_000 });
  await pwForm.locator('input[type="email"]').fill(email);
  await pwForm.locator('input[type="password"]').first().fill(password);
  await pwForm.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 20_000 });

  return { email: tok.user.email, userId: tok.user.id };
}

/** Clears auth storage so subsequent navigations are unauthenticated. */
export async function logout(page: Page) {
  await page.addInitScript(() => {
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('sb-') || k.startsWith('forever_')) localStorage.removeItem(k);
      }
    } catch {}
  });
}
