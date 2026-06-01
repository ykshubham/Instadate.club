-- Migration: 0026_chat_soft_delete_perf.sql
-- Sprint 3 hardening: chat message soft-delete + presence/history perf indexes
-- Rollback: DROP INDEX idx_users_last_active; DROP INDEX idx_chat_messages_chat_created;
--           (the deleted_at column requires a table rebuild to remove in SQLite).

-- 1. Soft-delete column for chat messages (NULL = not deleted, TEXT timestamp otherwise).
--    SQLite ALTER TABLE ADD COLUMN does not support IF NOT EXISTS, so the plain statement
--    is used (matching how 0021 added attachment_url).
ALTER TABLE chat_messages ADD COLUMN deleted_at TEXT;

-- 2. Index on users.last_active_at: written on every authed request and used for
--    presence/last-seen ordering.
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);

-- 3. Composite index for per-chat history loads ordered by created_at.
--    0001 already created an equivalent index under a different name; this is a safe
--    no-op via IF NOT EXISTS and standardizes the name.
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created ON chat_messages(chat_id, created_at);
