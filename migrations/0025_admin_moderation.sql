-- 0025_admin_moderation.sql
-- Sprint 4 Task 3: Admin & Moderation Controls.
-- Adds: persistent admin roles, an immutable audit log, and event moderation state.
-- Additive only. Rollback = drop the added columns/table (see bottom notes).

-- --- 1. Admin roles ---------------------------------------------------------
-- Promotes role out of the env ADMIN_USER_IDS allowlist into the DB so it can be
-- granted/revoked at runtime. 'member' (default) | 'moderator' | 'admin'.
--   moderator: review queue, suspend/ban users, hide/restore events.
--   admin:     everything a moderator can do + grant/revoke roles.
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member';

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- --- 2. Audit log -----------------------------------------------------------
-- Every privileged moderation action is appended here. Append-only by
-- convention (no UPDATE/DELETE paths in code). target_type/target_id identify
-- the affected entity; metadata_json carries the action detail (reason, until…).
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id            TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,                       -- e.g. user_suspended, user_banned, event_hidden, role_granted
  target_type   TEXT NOT NULL,                       -- user | event | report | role
  target_id     TEXT,
  reason        TEXT,
  metadata_json TEXT,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON admin_audit_logs(actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_logs(target_type, target_id);

-- --- 3. Event moderation ----------------------------------------------------
-- Soft moderation distinct from host deletion (events.deleted_at). A hidden
-- event is pulled from discovery/listings but kept for audit and host appeal.
ALTER TABLE events ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'active'; -- active | hidden | removed
ALTER TABLE events ADD COLUMN moderation_reason TEXT;
ALTER TABLE events ADD COLUMN moderated_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN moderated_at TEXT;

CREATE INDEX IF NOT EXISTS idx_events_moderation ON events(moderation_status);

-- Rollback notes (SQLite cannot DROP COLUMN pre-3.35 without table rebuild):
--   DROP TABLE admin_audit_logs;
--   -- users.role, events.moderation_* require a table rebuild to remove.
