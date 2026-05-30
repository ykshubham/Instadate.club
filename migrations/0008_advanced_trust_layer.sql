-- Migration: 0008_advanced_trust_layer.sql
PRAGMA foreign_keys = ON;

-- 1. Extend meetup_feedback with exact requested fields to align with the new trust layers
ALTER TABLE meetup_feedback ADD COLUMN meetup_id TEXT;
ALTER TABLE meetup_feedback ADD COLUMN user_id TEXT;
ALTER TABLE meetup_feedback ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE meetup_feedback ADD COLUMN would_meet_again INTEGER CHECK (would_meet_again IN (0, 1));
ALTER TABLE meetup_feedback ADD COLUMN feedback TEXT;

-- 2. Create event_feedback table exactly as requested
CREATE TABLE IF NOT EXISTS event_feedback (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  host_rating INTEGER CHECK (host_rating >= 1 AND host_rating <= 5),
  would_attend_again INTEGER CHECK (would_attend_again IN (0, 1)),
  feedback TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Indices for rapid event quality aggregation
CREATE INDEX IF NOT EXISTS idx_event_feedback_event ON event_feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feedback_user ON event_feedback(user_id);
