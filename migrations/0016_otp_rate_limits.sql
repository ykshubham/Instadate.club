-- 0016_otp_rate_limits.sql
-- Sprint 2 Task 1 (AUTH-BE-06/09): phone OTP send throttling + per-IP rate limiting.
-- Builds on phone_otps + profiles.phone_e164 from 0012. Additive; safe to roll back
-- by dropping auth_rate_limits and the three added columns.

-- Per-phone send throttle (30s resend cooldown, 3-per-hour window). The phone_otps
-- row already keys on phone_e164, so we track send cadence on the same row.
ALTER TABLE phone_otps ADD COLUMN last_sent_at TEXT;
ALTER TABLE phone_otps ADD COLUMN send_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE phone_otps ADD COLUMN window_started_at TEXT;
ALTER TABLE phone_otps ADD COLUMN locked_until TEXT;       -- set when attempts exhausted

-- Generic fixed-window counter keyed by an arbitrary bucket string
-- (e.g. 'otp_ip:1.2.3.4'). Reused for any auth rate-limit need.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket_key        TEXT PRIMARY KEY,
  count             INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
