-- Migration: 0007_feedback_and_impressions.sql
PRAGMA foreign_keys = ON;

-- 1. Extend meetup_feedback to support full post-meetup questions
ALTER TABLE meetup_feedback ADD COLUMN meetup_happened INTEGER CHECK (meetup_happened IN (0, 1));
ALTER TABLE meetup_feedback ADD COLUMN rating_stars INTEGER CHECK (rating_stars >= 1 AND rating_stars <= 5);
ALTER TABLE meetup_feedback ADD COLUMN text_feedback TEXT;

-- 2. Create event_reviews table for post-event attendee ratings
CREATE TABLE IF NOT EXISTS event_reviews (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  event_rating INTEGER CHECK (event_rating >= 1 AND event_rating <= 5),
  host_rating INTEGER CHECK (host_rating >= 1 AND host_rating <= 5),
  would_attend_again INTEGER CHECK (would_attend_again IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Indices for analytics search performance
CREATE INDEX IF NOT EXISTS idx_event_reviews_event ON event_reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_user ON event_reviews(user_id);
