// worker/services/otp.ts
// Phone OTP authentication (Sprint 2 Task 1 — AUTH-BE-06/09).
//
// Flow:  startOtp(phone)  -> generate 6-digit code, hash+store, SMS via provider
//        verifyOtp(phone, code) -> check hash/expiry/attempts, link/create user,
//                                  set profiles.phone_verified=1, bump verification_level,
//                                  create a session.
//
// Policy:  6-digit code · 5-min expiry · 5 wrong attempts -> lock that code
//          30s resend cooldown · 3 sends per rolling hour per phone
//          per-IP fixed window: 10 sends / hour
//
// Storage reuses phone_otps (PK phone_e164) from 0012 + columns from 0016.
// No KV/DO binding exists in this project, so all counters are D1-backed.

import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '../index';
import { hashToken, randomToken, sessionCookie } from '../auth';
import { getSmsProvider } from './sms';

const CODE_TTL_MS = 5 * 60 * 1000;        // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000;     // 30 seconds
const MAX_SENDS_PER_HOUR = 3;             // per phone
const MAX_IP_SENDS_PER_HOUR = 10;         // per IP
const MAX_ATTEMPTS = 5;                   // wrong-code attempts before lockout
const HOUR_MS = 60 * 60 * 1000;

export interface OtpStartResult {
  ok: boolean;
  error?: string;
  retryAfterSec?: number;
  devCode?: string;        // only populated in dev (console provider) for QA
}

export interface OtpVerifyResult {
  ok: boolean;
  error?: string;
  attemptsLeft?: number;
  userId?: string;
  setCookie?: string;
}

/** Normalise to E.164. Accepts a raw national number + country code, or a pre-formatted +.. string. */
export function normalizePhone(rawPhone: string, countryCode = '+91'): string | null {
  if (!rawPhone) return null;
  let p = rawPhone.replace(/[^\d+]/g, '');
  if (!p.startsWith('+')) {
    const cc = countryCode.replace(/[^\d+]/g, '');
    p = (cc.startsWith('+') ? cc : `+${cc}`) + p.replace(/^0+/, '');
  }
  // E.164: + followed by 8–15 digits.
  return /^\+\d{8,15}$/.test(p) ? p : null;
}

function genCode(): string {
  // 6 digits, uniform, no modulo bias concern at this size.
  return String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
}

/**
 * Parse a timestamp to a UTC epoch, tolerating both formats we store:
 *   - SQLite CURRENT_TIMESTAMP / datetime(): 'YYYY-MM-DD HH:MM:SS' (UTC, no zone marker)
 *   - JS toISOString():                      'YYYY-MM-DDTHH:MM:SS.sssZ' (already zoned)
 * Returns 0 on anything unparseable. Critical: appending 'Z' to an already-zoned
 * ISO string yields '..ZZ' → NaN, which previously made every code read as expired.
 */
function parseTs(ts: string | null | undefined): number {
  if (!ts) return 0;
  const normalized = ts.includes('T') ? ts : ts.replace(' ', 'T');
  const zoned = /[zZ]|[+-]\d\d:?\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
  return Date.parse(zoned) || 0;
}

/** Per-IP fixed-window limiter using auth_rate_limits. Returns true if the call is allowed. */
async function allowIp(db: D1Database, ip: string, limit: number, windowMs: number): Promise<boolean> {
  if (!ip) return true;
  const key = `otp_ip:${ip}`;
  const now = Date.now();
  const row = await db.prepare('SELECT count, window_started_at FROM auth_rate_limits WHERE bucket_key = ?')
    .bind(key).first<{ count: number; window_started_at: string }>();

  if (!row) {
    await db.prepare('INSERT INTO auth_rate_limits (bucket_key, count, window_started_at) VALUES (?, 1, CURRENT_TIMESTAMP)')
      .bind(key).run();
    return true;
  }
  const started = parseTs(row.window_started_at) || now;
  if (now - started > windowMs) {
    await db.prepare('UPDATE auth_rate_limits SET count = 1, window_started_at = CURRENT_TIMESTAMP WHERE bucket_key = ?')
      .bind(key).run();
    return true;
  }
  if (row.count >= limit) return false;
  await db.prepare('UPDATE auth_rate_limits SET count = count + 1 WHERE bucket_key = ?').bind(key).run();
  return true;
}

