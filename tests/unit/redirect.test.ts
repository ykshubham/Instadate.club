import { describe, it, expect } from 'vitest';
import { safeRedirect } from '../../worker/auth';

describe('safeRedirect', () => {
  it('allows a simple absolute path', () => {
    expect(safeRedirect('/profile')).toBe('/profile');
  });

  it('preserves an absolute path with sub-segments and query string', () => {
    expect(safeRedirect('/a/b?x=1')).toBe('/a/b?x=1');
  });

  it('rejects a protocol-relative // host (open redirect)', () => {
    expect(safeRedirect('//evil.com')).toBe('/profile');
  });

  it('rejects the slash-backslash trick /\\evil.com', () => {
    expect(safeRedirect('/\\evil.com')).toBe('/profile');
  });

  it('rejects an absolute external URL', () => {
    expect(safeRedirect('https://evil.com')).toBe('/profile');
  });

  it('rejects a path missing the leading slash', () => {
    expect(safeRedirect('profile')).toBe('/profile');
  });

  it('falls back for empty, null, and undefined', () => {
    expect(safeRedirect('')).toBe('/profile');
    expect(safeRedirect(null)).toBe('/profile');
    expect(safeRedirect(undefined)).toBe('/profile');
  });

  it('uses a custom fallback when provided', () => {
    expect(safeRedirect('//evil.com', '/home')).toBe('/home');
    expect(safeRedirect(null, '/home')).toBe('/home');
  });
});
