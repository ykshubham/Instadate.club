# STEP 1 — Authentication (P0)

## Current State
- Google OAuth PKCE flow: `worker/index.ts:1130-1359`. Session cookie `instadate_session`, 30d, HttpOnly/Secure/SameSite=Lax (`:152-153, 209-215`).
- `authenticatedUserIdFrom()` `:217-236` — resolves **any unauthenticated GET** and **all dev/staging requests** to real `seeded_user_1`.
- Guest = `sessionStorage.instadate_guest_mode` (`src/main.jsx:361,460-464`).
- Logout: `POST /api/auth/logout` `:1406-1417` + `AuthContext.jsx:56-67`.
- 401 handling: `src/main.jsx:369-375` → `signOut()`.
- No email, no OTP, no account deletion, no session registry, no rate limiting.

## Problems
- **A1** backdoor (`:226-232`) → anonymous users read real private data; write access if `ENVIRONMENT` mis-set.
- **A2** single 30d token, no rotation/refresh/idle-timeout/device-list.
- **A3** `oauth_states.state` plaintext (`:1141-1143`); `redirectTo` validated only `startsWith('/')` (`:1255`) → `//evil.com` open-redirect.
- **A4** Google-only.
- **A5** no rate limiting.
- **B3** no banned/suspended gate at auth.
- **H1** no account deletion/export.

## Target State
True guest principal (never a real user_id); rotating sliding sessions + device registry; Google hardened + Email magic-link + Phone OTP; status gate; account deletion with grace; rate limits.

## Frontend Tasks
- `AUTH-FE-01` Replace `isGuest=false` literal (`ProfileDashboard.jsx:212`) and guest derivation in `src/main.jsx:361` with state from `AuthContext` (`isAuthenticated`, `isGuest`, `accountStatus`).
- `AUTH-FE-02` Build `LoginModal` component (contextual reason prop) used by every `→login` gated tap; resumes intended action post-auth.
- `AUTH-FE-03` Login screen: 3 methods — Continue with Google / Email / Phone + "Explore as guest." Loading + error states per method.
- `AUTH-FE-04` Email magic-link UI: enter email → "check inbox" → callback handler route `/auth/email/callback`.
- `AUTH-FE-05` Phone OTP UI: country picker (default +91), 6-digit input, resend cooldown 30s, attempts-left display, lockout message.
- `AUTH-FE-06` 401 flow upgrade (`src/main.jsx:369-375`): attempt one silent refresh before logout; preserve intended route.
- `AUTH-FE-07` Status screens: `SuspendedScreen`, `BannedScreen` (reason, until-date, appeal CTA). Rendered by a top-level status gate before app shell.
- `AUTH-FE-08` Settings: "Active sessions" list + "Sign out everywhere"; "Delete account" (type-to-confirm) + "Export data".
- `AUTH-FE-09` `src/lib/api.js`: central fetch wrapper (credentials, no-store, JSON, 401 event, retry-once).

## Backend Tasks
- `AUTH-BE-01` New `worker/auth.ts`: extract session helpers; implement `resolvePrincipal(request,env)` returning `{kind:'user'|'guest', userId|null, status}`. **Remove** GET + dev fallback to real user (`:226-232`). Guest never gets a userId.
- `AUTH-BE-02` Session rotation: on each authed request issue new session id, invalidate old (sliding 7d, absolute 30d); write `device`,`last_seen`.
- `AUTH-BE-03` `requireAuth`, `requireStatusActive`, `requirePublished`, `requireVerified` middleware in `worker/authz.ts`.
- `AUTH-BE-04` Hash `oauth_states.state` (sha256) at rest; verify by hash. Allowlist `redirectTo`: must match `^/(?!/)` else `/`.
- `AUTH-BE-05` Email magic-link: generate signed single-use 15-min token, store hashed in `email_login_tokens`; consume → create session.
- `AUTH-BE-06` Phone OTP: 6-digit, hashed in `phone_otps`, 5-min expiry, 5-attempt lockout, 30s resend / 3-per-hour; on success set `profiles.phone_verified=1`, bump `verification_level` to ≥`basic`. SMS provider adapter (MSG91/Twilio) behind interface; dev mode logs code.
- `AUTH-BE-07` Status gate: banned email/login → no session, 403 `account_banned`; suspended → session ok but writes 403 `account_suspended`.
- `AUTH-BE-08` Account deletion: `DELETE /api/account` → `status='deactivated'`, `deleted_at=now+30d`, scrub from discovery/chat immediately; scheduled purge (cron) hard-deletes after grace incl. R2 photos. `GET /api/account/export` → JSON bundle.
- `AUTH-BE-09` Rate limiting: KV/Durable-Object counters on `/api/auth/*`, OTP, login; per-IP + per-identifier.
- `AUTH-BE-10` `GET /api/auth/sessions`, `DELETE /api/auth/sessions` (sign-out-everywhere).

## Database Tasks
(see `IMPL-09-migrations.md` migration `0012`)
- `users.status`, `status_reason`, `status_until`, `deleted_at`.
- `auth_sessions.device`, `auth_sessions.last_seen`.
- `phone_otps`, `email_login_tokens` tables.
- `profiles.phone_e164`.
- Hash column note for `oauth_states` (store hashed value in existing `state` PK or add `state_hash`).

## API Tasks
- Modify: `GET /api/auth/me` (no dev auto-seed), `POST /api/auth/logout` (clear session row + cookie).
- Harden: `GET /api/auth/google/callback`, `/start`, `/url`.
- Add: `POST /api/auth/otp/start`, `/otp/verify`, `POST /api/auth/email/start`, `GET /api/auth/email/callback`, `GET /api/auth/sessions`, `DELETE /api/auth/sessions`, `DELETE /api/account`, `GET /api/account/export`.

## QA Tasks
- (+) each method → authed + intended route restored. (−) expired/replayed state, wrong OTP lockout, expired magic-link, banned email blocked, `//evil.com` blocked. (E) 401 silent-refresh→fallback, two-device + sign-out-everywhere, reinstall restores, suspended writes 403.
- **Security:** assert no unauthenticated request resolves to a real user_id (automated test hitting `/api/profile` with no cookie returns guest DTO or 401, never real PII). Cookie flags asserted. Rate limits fire.

## Definition of Done
- No code path maps an unauthenticated/guest request to a real `user_id`.
- All 3 login methods reach identical authed state; 401 attempts one refresh.
- Banned cannot get a session; suspended cannot write.
- Account deletion + export work end-to-end; purge job verified.
- Sessions rotate; device list + global sign-out functional.
- Rate limits enforced on auth/OTP. All QA cases green.
