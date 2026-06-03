-- 0020_message_reads.sql
-- Add message_reads table to track read receipts for chat messages

CREATE TABLE IF NOT EXISTS message_reads (
  chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chat_id, user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_chat_user ON message_reads(chat_id, user_id);
