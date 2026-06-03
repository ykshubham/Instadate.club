import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { api, count } from '../helpers';

// Phone OTP sign-in: POST /api/auth/otp/start then /verify.
// The test env has no SMS_PROVIDER, so the console provider returns devCode.
// Each test uses a UNIQUE cf-connecting-ip to avoid the 5/60s per-IP auth limit
// bleeding across tests, and a UNIQUE phone so per-phone state is isolated.
describe('POST /api/auth/otp/start', () => {
  it('invalid phone → 400 { error: invalid_phone }', async () => {
    const res = await api('/api/auth/otp/start', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '10.1.0.1' },
      body: { phone: '123', countryCode: '+91' }
    });
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe('invalid_phone');
  });

  it('valid phone → 200 { ok: true, devCode }', async () => {
    const res = await api('/api/auth/otp/start', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '10.1.0.2' },
      body: { phone: '9876500002', countryCode: '+91' }
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean; devCode?: string }>();
    expect(body.ok).toBe(true);
    expect(body.devCode).toMatch(/^\d{6}$/);
  });
});

describe('POST /api/auth/otp/verify', () => {
  it('wrong code → 401 { error: invalid_code, attemptsLeft }', async () => {
    const phone = '9876500010';
    const start = await api('/api/auth/otp/start', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '10.1.0.3' },
      body: { phone, countryCode: '+91' }
    });
    expect(start.status).toBe(200);

    const res = await api('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '10.1.0.3' },
      body: { phone, countryCode: '+91', code: '000000' }
    });
    expect(res.status).toBe(401);
    const body = await res.json<{ error: string; attemptsLeft: number }>();
    expect(body.error).toBe('invalid_code');
    expect(body.attemptsLeft).toBe(4);
  });

  it('correct devCode → 200, set-cookie + user, new phone user row', async () => {
    const phone = '9876500020';
    const start = await api('/api/auth/otp/start', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '10.1.0.4' },
      body: { phone, countryCode: '+91' }
    });
    const { devCode } = await start.json<{ devCode: string }>();
    expect(devCode).toMatch(/^\d{6}$/);

    const res = await api('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '10.1.0.4' },
      body: { phone, countryCode: '+91', code: devCode }
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toBeTruthy();
    const body = await res.json<{ user: { id: string } | null }>();
    expect(body.user?.id).toBeTruthy();

    // A users row with auth_provider 'phone' now exists.
    const n = await count(
      "SELECT COUNT(*) AS n FROM users WHERE id = ? AND auth_provider = 'phone'",
      body.user!.id
    );
    expect(n).toBe(1);
  });
});
