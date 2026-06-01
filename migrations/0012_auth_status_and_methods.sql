-- 0012_auth_status_and_methods.sql
-- Sprint 1: account status (suspended/banned/deactivated), session hardening,
-- onboarding progress, and scaffolding for email/OTP auth methods.
-- Additive only. Safe to roll back by dropping the added tables/columns.

-- --- Account status & lifecycle (Steps 1/3) ---
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';      -- active|suspended|banned|deactivated
ALTER TABLE users ADD COLUMN status_reason TEXT;
ALTER TABLE users ADD COLUMN status_until TEXT;                          -- suspension end (ISO)
ALTER TABLE users ADD COLUMN deleted_at TEXT;                            -- soft-delete / grace marker
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN onboarding_completed_at TEXT;
ALTER TABLE users ADD COLUMN last_active_at TEXT;

-- --- Session hardening (Step 1, AUTH-BE-02) ---
ALTER TABLE auth_sessions ADD COLUMN device TEXT;
ALTER TABLE auth_sessions ADD COLUMN last_seen TEXT;

-- --- OAuth state at rest (Step 1, AUTH-BE-04) ---
ALTER TABLE oauth_states ADD COLUMN state_hash TEXT;

-- --- Phone / email auth scaffolding (Step 1, AUTH-BE-05/06) ---
ALTER TABLE profiles ADD COLUMN phone_e164 TEXT;

CREATE TABLE IF NOT EXISTS phone_otps (
  phone_e164 TEXT PRIMARY KEY,
  code_hash  TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_login_tokens (
  token_hash TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- --- Indexes ---
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_last_seen ON auth_sessions(last_seen);
