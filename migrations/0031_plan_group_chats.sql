-- 0031_plan_group_chats.sql
-- Instant-plan private group chats. When a user joins an instant outing plan they
-- are enrolled in a temporary N-way group chat (one per plan), surfaced in the chat
-- inbox "Plans" tab. The chat auto-expires 24h after the plan's outing time.
--
-- Existing 1:1 chats are untouched: they keep using chats.participant_a/b. Group
-- chats instead use the new chat_participants table for membership.
-- Additive. Rollback = drop chat_participants + the added columns.

-- Generalize chats to support group threads.
ALTER TABLE chats ADD COLUMN kind TEXT NOT NULL DEFAULT 'direct';  -- 'direct' | 'group'
ALTER TABLE chats ADD COLUMN title TEXT;                           -- group display name (plan title)
ALTER TABLE chats ADD COLUMN instant_plan_id TEXT;                 -- -> instant_plans.id (group chats only)

-- N-way membership for group chats (direct chats do not use this table).
CREATE TABLE IF NOT EXISTS chat_participants (
  chat_id   TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_instant_plan ON chats(instant_plan_id);

-- Real outing timestamp + computed expiry. The free-text `time` column stays for
-- casual display ("Tonight after 8:30"); these power the 24h auto-delete.
ALTER TABLE instant_plans ADD COLUMN outing_at  TEXT;  -- ISO start time of the outing
ALTER TABLE instant_plans ADD COLUMN expires_at TEXT;  -- outing_at + 24h (group TTL)

CREATE INDEX IF NOT EXISTS idx_instant_plans_expires ON instant_plans(expires_at);
