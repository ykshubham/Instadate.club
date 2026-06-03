import { chromium, request as playwrightRequest, type FullConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uniqueIpHeaders, completeProfileViaApi } from './support/auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Runs once before the suite. Logs in as the seeded member via the mock-Google
// dev path, ensures the profile is completed, and persists the browser storage
// state. Authenticated specs load this state instead of re-authing (which keeps
// fresh auth calls under the per-IP rate limit). Also warms the seeder so the
// 10 seeded members + events exist before discovery/event specs run.
export const SEEDED_STATE = path.join(__dirname, '.auth', 'seeded.json');

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://127.0.0.1:8787';
  fs.mkdirSync(path.dirname(SEEDED_STATE), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL,
    extraHTTPHeaders: uniqueIpHeaders()
  });
  const page = await context.newPage();

  // Mock-Google login → seeded_user_1 (seeded, completed, has peers/events/chats).
  await page.goto('/api/auth/google/start?redirectTo=/');
  await page.waitForURL('**/');

  // Belt-and-braces: make sure the logged-in profile is publishable.
  await completeProfileViaApi(context.request).catch(() => {});

  await context.storageState({ path: SEEDED_STATE });
  await browser.close();

  // Warm a second independent IP so the seeder + members endpoint are primed.
  const warm = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: uniqueIpHeaders() });
  await warm.get('/api/members').catch(() => {});
  await warm.dispose();
}
