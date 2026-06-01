// worker/services/moderation.ts
// Account status mutations (Sprint 1, Task 4) + reports/moderation queue (Task 7).

import type { D1Database } from '@cloudflare/workers-types';

export type AccountStatus = 'active' | 'suspended' | 'banned' | 'deactivated';
const VALID: ReadonlySet<string> = new Set(['active', 'suspended', 'banned', 'deactivated']);

export interface SetStatusResult {
  ok: boolean;
  error?: string;
}

/**
 * Set a user's account status. Used by moderation/admin tooling.
 * - suspended: keep sessions so the user sees the suspension screen (reads allowed, writes 403).
 * - banned: keep session so the ban screen renders; all API access is 403 via requireAuthedActive.
 * - active: clears reason/until (reinstate).
 */
export async function setAccountStatus(
  db: D1Database,
  targetUserId: string,
  status: string,
  reason?: string | null,
  until?: string | null
): Promise<SetStatusResult> {
  if (!VALID.has(status)) return { ok: false, error: 'invalid_status' };

  const existing = await db.prepare('SELECT id FROM users WHERE id = ?').bind(targetUserId).first<{ id: string }>();
  if (!existing) return { ok: false, error: 'user_not_found' };

  await db.prepare(
    `UPDATE users
        SET status = ?,
            status_reason = ?,
            status_until = ?,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
  ).bind(
    status,
    status === 'active' ? null : (reason ?? null),
    status === 'suspended' ? (until ?? null) : null,
    targetUserId
  ).run();

  return { ok: true };
}

// --- Reports / moderation queue (Task 7) ---

const REPORT_TYPES: ReadonlySet<string> = new Set(['user', 'message', 'event']);
const REPORT_STATUSES: ReadonlySet<string> = new Set(['open', 'reviewing', 'actioned', 'dismissed']);

export interface ReportResult {
  ok: boolean;
  error?: string;
  reportId?: string;
}

export async function createReport(
  db: D1Database,
  reporterUserId: string,
  targetType: string,
  targetId: string,
  reason: string,
  details?: string | null
): Promise<ReportResult> {
  if (!REPORT_TYPES.has(targetType)) return { ok: false, error: 'invalid_target_type' };
  if (!targetId) return { ok: false, error: 'target_id_required' };
  if (!reason || !reason.trim()) return { ok: false, error: 'reason_required' };
  if (targetType === 'user' && targetId === reporterUserId) return { ok: false, error: 'cannot_report_self' };

  const reportId = `rp-${crypto.randomUUID()}`;
  await db.prepare(
    `INSERT INTO reports (id, reporter_user_id, target_type, target_id, reason, details, status)
     VALUES (?, ?, ?, ?, ?, ?, 'open')`
  ).bind(reportId, reporterUserId, targetType, targetId, reason.trim().slice(0, 120), (details || '').slice(0, 1000) || null).run();

  return { ok: true, reportId };
}

/** Moderation queue listing (admin). Optional status filter. */
export async function listReports(db: D1Database, status?: string) {
  const useFilter = status && REPORT_STATUSES.has(status);
  const query = `
    SELECT r.*, 
           ru.full_name AS reporter_name,
           CASE r.target_type
             WHEN 'user' THEN (SELECT full_name FROM profiles WHERE user_id = r.target_id)
             WHEN 'event' THEN (SELECT title FROM events WHERE id = r.target_id)
             WHEN 'message' THEN (SELECT body FROM chat_messages WHERE id = r.target_id)
             ELSE NULL
           END AS target_name
    FROM reports r 
    LEFT JOIN users ru ON ru.id = r.reporter_user_id
    ${useFilter ? 'WHERE r.status = ?' : ''} 
    ORDER BY r.created_at DESC LIMIT 200
  `;
  const stmt = useFilter ? db.prepare(query).bind(status) : db.prepare(query);
  const { results } = await stmt.all<any>();
  return results;
}

export async function resolveReport(
  db: D1Database,
  adminUserId: string,
  reportId: string,
  status: string
): Promise<ReportResult> {
  if (!REPORT_STATUSES.has(status)) return { ok: false, error: 'invalid_status' };
  const existing = await db.prepare('SELECT id FROM reports WHERE id = ?').bind(reportId).first<{ id: string }>();
  if (!existing) return { ok: false, error: 'not_found' };
  await db.prepare(
    `UPDATE reports SET status = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(status, adminUserId, reportId).run();
  return { ok: true, reportId };
}
