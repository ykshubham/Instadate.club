-- 0014_reports.sql
-- Sprint 1 Task 7: abuse reports + moderation queue.
-- Additive. Rollback = DROP TABLE reports.

CREATE TABLE IF NOT EXISTS reports (
  id               TEXT PRIMARY KEY,
  reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type      TEXT NOT NULL,                       -- user | message | event
  target_id        TEXT NOT NULL,
  reason           TEXT NOT NULL,
  details          TEXT,
  status           TEXT NOT NULL DEFAULT 'open',         -- open | reviewing | actioned | dismissed
  resolved_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  resolved_at      TEXT,
  created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
