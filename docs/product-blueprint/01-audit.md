# Phase 1 — Complete Product Audit

Every issue is grounded in the actual code. Priority key:
**P0** = blocks public launch · **P1** = fix before scale · **P2** = quality/UX · **P3** = nice-to-have.

---

## A. Authentication & Session

### A1 — Dev/guest backdoor authenticates anyone as `seeded_user_1` `P0`
- **Problem.** `authenticatedUserIdFrom()` (`worker/index.ts:217-236`) returns `seeded_user_1` for (a) any request when `ENVIRONMENT` is `development`/`staging`, and (b) **any unauthenticated GET in any environment**.
- **Why.** Built to let guests browse seeded data without login.
- **Impact.** Every anonymous visitor reads a real user's private profile/state (`/api/profile`, `/api/state`). If `ENVIRONMENT` is ever mis-set in prod, anonymous users get **full write access** as that user. Privacy breach + impersonation.
- **Fix.** Introduce a true read-only `guest` principal that can only hit explicitly public, **sanitised** endpoints (discovery cards, public events). Never resolve an unauthenticated request to a real `user_id`. Gate writes behind a verified session only. Remove the GET fallback.
- **Priority. P0.**

### A2 — Single 30-day opaque session token, no rotation/refresh `P1`
- **Problem.** One `instadate_session` cookie, 30-day fixed expiry, no rotation, no refresh, no idle timeout (`worker/index.ts:152-153, 209-215, 1246-1259`).
- **Impact.** A leaked cookie = 30 days of full access; no revocation beyond manual logout; no "log out other devices."
- **Fix.** Short-lived access session (e.g. 7d sliding) + rotation on each use; a `sessions` view with device/last-seen; "sign out everywhere"; rotate on privilege change.
- **Priority. P1.**

### A3 — OAuth `state` stored in plaintext; `redirectTo` open-redirect surface `P1`
- **Problem.** `oauth_states.state` stored raw (`worker/index.ts:1141-1143`); `redirectTo` validated only by `startsWith('/')` (`:1255`).
- **Impact.** DB read exposes live state tokens; `//evil.com` style values can slip protocol-relative redirects past a naive `startsWith('/')`.
- **Fix.** Hash state at rest; allowlist redirect targets (path-only, must start with single `/` and not `//`).
- **Priority. P1.**

### A4 — Only Google + guest; no email / OTP / phone-primary `P1`
- **Problem.** No email or OTP login (`AuthContext.jsx`, `worker/index.ts` auth block). Positioning promises "verified real people," yet there is no phone verification at auth time.
- **Impact.** Users without Google are locked out; weak identity assurance for a safety-first dating product.
- **Fix.** Add Email (magic-link) and **Phone OTP** (OTP is the strongest cheap signal for dating safety). See `02-authentication.md`.
- **Priority. P1.**

### A5 — No rate limiting on auth (or any) endpoints `P1`
- **Problem.** No throttling on `/api/auth/*`, messaging, or match creation.
- **Impact.** Credential-callback abuse, spam messaging, enumeration.
- **Fix.** Per-IP + per-user rate limits (Cloudflare WAF / Durable Object / KV counters).
- **Priority. P1.**

---

## B. Trust, Safety & Moderation

### B1 — Verification is cosmetic (seeded), not earned `P0`
- **Problem.** `verification_level` (`basic`/`identity`/`highly_verified`) is hardcoded in the seeder (`worker/services/seeder.ts:81…261`); there is no flow that performs phone/selfie/ID checks. Badges render purely from this field (`ProfileDashboard.jsx:12-23`).
- **Impact.** The core promise ("Verified profiles") is **false** for any real user. Real safety and legal/representation risk.
- **Fix.** Either (a) build real verification (phone OTP → selfie liveness → optional ID) that sets the level, or (b) until then, **relabel** badges honestly ("Profile complete," "Instagram linked") and disable "Highly Verified." Recommend (a) phased: phone now, selfie next.
- **Priority. P0.**

### B2 — Blocks & rejections recorded but **not enforced everywhere** `P0`
- **Problem.** `user_blocks`/`user_rejections` are written (`worker/index.ts:607-616`) and excluded from **recommendations** (`recommendations.ts:119-121`), but **`/api/members`, `/api/state` chats, discovery feeds, and message send do not filter on blocks.** No report table exists at all.
- **Impact.** A blocked user still appears in the member list, can still be messaged, and there's no way to report abuse. Unacceptable for a dating app.
- **Fix.** Centralise a `visibleTo(viewer, target)` guard applied to **every** list and the message-send path. Add a `reports` table + `POST /api/reports` + admin review queue. Block must be bidirectional and hide both ways.
- **Priority. P0.**

