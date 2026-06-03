// worker/services/admin.ts
// Sprint 4 Task 3: Admin & Moderation Controls.
//
// Centralises the privileged surface: role resolution, the immutable audit log,
// the user/event moderation queries, and role grants. Routing/authz lives in
// index.ts; this module owns the data access and validation.

import type { D1Database } from '@cloudflare/workers-types';

export type Role = 'member' | 'moderator' | 'admin';
const ROLES: ReadonlySet<string> = new Set(['member', 'moderator', 'admin']);

export interface Principal {
  userId: string;
  role: Role;
  /** true when granted via the ADMIN_USER_IDS env allowlist (always full admin). */
  fromEnv: boolean;
}

export interface AdminResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

/**
 * Resolve a user's effective role. The env ADMIN_USER_IDS allowlist is a
 * break-glass super-admin (bootstraps the very first admin before any DB role
 * exists); otherwise the DB users.role column wins.
 */
export async function resolveRole(
  db: D1Database,
  userId: string,
  adminUserIdsEnv: string | undefined
): Promise<Principal> {
  const envIds = (adminUserIdsEnv || '').split(',').map(s => s.trim()).filter(Boolean);
  if (envIds.includes(userId)) {
    return { userId, role: 'admin', fromEnv: true };
  }
  const row = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first<{ role: string }>();
  const role = (row?.role && ROLES.has(row.role) ? row.role : 'member') as Role;
  return { userId, role, fromEnv: false };
}

export function isModerator(role: Role): boolean {
  return role === 'moderator' || role === 'admin';
}

export function isAdmin(role: Role): boolean {
  return role === 'admin';
}

// --- Audit log --------------------------------------------------------------

/**
 * Append one privileged action to the immutable audit log. Best-effort: a
 * logging failure must never block the action itself, so errors are swallowed
 * (mirrors analytics.logEvent).
 */
