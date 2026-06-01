-- Migration: 0027_chat_idempotency.sql
-- Sprint 3 hardening: per-chat client message id for send idempotency.
-- A client-supplied id lets offline resends / double-taps collapse to one row
-- on both the HTTP and WebSocket send paths.
-- Rollback: DROP INDEX idx_chat_messages_client_msg; (column needs a table rebuild to remove).

ALTER TABLE chat_messages ADD COLUMN client_msg_id TEXT;

-- Uniqueness is enforced per chat at the application layer (lookup before insert);
-- this index makes that lookup O(log n) and supports dedup scans.
CREATE INDEX IF NOT EXISTS idx_chat_messages_client_msg ON chat_messages(chat_id, client_msg_id);
