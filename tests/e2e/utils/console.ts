import { Page } from '@playwright/test';

/**
 * A small allow-list of known-benign dev-mode log noise. Anything else that
 * comes through `console.error` or `pageerror` fails the test.
 */
const IGNORE = [
  // Next.js dev warnings about external CSS, prefetching, etc.
  /Hydration failed/i, // We assert this separately
  /Fast Refresh/i,
  /\[Next\.js\]/i,
  /Image with src .* was detected as the Largest Contentful Paint/i,
  /Download the React DevTools/i,
  // Supabase realtime info logs
  /GoTrueClient/i,
  /Multiple GoTrueClient instances/i,
];

export function failOnConsoleError(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORE.some((r) => r.test(text))) return;
    errors.push(`console.error: ${text}`);
  });
  return {
    /** Throw if any unexpected console errors were captured. Call before `test.fail()`. */
    assertNone(label: string) {
      if (errors.length) {
        throw new Error(`[${label}] unexpected console errors:\n${errors.join('\n')}`);
      }
    },
    errors,
  };
}
