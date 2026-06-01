// SECURITY: OTP brute-force lockout. After MAX_ATTEMPTS (5) wrong codes the
// phone's code is locked, and even the CORRECT code is refused while locked.
//
// Note: /api/auth/otp/verify is itself per-IP rate-limited (5/60s). To exercise
// the *code lockout* (not the IP limiter) we send each verify from a UNIQUE IP,
// so the only throttle in play is the attempts counter on the OTP record.
import { describe, it, expect } from 'vitest';
import { api } from '../helpers';

describe('OTP brute-force lockout', () => {
  it('locks after 5 wrong codes and refuses the correct code while locked', async () => {
    const startIp = '198.51.104.1';
    const phone = '+919822222333';

    const start = await api('/api/auth/otp/start', {
      method: 'POST',
      body: { phone, countryCode: '+91' },
      headers: { 'cf-connecting-ip': startIp }
    });
    expect(start.status).toBe(200);
    const { devCode } = await start.json<{ ok: boolean; devCode: string }>();
    expect(devCode).toBeTruthy();

    // A wrong 6-digit code that is guaranteed != devCode.
    const wrong = devCode === '000000' ? '111111' : '000000';

    // 5 wrong attempts: attemptsLeft decreases 4,3,2,1,0.
    const expectedLeft = [4, 3, 2, 1, 0];
    for (let i = 0; i < 5; i++) {
      const res = await api('/api/auth/otp/verify', {
        method: 'POST',
        body: { phone, countryCode: '+91', code: wrong },
        headers: { 'cf-connecting-ip': `198.51.105.${i + 1}` } // unique IP per call
      });
      expect(res.status).toBe(401);
      const body = await res.json<{ error: string; attemptsLeft: number }>();
      expect(body.error).toBe('invalid_code');
      expect(body.attemptsLeft).toBe(expectedLeft[i]);
    }

    // 6th attempt (attempts already at MAX) → code is now locked.
    const locked = await api('/api/auth/otp/verify', {
      method: 'POST',
      body: { phone, countryCode: '+91', code: wrong },
      headers: { 'cf-connecting-ip': '198.51.106.1' }
    });
    expect(locked.status).toBe(400);
    expect((await locked.json<{ error: string }>()).error).toBe('locked');

    // Even the CORRECT devCode is refused while locked.
    const correctButLocked = await api('/api/auth/otp/verify', {
      method: 'POST',
      body: { phone, countryCode: '+91', code: devCode },
      headers: { 'cf-connecting-ip': '198.51.106.2' }
    });
    expect(correctButLocked.status).toBe(400);
    expect((await correctButLocked.json<{ error: string }>()).error).toBe('locked');
  });
});
