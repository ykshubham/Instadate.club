# Phase 2 — Authentication System

## Current state (as built)
- **Methods:** Google OAuth 2.0 (PKCE/S256) + client-side "guest mode" flag. No email, no OTP.
- **Session:** single opaque cookie `instadate_session`, 30 days, `HttpOnly`, `Secure` (https), `SameSite=Lax`; validated against `auth_sessions` per request.
- **Critical flaws (see 01-audit):** A1 backdoor, A2 no rotation, A3 plaintext state/open-redirect, A4 Google-only, A5 no rate limiting.

## Target login methods

### 1. Google (keep, harden)
- **UX:** Tap *Continue with Google* → account chooser → return to app at intended route. Loading: full-screen splash with branded spinner; never a blank frame.
- **Backend:** existing PKCE flow. **Hardening:** hash `state` at rest; allowlist `redirectTo` (must match `^/[^/]` and not `//`); rate-limit callback per IP.
- **Validation:** require `email_verified=true` (already). Reject if email belongs to a `banned` account → show ban screen, not a session.
- **Errors:** `state` expired/invalid → "Sign-in expired, try again." Token exchange fail → retry CTA. Network → offline banner + retry.

### 2. Email magic-link (add) `P1`
- **UX:** Enter email → "Check your inbox" → tap link → returned signed-in. No passwords.
- **Backend:** issue single-use, 15-min, signed token bound to email + device hint; store hashed in `email_login_tokens`; consume on click → create session.
- **Validation:** RFC email format; lowercase+trim; throttle to 3 sends / 15 min / email.
- **Errors:** expired/used link → "Link expired, request a new one."

### 3. Phone OTP (add — strongly recommended for a dating product) `P1`
- **UX:** Enter phone (E.164 with country picker, default +91) → 6-digit code → verified. Doubles as the **first real trust signal**.
- **Backend:** SMS provider (e.g. MSG91/Twilio); OTP hashed in `phone_otps` with 5-min expiry, 5-attempt lockout; on success set `profiles.phone_verified=1` and bump `verification_level` to at least `basic` (this makes B1's badge honest).
- **Validation:** valid E.164; one active OTP per number; resend cooldown 30s, max 3/hour.
- **Errors:** wrong code (attempts left), expired, locked-out (cooldown shown).

### 4. Guest mode (redefine) `P0`
- **Today:** a client flag that resolves to `seeded_user_1` server-side (the A1 hole).
- **Target:** a true anonymous principal. Can: view **sanitised** discovery cards + public events. Cannot: see contact info, message, RSVP, host, like, view full profiles. Any gated tap → **login modal** (see Access Control). Server never maps guest → a real `user_id`.

## Session management (target)

| Concern | Design |
|---|---|
| Persistent login | Sliding 7-day session, rotated on each authenticated request (new id, old invalidated) |
| Refresh | Implicit via rotation; optional refresh token (30d) for "stay signed in" |
| Expiry | Idle > 7d ⇒ expire; absolute max 30d ⇒ re-auth |
| Token expiry mid-use | 401 → frontend `api-unauthorized` (exists, `main.jsx:369-375`) → silent refresh attempt → if fail, soft logout to `/login` preserving intended route |
| Internet disconnect | Detect offline → queue writes locally, show "reconnecting"; reads serve last cache; never destroy session on transient network error |
| Reinstall / new device | No local session ⇒ login screen; on auth, restore server-side profile/state; show "Welcome back" |
| Logout | `POST /api/auth/logout` deletes session + clears cookie + local caches (exists) |
| Sign out everywhere | New: delete all rows in `auth_sessions` for user |
| Account deletion | `DELETE /api/account` → grace period (30d soft) → hard cascade; immediate logout; export option first (H1) |

## State diagram
```
            ┌─────────┐  open app
            │  BOOT   │───────────────► check cookie
            └─────────┘
                 │ valid session            │ none
                 ▼                          ▼
            ┌─────────┐               ┌──────────┐  explore
            │ AUTHED  │               │ LOGGED-OUT├─────────► GUEST (sanitised)
            └─────────┘               └──────────┘
              │   │  401 + refresh-fail        │ gated tap
   suspended  │   └──────────────► LOGGED-OUT  ▼
              ▼                            LOGIN MODAL → AUTHED
        STATUS SCREEN (suspended/banned)
```

## Acceptance criteria
- No unauthenticated request ever resolves to a real `user_id`.
- Every login method ends in the same authed state with intended-route restoration.
- 401 attempts one silent refresh before logout.
- Banned email cannot obtain a session.
- Phone OTP success sets a real, honest `verification_level`.
