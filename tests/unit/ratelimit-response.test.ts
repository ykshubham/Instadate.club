import { describe, it, expect } from 'vitest';
import { rateLimitResponse } from '../../worker/services/ratelimit';

describe('rateLimitResponse', () => {
  it('builds a compliant 429 response with rate-limit headers', async () => {
    const result = { allowed: false, limit: 5, remaining: 0, resetAt: Date.now() + 60_000 };
    const res = rateLimitResponse(result);

    expect(res.status).toBe(429);

    const retryAfter = Number(res.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThanOrEqual(1);

    expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy();

    const body = await res.json();
    expect(body.error).toBe('too_many_requests');
  });

  it('clamps Retry-After to at least 1 even when the window has already elapsed', () => {
    const result = { allowed: false, limit: 3, remaining: 0, resetAt: Date.now() - 10_000 };
    const res = rateLimitResponse(result);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThanOrEqual(1);
  });

  it('exposes the reset timestamp in seconds in the body and header', async () => {
    const resetAt = Date.now() + 120_000;
    const res = rateLimitResponse({ allowed: false, limit: 10, remaining: 0, resetAt });
    const expectedSeconds = String(Math.ceil(resetAt / 1000));
    expect(res.headers.get('X-RateLimit-Reset')).toBe(expectedSeconds);
    const body = await res.json();
    expect(body.reset).toBe(Math.ceil(resetAt / 1000));
  });
});
