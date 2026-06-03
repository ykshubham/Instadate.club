// SECURITY: the post-login redirect target must never escape to an external
// origin (open-redirect). We call the route with manual redirect handling so we
// can inspect the Location header the worker mints.
import { SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

let ipCounter = 0;
// Google is unconfigured in tests, so /api/auth/google/start mints a mock
// session and 302s to safeRedirect(redirectTo). Use a unique IP per call so the
// 5/60s per-IP auth limiter never trips.
async function startWithRedirect(redirectTo: string): Promise<Response> {
  const ip = `203.0.114.${++ipCounter}`;
  const url = `https://example.com/api/auth/google/start?redirectTo=${encodeURIComponent(redirectTo)}`;
  return SELF.fetch(url, {
    method: 'GET',
    headers: { 'cf-connecting-ip': ip },
    redirect: 'manual'
  });
}

describe('open redirect is blocked on /api/auth/google/start', () => {
  it('protocol-relative //evil.com → /profile', async () => {
    const res = await startWithRedirect('//evil.com');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/profile');
  });

  it('absolute https://evil.com → /profile', async () => {
    const res = await startWithRedirect('https://evil.com');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/profile');
  });

  it('backslash trick /\\evil.com → /profile', async () => {
    const res = await startWithRedirect('/\\evil.com');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/profile');
  });

  it('same-origin path /members is preserved', async () => {
    const res = await startWithRedirect('/members');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/members');
  });
});
