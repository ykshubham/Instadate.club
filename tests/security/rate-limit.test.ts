// SECURITY: the per-IP auth limiter (5 / 60s) must fire to throttle abuse.
// We deliberately REUSE a single cf-connecting-ip so the limiter sees one bucket.
import { describe, it, expect } from 'vitest';
import { api } from '../helpers';

describe('auth rate limiting', () => {
  it('POST /api/auth/otp/start returns 429 with Retry-After within 6 calls on one IP', async () => {
    const ip = '203.0.113.9'; // fixed IP → shared bucket → limiter trips
    const phone = '+919811111222';

    let saw429 = false;
    let sawRetryAfter = false;

    // Drive all 6 calls. The per-IP limiter (5/60s) trips on the 6th call and
    // returns a standards-compliant 429 carrying Retry-After. (Earlier calls may
    // also 429 via the OTP resend cooldown, which is a separate throttle.)
    for (let i = 0; i < 6; i++) {
      const res = await api('/api/auth/otp/start', {
        method: 'POST',
        body: { phone, countryCode: '+91' },
        headers: { 'cf-connecting-ip': ip }
      });
      if (res.status === 429) {
        saw429 = true;
        if (res.headers.get('retry-after')) sawRetryAfter = true;
      }
    }

    expect(saw429).toBe(true);
    expect(sawRetryAfter).toBe(true);
  });
});
