-- Migration: 0023_perf_indexes.sql
-- Add performance indexes for reports and eliminate potential query/cascade bottlenecks.

-- 1. Index reporter_user_id on reports to speed up ON DELETE CASCADE and profile data exports
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_user_id);

-- 2. Index resolved_by on reports to speed up resolved report history lookups
CREATE INDEX IF NOT EXISTS idx_reports_resolved_by ON reports(resolved_by);

-- 3. Composite index on meetup_feedback to optimize trust score calculations and outcomes aggregations
CREATE INDEX IF NOT EXISTS idx_meetup_feedback_target_outcome ON meetup_feedback(target_user_id, match_outcome_id);

-- 4. Index on recommended_users generated_at for fast eviction/cleanup cron tasks
CREATE INDEX IF NOT EXISTS idx_recommended_users_generated ON recommended_users(generated_at);

-- 5. Composite index on event_attendees to optimize RSVP check-ins and waitlist promotions
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_status_user ON event_attendees(event_id, status, user_id);