### B3 — No suspended / banned account states `P0`
- **Problem.** No `account_status` column; nothing in `ProfileDashboard.jsx` or the worker handles suspended/banned users (only `isGuest` — itself hardcoded `false` at `:212`).
- **Impact.** Moderation outcomes can't be enforced; a reported abuser keeps full access.
- **Fix.** Add `users.status` (`active|suspended|banned|deactivated`) + middleware that short-circuits to a status screen. See `04-profile.md` States 4–5.
- **Priority. P0.**

### B4 — `isGuest = false` hardcoded disables the entire logged-out Profile experience `P1`
- **Problem.** `ProfileDashboard.jsx:212` pins `isGuest=false`, so the `GatekeeperAdmissions` logged-out branch (`:300-329`) is dead code.
- **Impact.** Logged-out users see a dashboard bound to `seeded_user_1`'s data instead of a login wall (compounds A1).
- **Fix.** Derive guest/auth state from `AuthContext`, not a literal. Render the login-wall state for unauthenticated users.
- **Priority. P1.**

---

## C. Performance & Scalability

### C1 — `getState()` is a per-request N+1 aggregation bomb `P0`
- **Problem.** `getState()` (`worker/index.ts:662-953`) is called on **every** mutation *and polled every 3s* (`main.jsx:43`). It loops events × {feedback, RSVP, no-show, host trust}, chats × messages, outcomes × photos, plus full discovery (each rec → profile+user+trust+photos+interests). Easily **100+ queries per call**.
- **Impact.** With the 3s poll, every active client issues ~20 expensive aggregations/min. Falls over well before product-market fit; D1 row-read costs explode.
- **Fix.** (1) Split `/api/state` into small, lazy, cacheable endpoints; (2) stop polling — move to event-driven refresh or longer intervals; (3) batch queries (one feedback/RSVP query per page, not per row); (4) denormalise event quality + host trust onto rows, recompute on write; (5) cache trust metrics.
- **Priority. P0.**

### C2 — 3-second full-state polling `P1`
- **Problem.** `CLOUD_STATE_POLL_MS = 3000` re-fetches the entire app state every 3s (`main.jsx:43, 310-325`).
- **Impact.** Bandwidth + backend load multiplier on C1; battery drain on mobile.
- **Fix.** Replace with on-demand refetch after mutations + a lightweight `/api/updates?since=` cursor, or WebSocket/Durable Object for chat only. Raise interval to 20–30s as an interim.
- **Priority. P1.**

### C3 — Trust score recomputed on every read; missing indexes `P2`
- **Problem.** Trust recalculated per discovery/recommendation response (`trust.ts:76-151`); no index on `meetup_feedback(target_user_id, match_outcome_id)`, none on `recommended_users(generated_at)`.
- **Fix.** Cache trust on a column, recompute on outcome change; add the indexes.
- **Priority. P2.**

---

## D. Data Integrity & Schema

### D1 — Loose foreign keys: `matches.target_member_id`, `chats.participant_b_user_id` `P1`
- **Problem.** These reference users as plain strings, not FKs (`migrations/0001`).
- **Impact.** Orphan matches/chats; the recent "Unknown" chat-name bug stems directly from `participant_b_user_id` being unset/loose.
- **Fix.** Migrate to real FKs; backfill; enforce NOT NULL where applicable.
- **Priority. P1.**

### D2 — `meetup_feedback` column redundancy across migrations 0005→0008 `P2`
- **Problem.** Overlapping columns track the same thing (`showed_up` vs `meetup_happened`+`rating_stars` vs `rating`+`would_meet_again`+`feedback`).
- **Impact.** Ambiguous source of truth; bug surface.
- **Fix.** Consolidate to one canonical set; migrate + drop the rest.
- **Priority. P2.**

### D3 — Missing tables: `notifications`, `reports`, `account_status`, real `connections` `P1`
- **Problem.** No notifications model; no abuse reports; no moderation status; "connection" is only a one-directional `matches` row with no accept/reject.
- **Fix.** Add them (see `11-database-api.md`).
- **Priority. P1.**

---

## E. Connections & Chat Logic

### E1 — Connection flow is one-directional; no accept/reject `P0`
- **Problem.** "Send Vibe" inserts a `matches` row (`worker/index.ts:1689-1715`); the recipient has **no inbox of incoming requests and no accept/reject** UI. `match_outcomes` has the right statuses but nothing drives them from a user action.
- **Impact.** "Find a Partner" has no mutual-consent handshake — the heart of the product is missing. Chats are seeded rather than created by mutual acceptance.
- **Fix.** Build incoming-requests inbox + accept/reject; on accept, create the chat and a `connections` record. See `07-connections.md`.
- **Priority. P0.**

### E2 — Anyone-can-message gating is inconsistent / bypassable `P1`
- **Problem.** Message send (`POST /api/chats/:slug/messages`, `worker/index.ts:1730-1751`) checks the chat exists but **not** that the sender is a participant, nor that a connection was accepted, nor block status. The "voice verification" gate is **client-side only** (`main.jsx:2660`).
- **Impact.** Crafted requests can post to chats the user isn't in; the safety gate is trivially bypassed.
- **Fix.** Server must verify sender ∈ chat participants, connection accepted, neither party blocked, before persisting. Enforce the verification gate server-side if it's a real feature.
- **Priority. P1.**

