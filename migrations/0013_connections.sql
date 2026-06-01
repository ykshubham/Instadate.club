-- 0013_connections.sql
-- Sprint 1 Task 5: mutual-consent connection system + chat-on-accept.
-- Additive. Rollback = DROP the two tables + indexes.

CREATE TABLE IF NOT EXISTS connection_requests (
  id           TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note         TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',   -- pending | accepted | rejected | expired
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   TEXT,
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS connections (
  id         TEXT PRIMARY KEY,
  user_a_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- canonical: a < b
  user_b_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id    TEXT REFERENCES chats(id) ON DELETE SET NULL,
  status     TEXT NOT NULL DEFAULT 'accepted',                       -- accepted | unmatched
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_connection_requests_to ON connection_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_users ON connections(user_a_id, user_b_id);
