import { defineConfig, devices } from '@playwright/test';

/**
 * Forever E2E suite — runs against the live local stack (app + Kong) on the
 * supabase-net Docker network. Container entrypoint: `npx playwright test`.
 *
 * Projects fan the suite across desktop browsers + mobile viewports. The
 * `visual` suite is gated to chromium-desktop only to avoid cross-browser
 * font-rendering flakiness.
 */
export default defineConfig({
  testDir: '.',
  // Each spec controls its own parallelism; the stack can handle a couple of
  // concurrent contexts.
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: {
    timeout: 7_500,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ['./reporters/summary-reporter.ts'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://app:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 8_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'chromium-small-mobile',
      // iPhone SE-class small viewport
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 667 }, isMobile: false, hasTouch: true },
    },
    {
      name: 'chromium-320',
      // Extreme small phone — hides the brand wordmark
      use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 568 }, isMobile: false, hasTouch: true },
    },
  ],
  globalSetup: require.resolve('./global-setup'),
  outputDir: 'test-results',
});
