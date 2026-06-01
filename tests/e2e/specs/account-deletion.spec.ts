import { test, expect } from '../fixtures';
import { otpLogin, completeProfileViaApi, uniqueIpHeaders } from '../support/auth';
import { AccountPage } from '../pages/account.page';

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT DELETION / LIFECYCLE  (ProfileDashboard → "Account & Data" / DangerZone)
//
// Always operates on a THROWAWAY fresh user (never the seeded member), created
// per-test on `freshContext` via OTP + profile completion. The DangerZone
// controls (`Delete account`, `Deactivate account`) render INLINE on /profile —
// they are NOT behind the "Settings & Verification" sheet (see
// src/ProfileDashboard.jsx: SimplifiedSettings renders <DangerZone/> directly).
//
// Behavioral facts these tests rely on (verified against the app):
//   • DELETE /api/account → requestDeletion(): status='deactivated' + 30-day
//     purge scheduled. The component then calls onLogout → handleLogout →
//     signOut(), which POSTs /api/auth/logout (REVOKES the session) and
//     window.location.replace('/login'). So after a real delete: the browser is
//     on /login AND the (now-revoked) session makes /api/auth/me return null.
//   • The confirm guard is client-side: deleteAccount() refuses unless the input
//     (trimmed, upper-cased) === 'DELETE', surfacing "Type DELETE to confirm."
//     WITHOUT calling the API — so the account is untouched.
//   • Deactivate mirrors delete's logout: POST /api/account/deactivate → signOut
//     → /login.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('account deletion / lifecycle', () => {
  // Run serially in a single worker. The unique-IP counter (support/auth.ts) is
  // module-scoped and resets per worker process, so fully-parallel workers would
  // hand the same cf-connecting-ip to different contexts and collide on the
  // per-IP /api/auth/* limiter (5/60s). One worker → distinct IPs per context.
  test.describe.configure({ mode: 'serial' });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Confirmation guard (negative) — runs FIRST so the destructive test can't
  //    affect it. Clicking "Delete forever" without typing DELETE must NOT delete.
  // ───────────────────────────────────────────────────────────────────────────
  test('confirmation guard blocks deletion when DELETE is not typed', async ({ freshContext, freshPage }) => {
    await otpLogin(freshContext.request);
    await completeProfileViaApi(freshContext.request);

    const account = new AccountPage(freshPage);
    await account.gotoProfile();
    await account.openDeleteModal();

    // Click confirm with the input left EMPTY → client guard rejects.
    // The error renders in a styled <p>; an exact match avoids the modal body
    // paragraph that merely mentions "...Type DELETE to confirm." as instructions.
    const guardError = freshPage.getByText('Type DELETE to confirm.', { exact: true });
    await account.deleteForeverButton.click();
    await expect(guardError.first()).toBeVisible();

    // Also reject WRONG text (the guard upper-cases + trims, so "delete" passes;
    // use clearly-wrong text to prove a mismatch is blocked).
    await account.confirmInput.fill('nope');
    await account.deleteForeverButton.click();
    await expect(guardError.first()).toBeVisible();

    // Still on /profile, modal still open — nothing was deleted.
    await expect(freshPage).toHaveURL(/\/profile$/);
    await expect(account.deleteForeverButton).toBeVisible();

    // The account is intact and ACTIVE per the API.
    const me = await freshContext.request.get('/api/auth/me');
    const body = await me.json();
    expect(body.user).toBeTruthy();
    expect(body.user.status).toBe('active');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Delete account → logged out. The destructive happy path.
  // ───────────────────────────────────────────────────────────────────────────
  test('typing DELETE and confirming deletes the account and logs out', async ({ freshContext, freshPage }) => {
    await otpLogin(freshContext.request);
    await completeProfileViaApi(freshContext.request);

    const account = new AccountPage(freshPage);
    await account.gotoProfile();
    await account.openDeleteModal();

    // Type DELETE and confirm — fires DELETE /api/account then signOut().
    await account.confirmDelete('DELETE');

    // Logged out: signOut() does window.location.replace('/login') and the
    // login screen renders (guest mode is forced off, so /login is not bounced).
    await freshPage.waitForURL(/\/login$/);
    await expect(freshPage.getByRole('heading', { name: /sign in to instadate/i })).toBeVisible();
    await expect(freshPage.getByPlaceholder('Phone number')).toBeVisible();

    // API confirms the session is gone → account is no longer reachable.
    const me = await freshContext.request.get('/api/auth/me');
    const body = await me.json();
    expect(body.user).toBeFalsy();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. (Optional) Deactivate via UI → assert deactivated, then reactivate (API).
  //    Deactivate also logs out (signOut). To reactivate we re-establish a
  //    session by re-logging-in the SAME phone (reactivation == "sign back in"),
  //    then POST /api/account/reactivate and assert the account is active again.
  // ───────────────────────────────────────────────────────────────────────────
  test('deactivate via UI then reactivate restores an active account', async ({ playwright, freshContext, freshPage }) => {
    const loginAtMs = Date.now();
    const { phone } = await otpLogin(freshContext.request);
    await completeProfileViaApi(freshContext.request);

    const account = new AccountPage(freshPage);
    await account.gotoProfile();

    // Open the deactivate modal and confirm → POST /api/account/deactivate, then
    // signOut() revokes the session and redirects to /login.
    await account.openDeactivateModal();
    await account.confirmDeactivateButton.click();

    await freshPage.waitForURL(/\/login$/);
    await expect(freshPage.getByRole('heading', { name: /sign in to instadate/i })).toBeVisible();

    // Session is revoked → /api/auth/me is null (deactivated, signed out).
    const afterDeactivate = await freshContext.request.get('/api/auth/me');
    expect((await afterDeactivate.json()).user).toBeFalsy();

    // Re-establish a session by signing back in with the SAME phone (reactivation
    // == "sign back in"). Two server limiters constrain this:
    //   • per-PHONE OTP resend cooldown: 30s since the first otp/start.
    //   • per-IP /api/auth/* limiter: 5 / 60s (otp/start + otp/verify both count).
    // Use a PRISTINE IP (new APIRequestContext) so the re-login has a full budget,
    // and wait out the per-phone cooldown ONCE so the single otp/start succeeds
    // (polling otp/start would burn the IP budget on cooldown rejections).
    const reauth = await playwright.request.newContext({
      baseURL: 'http://127.0.0.1:8787',
      extraHTTPHeaders: uniqueIpHeaders()
    });
    const sinceLogin = Date.now() - loginAtMs;
    const cooldownRemaining = 31_000 - sinceLogin;
    if (cooldownRemaining > 0) await freshPage.waitForTimeout(cooldownRemaining);

    const start = await reauth.post('/api/auth/otp/start', { data: { phone, countryCode: '+91' } });
    expect(start.ok()).toBeTruthy();
    const { devCode } = await start.json();
    expect(devCode).toBeTruthy();

    const verify = await reauth.post('/api/auth/otp/verify', {
      data: { phone, countryCode: '+91', code: devCode }
    });
    expect(verify.ok()).toBeTruthy();

    // The signed-back-in account is still 'deactivated' (grace) until reactivated.
    const stillDeactivated = await reauth.get('/api/auth/me');
    expect((await stillDeactivated.json()).user?.status).toBe('deactivated');

    // Reactivate and confirm the account is ACTIVE again.
    const reactivate = await reauth.post('/api/account/reactivate');
    expect(reactivate.ok()).toBeTruthy();
    expect((await reactivate.json()).status).toBe('active');

    const me = await reauth.get('/api/auth/me');
    const body = await me.json();
    expect(body.user).toBeTruthy();
    expect(body.user.status).toBe('active');

    await reauth.dispose();
  });
});
