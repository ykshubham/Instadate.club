-- 0022_trust_caching.sql
-- Add would_meet_again_pct column to trust_metrics to support full cache optimization

ALTER TABLE trust_metrics ADD COLUMN would_meet_again_pct REAL DEFAULT 100.0;
