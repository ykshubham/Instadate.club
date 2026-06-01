import type { APIRequestContext, BrowserContext, Page } from '@playwright/test';

// Auth/seed helpers shared by the E2E suite.
//
// Rate-limit note: /api/auth/* is limited to 5 requests / 60s PER IP, keyed off
// the `cf-connecting-ip` header (absent → 127.0.0.1, shared by every test). Each
// browser context therefore sends a UNIQUE cf-connecting-ip so parallel specs and
// repeated logins never collide on one bucket. Always create contexts via
// `uniqueIpHeaders()` (the fixtures do this automatically).

let ipCounter = 0;
/** A distinct, deterministic-per-process cf-connecting-ip for a context. */
export function uniqueIp(): string {
  ipCounter += 1;
  const n = 100000 + ipCounter;
  return `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`;
}

export function uniqueIpHeaders(): Record<string, string> {
  return { 'cf-connecting-ip': uniqueIp() };
}

/** A never-before-seen phone number so each OTP login creates a fresh user. */
export function freshPhone(): string {
  const n = String(Date.now()).slice(-7) + String(Math.floor(Math.random() * 90) + 10);
  return n.slice(-10);
}

/**
 * Programmatic phone-OTP login through the console SMS provider (dev/test only).
 * The session cookie is set on the APIRequestContext's cookie jar — when that
 * context belongs to a BrowserContext, page navigations are authenticated too.
 * Returns the phone used and the resolved user id.
 */
export async function otpLogin(
  request: APIRequestContext,
  phone = freshPhone(),
  countryCode = '+91'
): Promise<{ phone: string; userId: string }> {
  const start = await request.post('/api/auth/otp/start', { data: { phone, countryCode } });
  if (!start.ok()) throw new Error(`otp/start failed: ${start.status()} ${await start.text()}`);
  const { devCode } = await start.json();
  if (!devCode) throw new Error('No devCode returned — console SMS provider not active?');

  const verify = await request.post('/api/auth/otp/verify', { data: { phone, countryCode, code: devCode } });
  if (!verify.ok()) throw new Error(`otp/verify failed: ${verify.status()} ${await verify.text()}`);
  const { user } = await verify.json();
  return { phone, userId: user?.id };
}

/**
 * Mock-Google login (used when Google OAuth is not configured): navigating to
 * /api/auth/google/start mints a session for the seeded member and 302s home.
 * Returns after the redirect settles.
 */
export async function loginAsSeeded(page: Page): Promise<void> {
  await page.goto('/api/auth/google/start?redirectTo=/');
  await page.waitForURL('**/');
}

/**
 * Drive the profile to `completed` via the API so discovery/chat/event gates
 * (requirePublished) pass. Uploads one photo (completion requires ≥1) then PATCHes
 * the mandatory fields. Operates on the context's authenticated cookie jar.
 */
export async function completeProfileViaApi(request: APIRequestContext): Promise<void> {
  // 1×1 transparent PNG.
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const bytes = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));
  await request.post('/api/profile/photo', {
    multipart: { photo: { name: 'p.png', mimeType: 'image/png', buffer: Buffer.from(bytes) } }
  });
  await request.patch('/api/profile', {
    data: {
      profile: {
        fullName: 'E2E Tester',
        age: '27',
        gender: 'female',
        intent: 'Friendship',
        city: 'Mumbai',
        bio: 'Automated end-to-end test account.'
      }
    }
  });
}

/** Convenience: a fresh, authenticated + completed user (its own unique IP). */
export async function freshCompletedUser(context: BrowserContext): Promise<{ phone: string; userId: string }> {
  const res = await otpLogin(context.request);
  await completeProfileViaApi(context.request);
  return res;
}
