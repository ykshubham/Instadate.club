// SECURITY: the session cookie set on login must be hardened —
// HttpOnly (no JS access), SameSite=Lax (CSRF mitigation), Secure (https only),
// and scoped to Path=/.
import { describe, it, expect } from 'vitest';
import { api } from '../helpers';

describe('session cookie hardening', () => {
  it('OTP verify sets an HttpOnly, SameSite=Lax, Secure, Path=/ cookie', async () => {
    const ip = '198.51.100.50';
    const phone = '+919800000001';

    const start = await api('/api/auth/otp/start', {
      method: 'POST',
      body: { phone, countryCode: '+91' },
      headers: { 'cf-connecting-ip': ip }
    });
    expect(start.status).toBe(200);
    const { devCode } = await start.json<{ ok: boolean; devCode: string }>();
    expect(devCode).toBeTruthy();

    const verify = await api('/api/auth/otp/verify', {
      method: 'POST',
      body: { phone, countryCode: '+91', code: devCode },
      headers: { 'cf-connecting-ip': ip }
    });
    expect(verify.status).toBe(200);

    const setCookie = verify.headers.get('set-cookie') || '';
    expect(setCookie).toContain('instadate_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Secure'); // request origin is https://example.com
    expect(setCookie).toContain('Path=/');
  });
});
