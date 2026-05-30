-- Migration: 0005_matchmaking_v2.sql
PRAGMA foreign_keys = ON;

-- 1. Location Engine V2
-- Add profile_latitude and profile_longitude columns to profiles
ALTER TABLE profiles ADD COLUMN profile_latitude REAL DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN profile_longitude REAL DEFAULT NULL;

-- 2. Preference Filtering
-- Drop existing un-indexed or unstructured user_preferences and create preference constraints
DROP TABLE IF EXISTS user_preferences;
CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_gender TEXT DEFAULT NULL, -- 'Male', 'Female', 'All'
  min_age INTEGER NOT NULL DEFAULT 18,
  max_age INTEGER NOT NULL DEFAULT 100,
  preferred_distance_km REAL NOT NULL DEFAULT 100.0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- 3. Match Outcomes Tracking
CREATE TABLE IF NOT EXISTS match_outcomes (
  id TEXT PRIMARY KEY,
  user_id_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id_b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('requested', 'accepted', 'chat_started', 'meetup_planned', 'meetup_completed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id_a, user_id_b)
);

CREATE INDEX IF NOT EXISTS idx_match_outcomes_users ON match_outcomes(user_id_a, user_id_b);

-- 4. Meetup Feedback
CREATE TABLE IF NOT EXISTS meetup_feedback (
  id TEXT PRIMARY KEY,
  match_outcome_id TEXT NOT NULL REFERENCES match_outcomes(id) ON DELETE CASCADE,
  reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  showed_up INTEGER NOT NULL CHECK (showed_up IN (0, 1)), -- 0 = No Show, 1 = Attended
  meet_again INTEGER NOT NULL CHECK (meet_again IN (0, 1)), -- 0 = No, 1 = Yes
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_outcome_id, reporter_user_id)
);

CREATE INDEX IF NOT EXISTS idx_meetup_feedback_target ON meetup_feedback(target_user_id);
