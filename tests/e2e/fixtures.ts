import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { uniqueIpHeaders } from './support/auth';
import { SEEDED_STATE } from './global-setup';

// Custom fixtures:
//   • `seededPage`  — a page authenticated as the seeded member (reuses the
//     global storage state) on its own unique cf-connecting-ip. Use for
//     discovery / connection / chat / event flows that need a completed account
//     with peers and events already present.
//   • `freshContext` / `freshPage` — a brand-new, UNauthenticated context on its
//     own unique IP. Use for login / onboarding / deletion flows that must drive
//     auth themselves or operate on a throwaway user.
//
// Every context carries a unique cf-connecting-ip so the per-IP auth rate limit
// (5/60s) is never shared across tests, even fully parallel.
type Fixtures = {
  seededContext: BrowserContext;
  seededPage: Page;
  freshContext: BrowserContext;
  freshPage: Page;
};

export const test = base.extend<Fixtures>({
  seededContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: SEEDED_STATE,
      extraHTTPHeaders: uniqueIpHeaders()
    });
    await use(context);
    await context.close();
  },
  seededPage: async ({ seededContext }, use) => {
    const page = await seededContext.newPage();
    await use(page);
  },
  freshContext: async ({ browser }, use) => {
    const context = await browser.newContext({ extraHTTPHeaders: uniqueIpHeaders() });
    await use(context);
    await context.close();
  },
  freshPage: async ({ freshContext }, use) => {
    const page = await freshContext.newPage();
    await use(page);
  }
});

export { expect };
