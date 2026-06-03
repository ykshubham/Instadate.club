import { test, expect } from '../fixtures';
import { freshPhone, completeProfileViaApi } from '../support/auth';
import { LoginPage } from '../pages/login.page';

// E2E coverage for the LOGIN flow (LoginPage component, src/main.jsx ~L471).
//
// Guest mode is ON by default and the route guard redirects /login → /, so each
// test disables it (via LoginPage.goto's init script) BEFORE navigating. Every
// test uses a *fresh* phone number to dodge the per-phone OTP cooldown, and each
// fresh context carries its own unique cf-connecting-ip (fixtures) so the per-IP
// auth rate limit (5/60s) is never shared.
//
// SERIAL: the per-context cf-connecting-ip counter is per-process. Under the
// config's 4 parallel workers, separate worker processes each restart the counter
// at 0 and hand out the SAME ip to concurrent tests, pooling their /api/auth/*
// calls into one `auth_ip:<ip>` bucket and tripping the 5/60s limit
// (rateLimitResponse → "too_many_requests"). Running this file in a single worker
// keeps every context's ip distinct, so no bucket is shared.
test.describe.configure({ mode: 'serial' });

// Give every test a high-entropy, per-run cf-connecting-ip for the auth endpoints.
// The fixture's uniqueIp() is deterministic-per-process, so two runs within the
// same 60s window reuse the same ip and pile onto a stale `auth_ip:<ip>` bucket in
// the persistent local-D1 rate_limits table (→ "too_many_requests"). A random ip
// per test sidesteps that without touching the shared fixture/harness.
const randomAuthIp = () =>
  `172.${16 + Math.floor(Math.random() * 15)}.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`;

test.beforeEach(async ({ freshPage }) => {
  const ip = randomAuthIp();
  await freshPage.route('**/api/auth/**', async route => {
    const headers = { ...route.request().headers(), 'cf-connecting-ip': ip };
    await route.continue({ headers });
  });
});

test.describe('login flow', () => {
  test('phone OTP happy path signs the member in', async ({ freshPage }) => {
    const login = new LoginPage(freshPage);
    await login.goto();

    await login.selectCountryCode('+91');
    await login.fillPhone(freshPhone());
    await login.sendCode();

    // Console SMS provider surfaces the code inline as "Dev code: NNNNNN".
    const code = await login.readDevCode();
    await login.enterCode(code);
    await login.verify();

    // OTP verify mints a session on the context's cookie jar — but a *brand-new*
    // phone user has an incomplete profile, so the route guard parks them in
    // onboarding (canBrowseApp requires profile.completed). Arrange-via-API: mark
    // the now-authenticated profile complete. (The session cookie set by the UI
    // verify is shared with context.request.)
    await expect(login.heading).toHaveCount(0); // left the login screen
    await completeProfileViaApi(freshPage.context().request);

    // Prime the profile cache as completed BEFORE reload. Otherwise the guard's
    // first paint sees canBrowseApp=false (profile still loading), rewrites the URL
    // to /onboarding, and stays stuck there even after the server confirms the
    // profile is complete (see product note in the report). Seeding completed=true
    // makes canBrowseApp true from the first render, so the app feed renders.
    await freshPage.addInitScript(() =>
      sessionStorage.setItem('instadate_profile_cache', JSON.stringify({ completed: true }))
    );
    await freshPage.goto('/');

    // Authed signal: primary nav appears and the Google login affordance is gone.
    await expect(freshPage.getByRole('button', { name: 'Members' })).toBeVisible();
    await expect(
      freshPage.getByRole('button', { name: /login with google/i })
    ).toHaveCount(0);
  });

  test('wrong code is rejected and keeps the member on login', async ({ freshPage }) => {
    const login = new LoginPage(freshPage);
    await login.goto();

    await login.selectCountryCode('+91');
    await login.fillPhone(freshPhone());
    await login.sendCode();

    // Make sure the bad code genuinely differs from the real dev code.
    const realCode = await login.readDevCode();
    const wrongCode = realCode === '000000' ? '111111' : '000000';

    await login.enterCode(wrongCode);
    await login.verify();

    await expect(freshPage.getByText(/incorrect code/i)).toBeVisible();
    // Still on the login screen — the verify input is right there.
    await expect(login.codeInput).toBeVisible();
    await expect(freshPage.getByRole('button', { name: 'Members' })).toHaveCount(0);
  });

  test('email magic-link issuance shows a success state', async ({ freshPage }) => {
    const login = new LoginPage(freshPage);
    await login.goto();

    await login.switchToEmailButton.click();
    await expect(login.emailInput).toBeVisible();

    await login.emailInput.fill(`e2e-${Date.now()}@instadate.test`);
    await login.sendMagicLinkButton.click();

    // Dev build returns a devLink → success info + a clickable login link.
    await expect(freshPage.getByText(/magic link generated successfully/i)).toBeVisible();
    await expect(
      freshPage.getByRole('link', { name: /click here to log in directly/i })
    ).toBeVisible();
  });

  test('invalid (too-short) phone keeps Send code disabled', async ({ freshPage }) => {
    const login = new LoginPage(freshPage);
    await login.goto();

    await login.selectCountryCode('+91');
    await login.fillPhone('123'); // length < 6 → button disabled

    await expect(login.sendCodeButton).toBeDisabled();
  });
});
