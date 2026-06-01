# Phase 12 — Database & API Architecture

## Current schema (11 migrations) — summary
**Users/auth:** `users`, `auth_sessions`, `oauth_states`.
**Profile:** `profiles`, `profile_photos`, `user_preferences`.
**Match/compat:** `user_interests`, `user_intents`, `intent_compatibility`, `user_blocks`, `user_rejections`, `recommended_users`, `matches`, `match_outcomes`, `meetup_feedback`.
**Events:** `events`, `event_attendees`, `event_feedback`, `no_show_logs`.
**Chat:** `chats`, `chat_messages`.
**Instant plans:** `instant_plans`, `instant_plan_members`.
**Trust/analytics:** `trust_metrics`, `analytics_events`.

### Known schema debt
- `matches.target_member_id`, `chats.participant_b_user_id` are **loose (non-FK)** → D1.
- `meetup_feedback` has redundant column sets across 0005→0008 → D2.
- `event_reviews` created (0007) then dropped (0009).

## Target additions

```sql
-- Moderation / status
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
        -- active | suspended | banned | deactivated
ALTER TABLE users ADD COLUMN status_reason TEXT;
ALTER TABLE users ADD COLUMN status_until TEXT;     -- suspension end
ALTER TABLE users ADD COLUMN deleted_at TEXT;       -- soft delete / grace

-- Real mutual connections (replaces one-directional matches)
CREATE TABLE connection_requests (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|accepted|rejected|expired
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  UNIQUE(from_user_id, to_user_id)
);
CREATE TABLE connections (
  id TEXT PRIMARY KEY,
  user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chat_id TEXT REFERENCES chats(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'accepted', -- accepted|unmatched
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_a_id, user_b_id)
);

-- Abuse reports (missing entirely — B2)
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,   -- user|message|event
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_json TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open|reviewing|actioned|dismissed
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_reports_status ON reports(status, created_at);

-- Notifications (missing — D3)
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,          -- connection_request|message|event_update|...
  payload_json TEXT,
  read_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at, created_at);

-- Chat realtime support
CREATE TABLE message_reads (
  message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(message_id, user_id)
);
ALTER TABLE chat_messages ADD COLUMN attachment_url TEXT;
ALTER TABLE chat_messages ADD COLUMN deleted_at TEXT;

-- Event waitlist (missing — F1)
CREATE TABLE event_waitlist (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(event_id, user_id)
);

-- Verification & auth additions
ALTER TABLE profiles ADD COLUMN phone_e164 TEXT;
CREATE TABLE phone_otps (
  phone_e164 TEXT PRIMARY KEY, code_hash TEXT, expires_at TEXT,
  attempts INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE email_login_tokens (
  token_hash TEXT PRIMARY KEY, email TEXT, expires_at TEXT,
  consumed_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE auth_sessions ADD COLUMN device TEXT;
ALTER TABLE auth_sessions ADD COLUMN last_seen TEXT;

-- Fix loose FKs (D1) — backfill then enforce in a rebuild migration
-- Consolidate meetup_feedback (D2) — canonical: meetup_happened, showed_up, rating(1-5), would_meet_again, feedback
```

### Missing indexes to add (C3)
```sql
CREATE INDEX idx_meetup_feedback_target_outcome ON meetup_feedback(target_user_id, match_outcome_id);
CREATE INDEX idx_recommended_users_generated ON recommended_users(generated_at);
CREATE INDEX idx_event_attendees_event_status_user ON event_attendees(event_id, status, user_id);
```

## API surface — current (48 endpoints) + target additions

### Keep (current, grouped)
Auth: `GET /api/auth/google/start|url|callback`, `POST /api/auth/login|logout`, `GET /api/auth/me`.
Profile: `GET|PATCH /api/profile`, `POST|GET|DELETE /api/profile/photo[/:id]`, `PUT /api/users/me`.
State/Discovery: `GET /api/state` (**to be split**), `GET /api/discovery`, `GET /api/members`, `GET /api/recommendations`.
Events: `POST /api/events`, join/leave `/api/events/:id/attendees/me`, approve/attend, `GET /api/events/recommended`, `POST /api/events/:id/review`.
Match/intents: interests, intents, intent-compatibility, `POST /api/matches`, `POST /api/rejections`, `POST /api/blocks`, match-outcomes, meetup-feedback, preferences.
Instant plans: list/create/join/leave/complete.
Chat: `POST /api/chats/:slug/messages`, `PATCH /api/chats/:slug/verification`.
Admin/analytics: `POST /api/analytics/event`, `GET /api/admin/analytics|health`.

### Add (target)
```
POST   /api/auth/otp/start            // phone OTP
POST   /api/auth/otp/verify
POST   /api/auth/email/start          // magic link
GET    /api/auth/email/callback
GET    /api/auth/sessions             // device list
DELETE /api/auth/sessions             // sign out everywhere

POST   /api/connections/request
POST   /api/connections/:id/accept
POST   /api/connections/:id/reject
DELETE /api/connections/:id           // unmatch
GET    /api/connections/requests      // incoming inbox (closes E1)

POST   /api/reports                   // abuse (B2)
GET    /api/blocks                    // list (settings)
DELETE /api/blocks/:id                // unblock

PATCH  /api/events/:id                // edit (F1)
POST   /api/events/:id/cancel         // cancel (F1)
POST   /api/events/:id/waitlist       // join waitlist (F1)

GET    /api/notifications
POST   /api/notifications/read

GET    /api/updates?since=cursor      // lightweight delta (replaces 3s full poll)
DELETE /api/account                   // deletion (H1)
GET    /api/account/export            // data export (H1)
```

### Split `/api/state` (C1) into:
`GET /api/me/summary` (profile + counts) · `GET /api/me/chats` · `GET /api/me/events` · `GET /api/me/pending-reviews` · discovery already separate. Each cacheable; none recomputes everything per poll.

## Security recommendations (consolidated)
- Server-authoritative authz on every write; `visibleTo` on every read list.
- Hash OTP/state/email tokens at rest; allowlist redirects.
- Rate-limit auth, messaging, matching, OTP.
- Session rotation + device registry + global sign-out.
- Sanitised public DTOs (no phone/IG/exact GPS for guests/non-connections).
- WAF + bot protection on Cloudflare; secrets only in env, never client.
