import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { count } from '../helpers';
import { checkRateLimit, pruneRateLimits } from '../../worker/services/ratelimit';

describe('ratelimit.checkRateLimit', () => {
  it('allows the first N calls then rejects N+1 with remaining 0', async () => {
    const key = 'rl-basic';
    const limit = 3;
    const r1 = await checkRateLimit(env.DB, key, limit, 60);
    const r2 = await checkRateLimit(env.DB, key, limit, 60);
    const r3 = await checkRateLimit(env.DB, key, limit, 60);
    const r4 = await checkRateLimit(env.DB, key, limit, 60);

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it('resets the window after the bucket expires', async () => {
    const key = 'rl-reset';
    await checkRateLimit(env.DB, key, 2, 60);
    await checkRateLimit(env.DB, key, 2, 60);
    const blocked = await checkRateLimit(env.DB, key, 2, 60);
    expect(blocked.allowed).toBe(false);

    // Manually expire the bucket.
    await env.DB.prepare('UPDATE rate_limits SET reset_at = 1 WHERE key = ?').bind(key).run();

    const afterReset = await checkRateLimit(env.DB, key, 2, 60);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1); // count reset to 1
    const row = await env.DB.prepare('SELECT count FROM rate_limits WHERE key = ?').bind(key).first<{ count: number }>();
    expect(row?.count).toBe(1);
  });

  it('pruneRateLimits deletes rows whose reset_at <= now', async () => {
    await env.DB.prepare('INSERT INTO rate_limits (key, count, reset_at) VALUES (?, ?, ?)')
      .bind('rl-expired', 5, 1).run();
    await env.DB.prepare('INSERT INTO rate_limits (key, count, reset_at) VALUES (?, ?, ?)')
      .bind('rl-fresh', 1, Date.now() + 600000).run();

    await pruneRateLimits(env.DB);

    expect(await count('SELECT COUNT(*) AS n FROM rate_limits WHERE key = ?', 'rl-expired')).toBe(0);
    expect(await count('SELECT COUNT(*) AS n FROM rate_limits WHERE key = ?', 'rl-fresh')).toBe(1);
  });

  it('atomicity smoke: ~20 concurrent calls admit at most `limit`', async () => {
    const key = 'rl-concurrent';
    const limit = 5;
    const results = await Promise.all(
      Array.from({ length: 20 }, () => checkRateLimit(env.DB, key, limit, 60))
    );
    const allowed = results.filter(r => r.allowed).length;
    expect(allowed).toBeLessThanOrEqual(limit); // no over-admission
    expect(allowed).toBeGreaterThan(0);
  });
});
