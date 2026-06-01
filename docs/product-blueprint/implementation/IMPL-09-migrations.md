# STEP 9 — Database Migrations

## Existing (0001–0011)
users, auth_sessions, oauth_states, profiles, profile_photos, user_preferences, user_interests, user_intents, intent_compatibility, user_blocks, user_rejections, recommended_users, matches, match_outcomes, meetup_feedback, events, event_attendees, event_feedback, no_show_logs, chats, chat_messages, instant_plans, instant_plan_members, trust_metrics, analytics_events.
Debt: loose FKs (`matches.target_member_id`, `chats.participant_b_user_id`), `meetup_feedback` redundancy (0005→0008), `event_reviews` added/dropped.

## Migration order (additive-first, destructive-last)

### `0012_auth_status_and_methods.sql` (Step 1/2/3)
```sql
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN status_reason TEXT;
ALTER TABLE users ADD COLUMN status_until TEXT;
ALTER TABLE users ADD COLUMN deleted_at TEXT;
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN onboarding_completed_at TEXT;
ALTER TABLE users ADD COLUMN last_active_at TEXT;
ALTER TABLE auth_sessions ADD COLUMN device TEXT;
ALTER TABLE auth_sessions ADD COLUMN last_seen TEXT;
ALTER TABLE oauth_states ADD COLUMN state_hash TEXT;        -- store hashed; phase out plaintext
ALTER TABLE profiles ADD COLUMN phone_e164 TEXT;
CREATE TABLE phone_otps (phone_e164 TEXT PRIMARY KEY, code_hash TEXT, expires_at TEXT, attempts INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE email_login_tokens (token_hash TEXT PRIMARY KEY, email TEXT, expires_at TEXT, consumed_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX idx_users_status ON users(status);
```

### `0013_connections_chat_events_moderation.sql` (Step 5/6/7/8)
```sql
CREATE TABLE connection_requests (id TEXT PRIMARY KEY, from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, note TEXT, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT DEFAULT CURRENT_TIMESTAMP, expires_at TEXT, UNIQUE(from_user_id,to_user_id));
CREATE TABLE connections (id TEXT PRIMARY KEY, user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, chat_id TEXT REFERENCES chats(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'accepted', created_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_a_id,user_b_id));
CREATE TABLE reports (id TEXT PRIMARY KEY, reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, target_type TEXT NOT NULL, target_id TEXT NOT NULL, reason TEXT NOT NULL, evidence_json TEXT, status TEXT NOT NULL DEFAULT 'open', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, payload_json TEXT, read_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE notification_prefs (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, prefs_json TEXT NOT NULL DEFAULT '{}');
CREATE TABLE message_reads (message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, read_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(message_id,user_id));
CREATE TABLE event_waitlist (event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, position INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(event_id,user_id));
ALTER TABLE chat_messages ADD COLUMN attachment_url TEXT;
ALTER TABLE chat_messages ADD COLUMN deleted_at TEXT;
ALTER TABLE profiles ADD COLUMN visibility TEXT DEFAULT 'everyone';
ALTER TABLE profiles ADD COLUMN show_distance INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN show_last_active INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN who_can_message TEXT DEFAULT 'connections';
CREATE INDEX idx_reports_status ON reports(status, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at, created_at);
CREATE INDEX idx_connection_requests_to ON connection_requests(to_user_id, status);
```

### `0014_perf_indexes.sql` (Step 4/11)
```sql
CREATE INDEX idx_meetup_feedback_target_outcome ON meetup_feedback(target_user_id, match_outcome_id);
CREATE INDEX idx_recommended_users_generated ON recommended_users(generated_at);
CREATE INDEX idx_event_attendees_event_status_user ON event_attendees(event_id, status, user_id);
```

### `0015_fk_rebuild.sql` (D1 — destructive, run last, after backfill)
- Rebuild `matches`→ migrate live rows into `connection_requests`; rebuild `chats` with real `participant_b_user_id` FK. SQLite pattern: create `_new` table with FKs → `INSERT…SELECT` → drop old → rename.

### `0016_meetup_feedback_consolidate.sql` (D2 — destructive, last)
- Canonical columns: `meetup_happened, showed_up, rating(1-5), would_meet_again, feedback`. Migrate data from redundant columns → drop extras via table rebuild.

## Backfill
- `users.status='active'` for all existing (default handles it).
- `connections`: backfill from any accepted `match_outcomes` so existing seeded chats map to real connections.
- `oauth_states.state_hash`: leave plaintext rows to expire (10-min TTL); switch code to hash on write.

## Rollback strategy
- Additive migrations (0012–0014) reversible by dropping added tables/columns (keep `down` notes per file).
- Destructive rebuilds (0015–0016): take D1 export/backup before; rollback = restore backup. Never run 0015/0016 until 0012–0014 verified in staging.
- Apply locally first (`npm run d1:migrate:local`), verify with `wrangler d1 execute … "PRAGMA foreign_key_check"`, then `:remote`.

## Definition of Done
- All migrations apply clean local→remote; `PRAGMA foreign_key_check` empty; backfill verified; seeded data maps to new connection/chat model.
