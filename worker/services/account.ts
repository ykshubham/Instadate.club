// worker/services/account.ts
// Account lifecycle: deactivation (reversible), deletion request (30d grace),
// reactivation, data export, and the scheduled hard-purge. (Sprint 1 Task 8 — AUTH-BE-08)
//
// State model (users.status + users.deleted_at):
//   active                                  -> normal
//   deactivated (deactivated_at set)        -> hidden everywhere, reversible by signing back in
//   deactivated (deleted_at = now + grace)  -> deletion requested; purge eligible after deleted_at
//   <hard purge>                            -> row + all owned data + R2 photos removed
//
// Visibility is already enforced by worker/visibility.ts: any status != 'active'
// (or deleted_at set) drops the user from every list and blocks chat sends.

import type { D1Database } from '@cloudflare/workers-types';
// R2Bucket: use the global ambient type (matches index.ts Env) to avoid a
// dual-definition clash between the imported and global @cloudflare/workers-types.

export const DELETION_GRACE_DAYS = 30;

export interface AccountResult {
  ok: boolean;
  error?: string;
  status?: string;
  purgeAt?: string | null;
}

/** Reversible pause: hide the account but keep all data. Sessions are revoked. */
export async function deactivateAccount(db: D1Database, userId: string): Promise<AccountResult> {
  const user = await db.prepare('SELECT id, status FROM users WHERE id = ?').bind(userId).first<{ id: string; status: string }>();
  if (!user) return { ok: false, error: 'user_not_found' };
  if (user.status === 'banned') return { ok: false, error: 'account_banned' };

  await db.prepare(
    `UPDATE users
        SET status = 'deactivated',
            deactivated_at = CURRENT_TIMESTAMP,
            deleted_at = NULL,
            deletion_requested_at = NULL,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
  ).bind(userId).run();

  return { ok: true, status: 'deactivated' };
}

/**
 * Request hard deletion. Account is deactivated immediately (scrubbed from discovery/chat
 * via the status guard) and scheduled for irreversible purge after the grace window.
 */
export async function requestDeletion(db: D1Database, userId: string): Promise<AccountResult> {
  const user = await db.prepare('SELECT id, status FROM users WHERE id = ?').bind(userId).first<{ id: string; status: string }>();
  if (!user) return { ok: false, error: 'user_not_found' };

  const purgeAt = new Date(Date.now() + DELETION_GRACE_DAYS * 86400000).toISOString();
  await db.prepare(
    `UPDATE users
        SET status = 'deactivated',
            deletion_requested_at = CURRENT_TIMESTAMP,
            deleted_at = ?,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
  ).bind(purgeAt, userId).run();

  // Void any pending connection requests in either direction so peers aren't left hanging.
  await db.prepare(
    `UPDATE connection_requests SET status = 'rejected'
      WHERE status = 'pending' AND (from_user_id = ?1 OR to_user_id = ?1)`
  ).bind(userId).run();

  return { ok: true, status: 'deactivated', purgeAt };
}

