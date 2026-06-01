-- migrations/0019_fk_rebuild.sql
-- SQLite Foreign Key Rebuild Migration for Sprint 2 Task 8
-- Reconstructs meetup_feedback table to enforce strict ON DELETE CASCADE constraints on all columns.
--
-- D1 compatibility note: D1's query API rejects explicit `BEGIN TRANSACTION`/`COMMIT`/`SAVEPOINT`
-- (error 7500) — it wraps each migration file in its own transaction. The previous explicit
-- transaction control and `PRAGMA foreign_keys` toggles were removed; D1 does not enforce FKs at
-- runtime, so the OFF/ON toggle and `PRAGMA foreign_key_check` are unnecessary. The rebuild logic
-- (orphan cleanup → create → copy → drop → rename → reindex) is unchanged.

-- 1. Backfill Validation: Clean up orphaned rows to ensure integrity before rebuilding
DELETE FROM meetup_feedback
WHERE (user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users))
   OR (meetup_id IS NOT NULL AND meetup_id NOT IN (SELECT id FROM match_outcomes))
   OR (match_outcome_id NOT IN (SELECT id FROM match_outcomes))
   OR (reporter_user_id NOT IN (SELECT id FROM users))
   OR (target_user_id NOT IN (SELECT id FROM users));

-- 2. Create the reconstructed table with full explicit constraints and cascades
CREATE TABLE meetup_feedback_new (
  id TEXT PRIMARY KEY,
  match_outcome_id TEXT NOT NULL REFERENCES match_outcomes(id) ON DELETE CASCADE,
  reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  showed_up INTEGER NOT NULL CHECK (showed_up IN (0, 1)),
  meet_again INTEGER NOT NULL CHECK (meet_again IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  meetup_happened INTEGER CHECK (meetup_happened IN (0, 1)),
  rating_stars INTEGER CHECK (rating_stars >= 1 AND rating_stars <= 5),
  text_feedback TEXT,
  meetup_id TEXT REFERENCES match_outcomes(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  would_meet_again INTEGER CHECK (would_meet_again IN (0, 1)),
  feedback TEXT,
  UNIQUE(match_outcome_id, reporter_user_id)
);

-- 3. Copy records from old table into new table
INSERT INTO meetup_feedback_new (
  id, match_outcome_id, reporter_user_id, target_user_id, showed_up, meet_again, created_at,
  meetup_happened, rating_stars, text_feedback, meetup_id, user_id, rating, would_meet_again, feedback
)
SELECT
  id, match_outcome_id, reporter_user_id, target_user_id, showed_up, meet_again, created_at,
  meetup_happened, rating_stars, text_feedback, meetup_id, user_id, rating, would_meet_again, feedback
FROM meetup_feedback;

-- 4. Drop the old table
DROP TABLE meetup_feedback;

-- 5. Rename the new table to canonical name
ALTER TABLE meetup_feedback_new RENAME TO meetup_feedback;

-- 6. Recreate the index
CREATE INDEX IF NOT EXISTS idx_meetup_feedback_target ON meetup_feedback(target_user_id);
