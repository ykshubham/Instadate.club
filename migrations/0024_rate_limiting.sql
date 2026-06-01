-- Migration: 0024_rate_limiting.sql
-- Create rate_limits table to support robust rate limiting across multiple endpoints.

CREATE TABLE IF NOT EXISTS rate_limits (
  key      TEXT PRIMARY KEY,
  count    INTEGER NOT NULL DEFAULT 1,
  reset_at INTEGER NOT NULL -- Unix timestamp (in milliseconds)
);

-- Index for rapid cleanup of expired rate limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);
