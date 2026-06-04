import { defineConfig, devices } from '@playwright/test';

// Sprint 4 Task 5 — Playwright E2E.
// The suite drives the REAL app: `wrangler dev` serves the built SPA (./dist) and
// the worker (/api/*) + local D1/R2/Durable Objects on one origin, so there is no
// CORS/proxy split. Dev auth paths make login deterministic without real Google:
//   • phone OTP console provider returns devCode in the JSON response,
//   • /api/auth/google/start mints a mock session for the seeded user.
// DATABASE_EMPTY=true (.dev.vars) seeds 10 members + events on first /api hit, so
// discovery/connection/chat/event flows have data to act on.
const PORT = 8787;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e/specs',
  outputDir: './tests/e2e/.output',
  // Auth is rate-limited 5/60s per IP; each test sends a unique cf-connecting-ip
  // (see fixtures) so parallel specs never share a bucket. Workers can run in parallel.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { outputFolder: 'tests/e2e/.report', open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000
  },

  // Logs in once as the seeded member and saves the session; most specs reuse it
  // via the `authedState` storage state (see fixtures.ts), keeping fresh auth calls
  // (login/onboarding/deletion specs) well under the rate limit.
  globalSetup: './tests/e2e/global-setup.ts',

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
          ]
        }
      }
    }
  ],

  webServer: {
    // Apply migrations, build the SPA, then serve everything via wrangler dev.
    command: 'npm run d1:migrate:local && npm run build && npx wrangler dev --local --port 8787',
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe'
  }
});
