// worker/auth.ts
// Session, cookie, and crypto primitives + principal resolution.
// Moved out of index.ts (Sprint 1, AUTH-BE-01/02). index.ts re-imports these names.

import type { Env } from './index';

export const SESSION_COOKIE = 'instadate_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30d absolute / sliding window

export type AccountStatus = 'active' | 'suspended' | 'banned' | 'deactivated';

export interface Principal {
  kind: 'user' | 'guest';
  userId: string | null;
  sessionId: string | null;
  status: AccountStatus | null;
}

// --- Cookies ---
export function getCookie(request: Request, name: string) {
  const cookie = request.headers.get('cookie') || '';
  return cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function cookieSecurityAttribute(request: Request) {
  return new URL(request.url).protocol === 'https:' ? '; Secure' : '';
}

export function sessionCookie(request: Request, sessionId: string) {
  return `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly${cookieSecurityAttribute(request)}; SameSite=Lax`;
}

export function clearSessionCookie(request: Request) {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly${cookieSecurityAttribute(request)}; SameSite=Lax`;
}

// --- Crypto helpers ---
export function base64UrlEncode(bytes: ArrayBuffer | Uint8Array) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256(value: string) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
}

export function randomToken(prefix = '') {
  return `${prefix}${base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)))}`;
}

/** Hash a token for at-rest storage (oauth state, otp, magic-link). */
export async function hashToken(value: string) {
  return base64UrlEncode(await sha256(value));
}

/**
 * Validate a post-login redirect target against an open-redirect.
 * Only same-origin absolute PATHS are allowed: must start with a single '/'
 * and NOT with '//' or '/\' (protocol-relative → external host). Anything
 * else (absolute URL, backslash trick, empty) falls back to '/profile'.
 */
export function safeRedirect(target: string | null | undefined, fallback = '/profile'): string {
  if (!target || typeof target !== 'string') return fallback;
  if (target[0] !== '/') return fallback;            // must be an absolute path
  if (target[1] === '/' || target[1] === '\\') return fallback; // //evil.com or /\evil.com
  return target;
}

// --- Principal resolution (replaces authenticatedUserIdFrom backdoor) ---
//
// A request with no valid session is a GUEST: userId is ALWAYS null.
// No environment or HTTP-method ever maps an unauthenticated request to a real user.
export async function resolvePrincipal(request: Request, env: Env): Promise<Principal> {
  const sessionId = getCookie(request, SESSION_COOKIE);
  if (!sessionId) {
    return { kind: 'guest', userId: null, sessionId: null, status: null };
  }

  const row = await env.DB.prepare(
    `SELECT s.id AS sid, u.id AS uid, COALESCE(u.status, 'active') AS status
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP`
  ).bind(sessionId).first<{ sid: string; uid: string; status: string }>();

  if (!row?.uid) {
    return { kind: 'guest', userId: null, sessionId: null, status: null };
  }

  // Sliding refresh: extend expiry + last_seen without rotating the id (cheap, no Set-Cookie needed).
  await touchSession(env, row.sid, request);

  return {
    kind: 'user',
    userId: row.uid,
    sessionId: row.sid,
    status: (row.status as AccountStatus) || 'active'
  };
}

async function touchSession(env: Env, sessionId: string, request: Request) {
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  const device = (request.headers.get('user-agent') || '').slice(0, 200);
  try {
    await env.DB.prepare(
      'UPDATE auth_sessions SET expires_at = ?, last_seen = CURRENT_TIMESTAMP, device = COALESCE(device, ?) WHERE id = ?'
    ).bind(expires, device, sessionId).run();
  } catch {
    // Non-fatal: sliding refresh is best-effort.
  }
}
