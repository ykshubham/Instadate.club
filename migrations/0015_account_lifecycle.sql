-- 0015_account_lifecycle.sql
-- Sprint 1 Task 8 (AUTH-BE-08): account deactivation, deletion grace, scheduled purge.
-- Reuses users.status ('deactivated') and users.deleted_at (purge-due timestamp) from 0012.
-- This migration only adds audit columns + a purge-scan index. Additive; safe to roll back.

ALTER TABLE users ADD COLUMN deactivated_at TEXT;       -- when the user paused the account (reversible)
ALTER TABLE users ADD COLUMN deletion_requested_at TEXT; -- when hard-deletion was requested (grace starts)

-- Purge job scans users whose grace window has elapsed.
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
