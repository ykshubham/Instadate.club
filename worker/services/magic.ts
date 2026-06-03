// worker/services/magic.ts
// Email Magic Link authentication (Sprint 2 Task 2 — AUTH-BE-05/09).
//
// Flow:  startMagicLink(email, requestUrl) -> generate secure token, hash+store in email_login_tokens,
//                                            return devLink if development.
//        verifyMagicLink(token) -> check hash/expiry/consumed, register/login user,
//                                  ensure profile, update email_verified = 1,
//                                  create session cookie.
//
// Policy:  15-min expiry · single-use token (consumed_at marker)
//

import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '../index';
import { hashToken, randomToken, sessionCookie } from '../auth';
import { logEvent } from './analytics';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface MagicStartResult {
  ok: boolean;
  error?: string;
  devLink?: string;
}

export interface MagicVerifyResult {
  ok: boolean;
  error?: string;
  userId?: string;
  setCookie?: string;
}

function parseTs(ts: string | null | undefined): number {
  if (!ts) return 0;
  const normalized = ts.includes('T') ? ts : ts.replace(' ', 'T');
  const zoned = /[zZ]|[+-]\d\d:?\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
  return Date.parse(zoned) || 0;
}

/** Generate a magic link and store the hashed token in D1. */
export async function startMagicLink(
  env: Env,
  email: string,
  requestUrl: string
): Promise<MagicStartResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, error: 'invalid_email' };
  }

  const token = randomToken('magic-');
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  // Store token hash in the database
  await env.DB.prepare(
    `INSERT INTO email_login_tokens (token_hash, email, expires_at, consumed_at)
     VALUES (?, ?, ?, NULL)`
  ).bind(tokenHash, normalizedEmail, expiresAt).run();

  // Construct magic link URL redirecting to the backend callback
  const url = new URL(requestUrl);
  const magicLink = `${url.origin}/api/auth/magic/callback?token=${token}`;

  // Log in development/console for ease of access
  console.log(`[MAGIC LINK] Login magic link for ${normalizedEmail}: ${magicLink}`);

  return {
    ok: true,
    devLink: env.ENVIRONMENT === 'development' ? magicLink : undefined
  };
}

/** Verify a magic link token, consume it, and sign in/register the user. */
export async function verifyMagicLink(
  env: Env,
  request: Request,
  token: string
): Promise<MagicVerifyResult> {
  if (!token) return { ok: false, error: 'invalid_token' };

  const tokenHash = await hashToken(token);
  const row = await env.DB.prepare(
    'SELECT email, expires_at, consumed_at FROM email_login_tokens WHERE token_hash = ?'
  ).bind(tokenHash).first<{ email: string; expires_at: string; consumed_at: string | null }>();

  if (!row) {
    return { ok: false, error: 'invalid_token' };
  }

  if (row.consumed_at) {
    return { ok: false, error: 'consumed' };
  }

  const now = Date.now();
  if (parseTs(row.expires_at) < now) {
    return { ok: false, error: 'expired' };
  }

  // Success — consume the token
  await env.DB.prepare(
    'UPDATE email_login_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE token_hash = ?'
  ).bind(tokenHash).run();

  const email = row.email;
  let userId: string;

  // Check if a user with this email already exists
  const existingUser = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first<{ id: string }>();

  if (existingUser) {
    userId = existingUser.id;
    await env.DB.prepare(
      `UPDATE users
          SET email_verified = 1,
              auth_provider = 'email',
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
    ).bind(userId).run();
  } else {
    userId = `user-${crypto.randomUUID()}`;
    await env.DB.prepare(
      `INSERT INTO users (id, email, full_name, email_verified, auth_provider, completed, profile_json)
       VALUES (?, ?, '', 1, 'email', 0, '{}')`
    ).bind(userId, email).run();
  }

  // Ensure the user has a profile record
  const existingProfile = await env.DB.prepare(
    'SELECT user_id FROM profiles WHERE user_id = ?'
  ).bind(userId).first();

  if (!existingProfile) {
    await env.DB.prepare(
      `INSERT INTO profiles (
        user_id, full_name, age, instagram, city, whatsapp, gender, profession, college,
        intent, weekend_status, bio, vibe, plan, completed, profile_latitude, profile_longitude
      ) VALUES (?, '', '', '', '', '', '', '', '', '', '', '', '', 'Instadate Plus', 0, NULL, NULL)`
    ).bind(userId).run();
  }

  // Keep trust_metrics in sync
  const existingMetrics = await env.DB.prepare(
    'SELECT user_id FROM trust_metrics WHERE user_id = ?'
  ).bind(userId).first();

  if (!existingMetrics) {
    await env.DB.prepare(
      `INSERT INTO trust_metrics (user_id, attendance_score, no_show_count, attended_count, verification_score, is_verified, response_rate, response_time_seconds, trust_score)
       VALUES (?, 100.0, 0, 0, 50.0, 1, 100.0, 300, 90.0)`
    ).bind(userId).run();
  } else {
    await env.DB.prepare(
      "UPDATE trust_metrics SET is_verified = 1, verification_score = MAX(verification_score, 50.0), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
    ).bind(userId).run();
  }

  await logEvent(env.DB, {
    user_id: userId,
    event_name: 'magic_link_verified',
    entity_type: 'user',
    entity_id: userId
  });

  // Create a new session
  const sessionId = randomToken('sess-');
  await env.DB.prepare(
    'INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, datetime(CURRENT_TIMESTAMP, ?))'
  ).bind(sessionId, userId, '+30 days').run();

  return {
    ok: true,
    userId,
    setCookie: sessionCookie(request, sessionId)
  };
}
