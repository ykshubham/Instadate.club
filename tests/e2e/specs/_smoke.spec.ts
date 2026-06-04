import { test, expect } from '../fixtures';

// Validates the harness end-to-end: webServer boot, SPA serving, mock-Google
// seeded auth (via storage state), and a fresh unauthenticated context.
//
// Two app-behavior facts every spec relies on (see tests/e2e/README.md):
//  1. Primary nav is a set of header BUTTONS: Home / Members / Inbox / Events /
//     Profile (the bottom <nav aria-label="Primary navigation"> is mobile-only).
//  2. Guest mode is ON by default, so the guard redirects /login → / and renders
//     /onboarding only when NOT browsing. To land on /login or /onboarding,
//     disable guest mode first via an init script.
test.describe('harness smoke', () => {
  test('seeded member lands in the authenticated app', async ({ seededPage }) => {
    await seededPage.goto('/');
    await expect(seededPage.getByRole('button', { name: 'Members' })).toBeVisible();
    // Authed: the Google login affordance is gone, the account button is present.
    await expect(seededPage.getByRole('button', { name: /login with google/i })).toHaveCount(0);
  });

  test('fresh visitor can reach the login screen', async ({ freshPage }) => {
    await freshPage.addInitScript(() => sessionStorage.setItem('instadate_guest_mode', 'false'));
    await freshPage.goto('/login');
    await expect(freshPage.getByRole('heading', { name: /sign in to instadate/i })).toBeVisible();
    await expect(freshPage.getByPlaceholder('Phone number')).toBeVisible();
  });

  test('unauthenticated guest accessing profile or chat redirects to login', async ({ freshPage }) => {
    // Guest mode is true by default. Tapping protected routes should redirect to /login.
    await freshPage.goto('/chat');
    await expect(freshPage.getByRole('heading', { name: /sign in to instadate/i })).toBeVisible();
    expect(freshPage.url()).toContain('/login');

    await freshPage.goto('/profile');
    await expect(freshPage.getByRole('heading', { name: /sign in to instadate/i })).toBeVisible();
    expect(freshPage.url()).toContain('/login');
  });

  test('unauthenticated non-guest accessing profile or chat redirects to login', async ({ freshPage }) => {
    // Disable guest mode
    await freshPage.addInitScript(() => sessionStorage.setItem('instadate_guest_mode', 'false'));
    
    await freshPage.goto('/chat');
    await expect(freshPage.getByRole('heading', { name: /sign in to instadate/i })).toBeVisible();
    expect(freshPage.url()).toContain('/login');

    await freshPage.goto('/profile');
    await expect(freshPage.getByRole('heading', { name: /sign in to instadate/i })).toBeVisible();
    expect(freshPage.url()).toContain('/login');
  });
});
