-- Migration: 0004_matchmaking_intelligence.sql
PRAGMA foreign_keys = ON;

-- 1. Interests Engine
CREATE TABLE IF NOT EXISTS user_interests (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  weight INTEGER NOT NULL CHECK (weight IN (1, 3, 5)), -- 1=Interested, 3=Like, 5=Love
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, interest)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);

-- 2. Intent Engine & Configurable Matrix
CREATE TABLE IF NOT EXISTS user_intents (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intent TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, intent)
);

CREATE INDEX IF NOT EXISTS idx_user_intents_user ON user_intents(user_id);

CREATE TABLE IF NOT EXISTS intent_compatibility (
  intent_a TEXT NOT NULL,
  intent_b TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  PRIMARY KEY (intent_a, intent_b)
);

-- Seed Intent Compatibility Matrix (symmetric)
INSERT OR REPLACE INTO intent_compatibility (intent_a, intent_b, score) VALUES
('Relationship', 'Relationship', 100),
('Relationship', 'Marriage', 85),
('Relationship', 'Dating', 70),
('Relationship', 'Friends', 15),
('Relationship', 'Activity Partner', 20),
('Relationship', 'Event Networking', 10),

('Marriage', 'Relationship', 85),
('Marriage', 'Marriage', 100),
('Marriage', 'Dating', 50),
('Marriage', 'Friends', 10),
('Marriage', 'Activity Partner', 10),
('Marriage', 'Event Networking', 5),

('Dating', 'Relationship', 70),
('Dating', 'Marriage', 50),
('Dating', 'Dating', 100),
('Dating', 'Friends', 40),
('Dating', 'Activity Partner', 30),
('Dating', 'Event Networking', 20),

('Friends', 'Relationship', 15),
('Friends', 'Marriage', 10),
('Friends', 'Dating', 40),
('Friends', 'Friends', 100),
('Friends', 'Activity Partner', 80),
('Friends', 'Event Networking', 50),

('Activity Partner', 'Relationship', 20),
('Activity Partner', 'Marriage', 10),
('Activity Partner', 'Dating', 30),
('Activity Partner', 'Friends', 80),
('Activity Partner', 'Activity Partner', 100),
('Activity Partner', 'Event Networking', 60),

('Event Networking', 'Relationship', 10),
('Event Networking', 'Marriage', 5),
('Event Networking', 'Dating', 20),
('Event Networking', 'Friends', 50),
('Event Networking', 'Activity Partner', 60),
('Event Networking', 'Event Networking', 100);

-- 3. Matchmaking Blocks & Rejections
CREATE TABLE IF NOT EXISTS user_blocks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS user_rejections (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rejected_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, rejected_user_id)
);

-- 4. Matchmaking & Recommendation Engine
CREATE TABLE IF NOT EXISTS recommended_users (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommended_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
  explanation TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recommended_user_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommended_users(user_id, score DESC);

-- 5. Upgraded Event Intelligence Fields
ALTER TABLE events ADD COLUMN category TEXT;
ALTER TABLE events ADD COLUMN activity_type TEXT;
ALTER TABLE events ADD COLUMN approval_required INTEGER NOT NULL DEFAULT 1;
ALTER TABLE events ADD COLUMN gender_ratio_preference TEXT DEFAULT 'None';
ALTER TABLE events ADD COLUMN visibility TEXT NOT NULL DEFAULT 'Public';

CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- 6. Instant Plans
CREATE TABLE IF NOT EXISTS instant_plans (
  id TEXT PRIMARY KEY,
  creator_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  activity TEXT NOT NULL, -- e.g. 'Movie Tonight', 'Coffee Meetup', 'Road Trip', 'Pickleball Match', 'Night Out'
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS instant_plan_members (
  plan_id TEXT NOT NULL REFERENCES instant_plans(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (plan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_instant_plans_creator ON instant_plans(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_instant_plan_members_user ON instant_plan_members(user_id);

-- 7. Trust Score Foundation
CREATE TABLE IF NOT EXISTS trust_metrics (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  attendance_score REAL NOT NULL DEFAULT 100.0,
  no_show_count INTEGER NOT NULL DEFAULT 0,
  attended_count INTEGER NOT NULL DEFAULT 0,
  verification_score REAL NOT NULL DEFAULT 0.0,
  is_verified INTEGER NOT NULL DEFAULT 0,
  response_rate REAL NOT NULL DEFAULT 100.0,
  response_time_seconds INTEGER,
  trust_score REAL NOT NULL DEFAULT 50.0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS no_show_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  instant_plan_id TEXT REFERENCES instant_plans(id) ON DELETE SET NULL,
  reported_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  marked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_trust_metrics_score ON trust_metrics(trust_score);
