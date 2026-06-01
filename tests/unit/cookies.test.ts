import { describe, it, expect } from 'vitest';
import {
  getCookie,
  sessionCookie,
  clearSessionCookie,
  base64UrlEncode
} from '../../worker/auth';

describe('getCookie', () => {
  it('extracts a named cookie from a multi-value Cookie header', () => {
    const req = new Request('https://x/', {
      headers: { cookie: 'a=1; instadate_session=abc; b=2' }
    });
    expect(getCookie(req, 'instadate_session')).toBe('abc');
    expect(getCookie(req, 'a')).toBe('1');
    expect(getCookie(req, 'b')).toBe('2');
  });

  it('returns undefined for a missing cookie name', () => {
    const req = new Request('https://x/', {
      headers: { cookie: 'a=1; instadate_session=abc; b=2' }
    });
    expect(getCookie(req, 'nope')).toBeUndefined();
  });

  it('returns undefined when no Cookie header is present', () => {
    const req = new Request('https://x/');
    expect(getCookie(req, 'instadate_session')).toBeUndefined();
  });
});

describe('sessionCookie', () => {
  it('emits all required attributes for an https request (incl. Secure)', () => {
    const req = new Request('https://x/');
    const c = sessionCookie(req, 'sid123');
    expect(c).toContain('instadate_session=sid123');
    expect(c).toContain('Path=/');
    expect(c).toContain('HttpOnly');
    expect(c).toContain('SameSite=Lax');
    expect(c).toContain('Max-Age=2592000');
    expect(c).toContain('; Secure');
  });

  it('omits Secure for an http (non-TLS) request', () => {
    const req = new Request('http://x/');
    const c = sessionCookie(req, 'sid123');
    expect(c).toContain('instadate_session=sid123');
    expect(c).toContain('Max-Age=2592000');
    expect(c).not.toContain('Secure');
  });
});

describe('clearSessionCookie', () => {
  it('emits an expiring HttpOnly cookie', () => {
    const req = new Request('https://x/');
    const c = clearSessionCookie(req);
    expect(c).toContain('instadate_session=');
    expect(c).toContain('Max-Age=0');
    expect(c).toContain('HttpOnly');
  });

  it('includes Secure on https and omits it on http', () => {
    expect(clearSessionCookie(new Request('https://x/'))).toContain('; Secure');
    expect(clearSessionCookie(new Request('http://x/'))).not.toContain('Secure');
  });
});

describe('base64UrlEncode', () => {
  it('produces url-safe output with no +, /, or = characters', () => {
    const out = base64UrlEncode(new Uint8Array([255, 254, 253]));
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toContain('+');
    expect(out).not.toContain('/');
    expect(out).not.toContain('=');
  });

  it('accepts an ArrayBuffer as well as a Uint8Array', () => {
    const buf = new Uint8Array([1, 2, 3]).buffer;
    const out = base64UrlEncode(buf);
    expect(out.length).toBeGreaterThan(0);
  });
});
