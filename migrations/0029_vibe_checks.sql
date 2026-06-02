-- 0029_vibe_checks.sql
-- Vibe Check System: voice-first connection flow replacing text-based connection requests.
-- Users record a voice message (max 30s); recipient listens then accepts or passes.
-- Only after acceptance is a chat thread created and messaging unlocked.
-- Additive. Rollback = DROP the three tables + indexes.

CREATE TABLE IF NOT EXISTS vibe_checks (
  id              TEXT PRIMARY KEY,                          -- 'vc-{uuid}'
  from_user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voice_url       TEXT NOT NULL,                             -- R2 URL of the voice recording
  voice_duration  INTEGER,                                   -- seconds (max 30)
  status          TEXT NOT NULL DEFAULT 'pending',            -- pending | listened | accepted | declined | expired
  listened_at     TEXT,                                      -- when recipient first played
  responded_at    TEXT,                                      -- when accepted/declined
  expires_at      TEXT NOT NULL,                             -- 7-day TTL from creation
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_user_id, to_user_id)                           -- one active per pair
);

CREATE INDEX IF NOT EXISTS idx_vibe_checks_to ON vibe_checks(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_vibe_checks_from ON vibe_checks(from_user_id, status);
CREATE INDEX IF NOT EXISTS idx_vibe_checks_pair ON vibe_checks(from_user_id, to_user_id);

CREATE TABLE IF NOT EXISTS vibe_check_daily_quotas (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,                                   -- 'YYYY-MM-DD'
  count      INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS vibe_check_decline_cooldowns (
  from_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  declined_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cooldown_until TEXT NOT NULL,                               -- declined_at + 30 days
  PRIMARY KEY (from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_vc_cooldown_until ON vibe_check_decline_cooldowns(cooldown_until);