### E3 — No real-time chat; 3s poll only `P2`
- **Problem.** No typing/read-receipts/online/images/voice/delete despite UI hints; updates via the full-state poll.
- **Fix.** Durable Object or WebSocket channel per chat; add message states. See `06-chat.md`.
- **Priority. P2.**

---

## F. Events

### F1 — No edit, no cancel endpoint, no waitlist `P1`
- **Problem.** Create/join/leave exist; **no edit** path; cancellation only via a `deleted_at` column with no endpoint; capacity is a hard 409 with **no waitlist** (`worker/index.ts:1114-1118`).
- **Impact.** Hosts can't fix typos or cancel; full events dead-end interested users.
- **Fix.** Add `PATCH /api/events/:id` (host only), `POST /api/events/:id/cancel` (notifies attendees), and a waitlist with auto-promotion. See `08-events.md`.
- **Priority. P1.**

### F2 — Host-approval flow exists in API but isn't surfaced for attendees `P2`
- **Problem.** `approval_required` + approve endpoint exist; the join UX doesn't communicate "pending approval" state clearly.
- **Fix.** Add pending/approved/declined attendee states in UI.
- **Priority. P2.**

---

## G. UX / State / Empty & Error States

### G1 — Dev-server fragility & env coupling (operational) `P2`
- **Problem.** Vite dev background process died repeatedly (exit 127) during this session; "Cloud storage unavailable" toast appears whenever the worker isn't up (`main.jsx:702`).
- **Impact.** Confusing for users when backend hiccups; the toast is the only signal.
- **Fix.** Graceful degraded mode with retry + clearer messaging; health check.
- **Priority. P2.**

### G2 — Inconsistent empty states `P2`
- **Problem.** Chat has a good empty state (`main.jsx:2597-2611`); **events and filtered discovery have none** — they render animation/blank.
- **Fix.** Standard empty-state component across all lists.
- **Priority. P2.**

### G3 — Onboarding collects `goal`/`energy` then discards them `P2`
- **Problem.** `OnboardingFlow.jsx` gathers goal+energy (`:102-103`) but never persists; redirects to `/login`. Data lost.
- **Impact.** Users re-enter preferences; wasted funnel step.
- **Fix.** Persist to a pending-profile draft (local) and apply post-auth. See `03-onboarding.md`.
- **Priority. P2.**

### G4 — Profile completion ignores mandatory fields `P3`
- **Problem.** Completion % is computed from 6 *optional* items (`ProfileDashboard.jsx:25-59`); a profile is `completed=true` once `fullName` is set (`worker/index.ts`), decoupling the meter from real readiness.
- **Fix.** Weight mandatory fields; see `04-profile.md` scoring model.
- **Priority. P3.**

### G5 — Hardcoded financial/safety copy ("Rs. 1,200 referral balance," "Live safety check-in active") `P2`
- **Problem.** `ProfileDashboard.jsx:1138-1243` shows billing/safety claims with no backing systems.
- **Impact.** Misleading; potential consumer-protection issue.
- **Fix.** Remove or back with real data.
- **Priority. P2.**

---

## H. Privacy & Compliance

### H1 — No account deletion / data export `P0`
- **Problem.** No delete-account endpoint or UI; settings list has none.
- **Impact.** GDPR/DPDP (India) "right to erasure" non-compliance; app-store rejection risk (Apple requires in-app deletion).
- **Fix.** `DELETE /api/account` with cascade + grace period; data export. See `09-settings.md`.
- **Priority. P0 (store-blocking).**

### H2 — Unencrypted profile cache in `sessionStorage` `P3`
- **Problem.** `instadate_profile_cache` stored plaintext (`ProfileContext.jsx`).
- **Impact.** XSS could read it (mitigated by HttpOnly session).
- **Fix.** Minimise cached PII; clear on logout (already partially done).
- **Priority. P3.**

---

## Priority Roll-up
| P0 (launch-blocking) | P1 (pre-scale) | P2 (quality) | P3 |
|---|---|---|---|
| A1 backdoor · B1 fake verification · B2 block/report enforcement · B3 ban states · C1 getState N+1 · E1 connection handshake · H1 account deletion | A2 sessions · A3 oauth state · A4 email/OTP · A5 rate limit · B4 isGuest · C2 polling · D1 FKs · D3 missing tables · E2 message authz · F1 event edit/cancel/waitlist | C3 trust cache · D2 feedback schema · E3 realtime chat · F2 approval UX · G1 degraded mode · G2 empty states · G3 onboarding persist · G5 fake copy | G4 completion model · H2 cache |
