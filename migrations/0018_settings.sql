-- migrations/0018_settings.sql
-- Create user_settings table for Sprint 2 Task 7

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  -- Privacy Settings
  show_age INTEGER NOT NULL DEFAULT 1,
  show_distance INTEGER NOT NULL DEFAULT 1,
  incognito_mode INTEGER NOT NULL DEFAULT 0,
  -- Notification Settings
  email_notifications INTEGER NOT NULL DEFAULT 1,
  connection_notifications INTEGER NOT NULL DEFAULT 1,
  event_notifications INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
