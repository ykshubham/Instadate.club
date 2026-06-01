import type { D1Database } from '@cloudflare/workers-types';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp in ms
}

/**
 * Asserts whether a request is allowed under a given rate limiting rule.
 *
 * Atomic single-statement fixed-window algorithm. The entire read-modify-write
 * is collapsed into one `INSERT ... ON CONFLICT(key) DO UPDATE ... RETURNING`
 * round-trip, so concurrent requests can no longer both observe count<limit and
 * both pass (the previous SELECT-then-UPDATE pattern allowed over-admission).
 *
 * Window-expiry is decided inside the SQL via CASE expressions comparing the
 * existing row's `reset_at` against the current time (both passed as bind params
 * for determinism):
 *   - no row, or the stored window has expired (reset_at <= now): start a fresh
 *     window with count=1 and reset_at=now+windowSeconds*1000.
 *   - otherwise: increment count by 1 and leave reset_at unchanged.
 *
 * The upsert always increments, so an over-limit request still bumps the counter.
 * For a fixed-window limiter that is acceptable (it merely extends the lockout
 * within the same window); we deliberately do NOT issue a second statement to
 * decrement, keeping this to exactly one round-trip. Expired rows are reclaimed
 * lazily on the next hit for the same key and pruned in bulk by `pruneRateLimits`
 * (a cron job), not on the hot path.
 */
export async function checkRateLimit(
  db: D1Database,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const newReset = now + windowSeconds * 1000;

  const returned = await db
    .prepare(
      `INSERT INTO rate_limits (key, count, reset_at)
       VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN rate_limits.reset_at <= ? THEN 1 ELSE rate_limits.count + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= ? THEN ? ELSE rate_limits.reset_at END
       RETURNING count, reset_at`
    )
    .bind(key, newReset, now, now, newReset)
    .first<{ count: number; reset_at: number }>();

  // RETURNING on an upsert always yields a row; guard defensively for the types.
  const count = returned?.count ?? 1;
  const resetAt = returned?.reset_at ?? newReset;

  if (count > limit) {
    return { allowed: false, limit, remaining: 0, resetAt };
  }

  return { allowed: true, limit, remaining: limit - count, resetAt };
}

/**
 * Bulk-prunes expired rate-limit buckets. Intended to be invoked from a cron
 * job, replacing the per-request full-table delete that used to run on the hot
 * path. Never throws: failures are logged so a transient DB error cannot break
 * the scheduled task.
 */
export async function pruneRateLimits(db: D1Database): Promise<void> {
  try {
    await db.prepare('DELETE FROM rate_limits WHERE reset_at <= ?').bind(Date.now()).run();
  } catch (err) {
    console.error('pruneRateLimits failed', err);
  }
}

/**
 * Utility helper to construct a standardized, compliant 429 Too Many Requests response.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: 'too_many_requests',
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      limit: result.limit,
      remaining: result.remaining,
      reset: Math.ceil(result.resetAt / 1000)
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000))
      }
    }
  );
}