/** Generate + send an OTP, enforcing resend cooldown, per-phone hourly cap, and per-IP cap. */
export async function startOtp(env: Env, phoneE164: string, ip: string): Promise<OtpStartResult> {
  const now = Date.now();
  const existing = await env.DB.prepare(
    'SELECT last_sent_at, send_count, window_started_at FROM phone_otps WHERE phone_e164 = ?'
  ).bind(phoneE164).first<{ last_sent_at: string | null; send_count: number; window_started_at: string | null }>();

  if (existing?.last_sent_at) {
    const since = now - parseTs(existing.last_sent_at);
    if (since < RESEND_COOLDOWN_MS) {
      return { ok: false, error: 'resend_cooldown', retryAfterSec: Math.ceil((RESEND_COOLDOWN_MS - since) / 1000) };
    }
  }

  // Per-phone rolling-hour send cap.
  let sendCount = existing?.send_count ?? 0;
  let windowStart = existing?.window_started_at ? (parseTs(existing.window_started_at) || now) : now;
  if (now - windowStart > HOUR_MS) { sendCount = 0; windowStart = now; }
  if (sendCount >= MAX_SENDS_PER_HOUR) {
    return { ok: false, error: 'too_many_requests', retryAfterSec: Math.ceil((HOUR_MS - (now - windowStart)) / 1000) };
  }

  // Per-IP cap.
  if (!(await allowIp(env.DB, ip, MAX_IP_SENDS_PER_HOUR, HOUR_MS))) {
    return { ok: false, error: 'ip_rate_limited' };
  }

  const code = genCode();
  const codeHash = await hashToken(code);
  const expiresAt = new Date(now + CODE_TTL_MS).toISOString();
  const windowStartIso = new Date(windowStart).toISOString();

  await env.DB.prepare(
    `INSERT INTO phone_otps (phone_e164, code_hash, expires_at, attempts, last_sent_at, send_count, window_started_at, locked_until)
     VALUES (?1, ?2, ?3, 0, CURRENT_TIMESTAMP, ?4, ?5, NULL)
     ON CONFLICT(phone_e164) DO UPDATE SET
       code_hash = ?2, expires_at = ?3, attempts = 0,
       last_sent_at = CURRENT_TIMESTAMP, send_count = ?4, window_started_at = ?5, locked_until = NULL`
  ).bind(phoneE164, codeHash, expiresAt, sendCount + 1, windowStartIso).run();

  const provider = getSmsProvider(env);
  const sent = await provider.sendOtp(phoneE164, code);
  if (!sent.ok) return { ok: false, error: 'sms_send_failed' };

  // Expose the code only for the dev console provider so QA can complete the loop.
  return { ok: true, devCode: provider.name === 'console' ? code : undefined };
}

/**
 * Verify a code. On success: link to an existing phone user or create one, mark the
 * profile phone-verified, upgrade verification_level, and mint a session cookie.
 */
export async function verifyOtp(env: Env, request: Request, phoneE164: string, code: string): Promise<OtpVerifyResult> {
  const row = await env.DB.prepare(
    'SELECT code_hash, expires_at, attempts, locked_until FROM phone_otps WHERE phone_e164 = ?'
  ).bind(phoneE164).first<{ code_hash: string; expires_at: string; attempts: number; locked_until: string | null }>();

  if (!row) return { ok: false, error: 'no_code' };

  const now = Date.now();
  if (row.locked_until && parseTs(row.locked_until) > now) return { ok: false, error: 'locked' };
  if (parseTs(row.expires_at) < now) return { ok: false, error: 'expired' };
  if (row.attempts >= MAX_ATTEMPTS) {
    await env.DB.prepare("UPDATE phone_otps SET locked_until = datetime(CURRENT_TIMESTAMP, '+15 minutes') WHERE phone_e164 = ?")
      .bind(phoneE164).run();
    return { ok: false, error: 'locked' };
  }

  const candidateHash = await hashToken(code);
  if (candidateHash !== row.code_hash) {
    const attempts = row.attempts + 1;
    await env.DB.prepare('UPDATE phone_otps SET attempts = ? WHERE phone_e164 = ?').bind(attempts, phoneE164).run();
    const left = Math.max(0, MAX_ATTEMPTS - attempts);
    return { ok: false, error: 'invalid_code', attemptsLeft: left };
  }

  // Success — burn the code so it can't be replayed.
  await env.DB.prepare('DELETE FROM phone_otps WHERE phone_e164 = ?').bind(phoneE164).run();

  const userId = await upsertPhoneUser(env.DB, phoneE164);
  await markPhoneVerified(env.DB, userId, phoneE164);

  const sessionId = randomToken('sess-');
  await env.DB.prepare(
    'INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, datetime(CURRENT_TIMESTAMP, ?))'
  ).bind(sessionId, userId, '+30 days').run();

  return { ok: true, userId, setCookie: sessionCookie(request, sessionId) };
}

/** Find a user by verified phone, else create a minimal phone-auth user + profile. */
async function upsertPhoneUser(db: D1Database, phoneE164: string): Promise<string> {
  const existing = await db.prepare('SELECT user_id FROM profiles WHERE phone_e164 = ?')
    .bind(phoneE164).first<{ user_id: string }>();
  if (existing?.user_id) return existing.user_id;

  const userId = `user-${crypto.randomUUID()}`;
  await db.prepare(
    `INSERT INTO users (id, email, full_name, auth_provider, completed, profile_json)
     VALUES (?, NULL, '', 'phone', 0, '{}')`
  ).bind(userId).run();
  // Minimal profile row carrying the phone; onboarding fills the rest.
  await db.prepare(
    `INSERT INTO profiles (user_id, full_name, phone_e164, phone_verified, verification_level)
     VALUES (?, '', ?, 1, 'basic')
     ON CONFLICT(user_id) DO UPDATE SET phone_e164 = excluded.phone_e164`
  ).bind(userId, phoneE164).run();
  return userId;
}

/**
 * Mark phone verified and upgrade verification_level to at least 'basic'.
 * Never downgrades a higher level (identity / highly_verified).
 */
async function markPhoneVerified(db: D1Database, userId: string, phoneE164: string): Promise<void> {
  await db.prepare(
    `UPDATE profiles
        SET phone_e164 = ?,
            phone_verified = 1,
            verification_level = CASE
              WHEN verification_level IN ('identity', 'highly_verified') THEN verification_level
              ELSE 'basic'
            END,
            updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`
  ).bind(phoneE164, userId).run();

  // Keep trust_metrics in sync (verification_score/is_verified recompute on next read).
  await db.prepare(
    "UPDATE trust_metrics SET is_verified = 1, verification_score = MAX(verification_score, 50.0), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
  ).bind(userId).run();
}