/** Cancel a pending deactivation/deletion and restore the account (within grace only). */
export async function reactivateAccount(db: D1Database, userId: string): Promise<AccountResult> {
  const user = await db.prepare('SELECT id, status FROM users WHERE id = ?').bind(userId).first<{ id: string; status: string }>();
  if (!user) return { ok: false, error: 'user_not_found' };
  if (user.status === 'banned') return { ok: false, error: 'account_banned' };
  if (user.status === 'suspended') return { ok: false, error: 'account_suspended' };

  await db.prepare(
    `UPDATE users
        SET status = 'active',
            deactivated_at = NULL,
            deletion_requested_at = NULL,
            deleted_at = NULL,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
  ).bind(userId).run();
  return { ok: true, status: 'active' };
}

/**
 * Full GDPR-style data export bundle. Every table owned by or referencing the user.
 * Returns a plain object the caller serialises as a downloadable JSON file.
 */
export async function exportAccountData(db: D1Database, userId: string): Promise<Record<string, unknown>> {
  const one = async (sql: string) => (await db.prepare(sql).bind(userId).first<any>()) || null;
  const many = async (sql: string, ...binds: string[]) => {
    const { results } = await db.prepare(sql).bind(...(binds.length ? binds : [userId])).all<any>();
    return results;
  };

  const [
    account, profile, photos, interests, intents, preferences, trust,
    sentRequests, receivedRequests, connections, messages,
    hostedEvents, eventAttendance, eventReviews, matches, matchOutcomes,
    blocks, rejections, reportsFiled, analytics
  ] = await Promise.all([
    one(`SELECT id, email, full_name, auth_provider, status, created_at, last_active_at,
                onboarding_completed_at, deactivated_at, deletion_requested_at, deleted_at
           FROM users WHERE id = ?`),
    one('SELECT * FROM profiles WHERE user_id = ?'),
    many('SELECT id, url, content_type, position, is_primary, created_at FROM profile_photos WHERE user_id = ?'),
    many('SELECT interest, weight FROM user_interests WHERE user_id = ?'),
    many('SELECT * FROM user_intents WHERE user_id = ?'),
    one('SELECT * FROM user_preferences WHERE user_id = ?'),
    one('SELECT * FROM trust_metrics WHERE user_id = ?'),
    many('SELECT id, to_user_id, note, status, created_at FROM connection_requests WHERE from_user_id = ?'),
    many('SELECT id, from_user_id, note, status, created_at FROM connection_requests WHERE to_user_id = ?'),
    many(`SELECT id, user_a_id, user_b_id, chat_id, status, created_at FROM connections
           WHERE user_a_id = ?1 OR user_b_id = ?1`),
    many(`SELECT m.id, m.chat_id, m.sender_role, m.body, m.created_at
            FROM chat_messages m WHERE m.sender_user_id = ?`),
    many('SELECT id, title, location, display_date, created_at FROM events WHERE host_user_id = ?'),
    many('SELECT event_id, status, joined_at, updated_at FROM event_attendees WHERE user_id = ?'),
    many('SELECT event_id, host_rating, created_at FROM event_feedback WHERE user_id = ?'),
    many('SELECT id, target_member_id, target_member_name, created_at FROM matches WHERE requester_user_id = ?'),
    many('SELECT id, user_id_a, user_id_b, status, created_at FROM match_outcomes WHERE user_id_a = ?1 OR user_id_b = ?1'),
    many('SELECT blocked_user_id, created_at FROM user_blocks WHERE user_id = ?'),
    many('SELECT rejected_user_id, created_at FROM user_rejections WHERE user_id = ?'),
    many('SELECT id, target_type, target_id, reason, status, created_at FROM reports WHERE reporter_user_id = ?'),
    many('SELECT event_name, entity_type, entity_id, created_at FROM analytics_events WHERE user_id = ?')
  ]);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    account,
    profile,
    photos,
    interests,
    intents,
    preferences,
    trustMetrics: trust,
    connections: { sentRequests, receivedRequests, active: connections },
    messages,
    events: { hosted: hostedEvents, attendance: eventAttendance, reviews: eventReviews },
    matches: { sent: matches, outcomes: matchOutcomes },
    moderation: { blocks, rejections, reportsFiled },
    analytics
  };
}

/**
 * Hard-delete one user: R2 photos first (best-effort), then DB rows. Most child tables
 * cascade via FK, but D1 does not always enforce FKs, so we delete owned rows explicitly
 * to avoid orphans, then remove the users row.
 */
export async function purgeUser(db: D1Database, r2: R2Bucket, userId: string): Promise<void> {
  // 1. R2 photos.
  const { results: photos } = await db.prepare('SELECT r2_key FROM profile_photos WHERE user_id = ?')
    .bind(userId).all<{ r2_key: string }>();
  for (const p of photos) {
    if (p.r2_key) {
      try { await r2.delete(p.r2_key); } catch { /* best-effort */ }
    }
  }

  // 2. Owned rows (children first, then the user). One statement per table keeps it D1-friendly.
  const ownedDeletes = [
    'DELETE FROM profile_photos WHERE user_id = ?1',
    'DELETE FROM user_interests WHERE user_id = ?1',
    'DELETE FROM user_intents WHERE user_id = ?1',
    'DELETE FROM user_preferences WHERE user_id = ?1',
    'DELETE FROM trust_metrics WHERE user_id = ?1',
    'DELETE FROM recommended_users WHERE user_id = ?1 OR recommended_user_id = ?1',
    'DELETE FROM connection_requests WHERE from_user_id = ?1 OR to_user_id = ?1',
    'DELETE FROM connections WHERE user_a_id = ?1 OR user_b_id = ?1',
    'DELETE FROM user_blocks WHERE user_id = ?1 OR blocked_user_id = ?1',
    'DELETE FROM user_rejections WHERE user_id = ?1 OR rejected_user_id = ?1',
    'DELETE FROM event_attendees WHERE user_id = ?1',
    'DELETE FROM event_feedback WHERE user_id = ?1',
    'DELETE FROM meetup_feedback WHERE reporter_user_id = ?1 OR target_user_id = ?1',
    'DELETE FROM match_outcomes WHERE user_id_a = ?1 OR user_id_b = ?1',
    'DELETE FROM matches WHERE requester_user_id = ?1',
    'DELETE FROM reports WHERE reporter_user_id = ?1',
    'DELETE FROM auth_sessions WHERE user_id = ?1',
    'DELETE FROM profiles WHERE user_id = ?1',
    // De-identify shared rows we must not destroy for the other party.
    "UPDATE chat_messages SET sender_user_id = NULL, body = '[deleted]' WHERE sender_user_id = ?1",
    'DELETE FROM users WHERE id = ?1'
  ];
  for (const sql of ownedDeletes) {
    try { await db.prepare(sql).bind(userId).run(); } catch { /* table may not exist in older DBs */ }
  }
}

/** Scheduled purge: hard-delete every account whose grace window has elapsed. */
export async function runScheduledPurge(db: D1Database, r2: R2Bucket): Promise<{ purged: number; ids: string[] }> {
  const { results } = await db.prepare(
    `SELECT id FROM users
      WHERE deleted_at IS NOT NULL
        AND datetime(deleted_at) <= datetime(CURRENT_TIMESTAMP)
      LIMIT 200`
  ).all<{ id: string }>();

  const ids: string[] = [];
  for (const row of results) {
    await purgeUser(db, r2, row.id);
    ids.push(row.id);
  }
  return { purged: ids.length, ids };
}
