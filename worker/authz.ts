// worker/authz.ts
// Authorization gates applied at the API dispatch boundary (Sprint 1, AUTH-BE-03).
// Pure functions; no circular import on index.ts.

import type { Env } from './index';
import type { Principal } from './auth';
import { clearSessionCookie } from './auth';

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { ...jsonHeaders, ...(init.headers || {}) }
  });
}

type Gate = { ok: true; userId: string } | { ok: false; response: Response };

/**
 * Require an authenticated, non-blocked account.
 * - Guest -> 401 (clears any stale cookie)
 * - banned -> 403 always
 * - deactivated -> 403 always (account in deletion grace)
 * - suspended -> 403 on writes only (reads allowed)
 */
export function requireAuthedActive(principal: Principal, request: Request): Gate {
  if (principal.kind !== 'user' || !principal.userId) {
    return {
      ok: false,
      response: json({ error: 'Authentication required' }, {
        status: 401,
        headers: { 'set-cookie': clearSessionCookie(request) }
      })
    };
  }

  if (principal.status === 'banned') {
    return { ok: false, response: json({ error: 'account_banned' }, { status: 403 }) };
  }
  if (principal.status === 'deactivated') {
    return { ok: false, response: json({ error: 'account_deactivated' }, { status: 403 }) };
  }
  if (principal.status === 'suspended' && request.method !== 'GET') {
    return { ok: false, response: json({ error: 'account_suspended' }, { status: 403 }) };
  }

  return { ok: true, userId: principal.userId };
}

/** Profile must be published (completed) before discovery-affecting writes. */
export async function isPublished(env: Env, userId: string): Promise<boolean> {
  const row = await env.DB.prepare('SELECT completed FROM profiles WHERE user_id = ?')
    .bind(userId).first<{ completed: number }>();
  return Boolean(row?.completed);
}

/** Phone/identity verified gate (for hosting / messaging policies). */
export async function isVerified(env: Env, userId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    "SELECT verification_level FROM profiles WHERE user_id = ?"
  ).bind(userId).first<{ verification_level: string }>();
  return Boolean(row?.verification_level && row.verification_level !== 'none');
}

/**
 * Gate: action requires a published (completed) profile.
 * Returns a 403 Response to short-circuit, or null to proceed.
 */
export async function requirePublished(env: Env, userId: string): Promise<Response | null> {
  if (await isPublished(env, userId)) return null;
  return json(
    { error: 'profile_incomplete', message: 'Complete your profile to use this feature.' },
    { status: 403 }
  );
}

/**
 * Gate: action requires a verified profile (verification_level != 'none').
 * Policy-controlled — currently applied to event hosting only.
 * Returns a 403 Response to short-circuit, or null to proceed.
 */
export async function requireVerified(env: Env, userId: string): Promise<Response | null> {
  if (await isVerified(env, userId)) return null;
  return json(
    { error: 'verification_required', message: 'Verify your profile to host events.' },
    { status: 403 }
  );
}