export async function recordAudit(
  db: D1Database,
  params: {
    actorUserId: string;
    action: string;
    targetType: string;
    targetId?: string | null;
    reason?: string | null;
    metadata?: Record<string, unknown> | null;
  }
): Promise<void> {
  try {
    await db.prepare(
      `INSERT INTO admin_audit_logs (id, actor_user_id, action, target_type, target_id, reason, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      `aud-${crypto.randomUUID()}`,
      params.actorUserId,
      params.action,
      params.targetType,
      params.targetId ?? null,
      params.reason ?? null,
      params.metadata ? JSON.stringify(params.metadata) : null
    ).run();
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}

/** Audit trail listing (admin). Optional filters by action and target. */
export async function listAuditLogs(
  db: D1Database,
  opts: { action?: string; targetType?: string; limit?: number } = {}
) {
  const where: string[] = [];
  const binds: unknown[] = [];
  if (opts.action) { where.push('a.action = ?'); binds.push(opts.action); }
  if (opts.targetType) { where.push('a.target_type = ?'); binds.push(opts.targetType); }
  const limit = Math.min(Math.max(Number(opts.limit) || 200, 1), 500);

  const { results } = await db.prepare(
    `SELECT a.*, u.full_name AS actor_name
       FROM admin_audit_logs a
       LEFT JOIN users u ON u.id = a.actor_user_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY a.created_at DESC
      LIMIT ?`
  ).bind(...binds, limit).all<any>();

  return results.map((r: any) => ({
    id: r.id,
    actorUserId: r.actor_user_id,
    actorName: r.actor_name || r.actor_user_id,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    reason: r.reason,
    metadata: r.metadata_json ? JSON.parse(r.metadata_json) : null,
    createdAt: r.created_at
  }));
}

// --- User moderation listing ------------------------------------------------

const USER_STATUSES: ReadonlySet<string> = new Set(['active', 'suspended', 'banned', 'deactivated']);

/**
 * Users list for the moderation console. Optional status filter + free-text
 * search over name/email. Surfaces open-report counts so moderators can triage.
 */
export async function listUsersForModeration(
  db: D1Database,
  opts: { status?: string; search?: string; limit?: number } = {}
) {
  const where: string[] = [];
  const binds: unknown[] = [];
  if (opts.status && USER_STATUSES.has(opts.status)) {
    where.push('u.status = ?');
    binds.push(opts.status);
  }
  if (opts.search && opts.search.trim()) {
    where.push('(u.full_name LIKE ? OR u.email LIKE ?)');
    const term = `%${opts.search.trim().slice(0, 60)}%`;
    binds.push(term, term);
  }
  const limit = Math.min(Math.max(Number(opts.limit) || 100, 1), 200);

  const { results } = await db.prepare(
    `SELECT u.id, u.full_name, u.email, u.avatar_url, u.role, u.status,
            u.status_reason, u.status_until, u.created_at, u.last_active_at,
            (SELECT COUNT(*) FROM reports r
              WHERE r.target_type = 'user' AND r.target_id = u.id AND r.status = 'open') AS open_reports
       FROM users u
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY open_reports DESC, u.created_at DESC
      LIMIT ?`
  ).bind(...binds, limit).all<any>();

  return results.map((r: any) => ({
    id: r.id,
    fullName: r.full_name || '',
    email: r.email || '',
    avatarUrl: r.avatar_url || '',
    role: r.role || 'member',
    status: r.status || 'active',
    statusReason: r.status_reason ?? null,
    statusUntil: r.status_until ?? null,
    createdAt: r.created_at,
    lastActiveAt: r.last_active_at ?? null,
    openReports: Number(r.open_reports || 0)
  }));
}

// --- Event moderation -------------------------------------------------------

const MODERATION_STATUSES: ReadonlySet<string> = new Set(['active', 'hidden', 'removed']);

/** Events list for the moderation console, with host + open-report counts. */
export async function listEventsForModeration(
  db: D1Database,
  opts: { moderationStatus?: string; limit?: number } = {}
) {
  const where: string[] = ['e.deleted_at IS NULL'];
  const binds: unknown[] = [];
  if (opts.moderationStatus && MODERATION_STATUSES.has(opts.moderationStatus)) {
    where.push('e.moderation_status = ?');
    binds.push(opts.moderationStatus);
  }
  const limit = Math.min(Math.max(Number(opts.limit) || 100, 1), 200);

  const { results } = await db.prepare(
    `SELECT e.id, e.title, e.description, e.location, e.display_date, e.image,
            e.moderation_status, e.moderation_reason, e.moderated_at,
            e.host_user_id, u.full_name AS host_name,
            (SELECT COUNT(*) FROM reports r
              WHERE r.target_type = 'event' AND r.target_id = e.id AND r.status = 'open') AS open_reports
       FROM events e
       LEFT JOIN users u ON u.id = e.host_user_id
      WHERE ${where.join(' AND ')}
      ORDER BY open_reports DESC, e.created_at DESC
      LIMIT ?`
  ).bind(...binds, limit).all<any>();

  return results.map((r: any) => ({
    id: r.id,
    title: r.title || '',
    description: r.description || '',
    location: r.location || '',
    date: r.display_date || '',
    image: r.image || '',
    moderationStatus: r.moderation_status || 'active',
    moderationReason: r.moderation_reason ?? null,
    moderatedAt: r.moderated_at ?? null,
    hostUserId: r.host_user_id,
    hostName: r.host_name || r.host_user_id,
    openReports: Number(r.open_reports || 0)
  }));
}

/**
 * Set an event's moderation status. 'hidden'/'removed' pull it from public
 * listings; 'active' restores it. Reason is required for non-active states.
 */
export async function setEventModeration(
  db: D1Database,
  moderatorUserId: string,
  eventId: string,
  status: string,
  reason?: string | null
): Promise<AdminResult> {
  if (!MODERATION_STATUSES.has(status)) return { ok: false, error: 'invalid_status' };
  if (status !== 'active' && !(reason || '').trim()) return { ok: false, error: 'reason_required' };

  const existing = await db.prepare('SELECT id FROM events WHERE id = ? AND deleted_at IS NULL')
    .bind(eventId).first<{ id: string }>();
  if (!existing) return { ok: false, error: 'event_not_found' };

  await db.prepare(
    `UPDATE events
        SET moderation_status = ?,
            moderation_reason = ?,
            moderated_by = ?,
            moderated_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
  ).bind(
    status,
    status === 'active' ? null : (reason || '').trim().slice(0, 500),
    moderatorUserId,
    eventId
  ).run();

  return { ok: true };
}

// --- Role management (admin only) -------------------------------------------

/** Grant/revoke a role. Only callable by an admin (enforced in the route). */
export async function setUserRole(
  db: D1Database,
  targetUserId: string,
  role: string
): Promise<AdminResult> {
  if (!ROLES.has(role)) return { ok: false, error: 'invalid_role' };
  const existing = await db.prepare('SELECT id FROM users WHERE id = ?').bind(targetUserId).first<{ id: string }>();
  if (!existing) return { ok: false, error: 'user_not_found' };
  await db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(role, targetUserId).run();
  return { ok: true };
}
