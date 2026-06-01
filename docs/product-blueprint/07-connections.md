# Phase 8 — Connection Flow

## Current state
- "Send Vibe" → `POST /api/matches` inserts a one-directional `matches` row (`worker/index.ts:1689-1715`). **No incoming-request inbox, no accept/reject** (E1). `match_outcomes` has the right status ladder but no user action drives it. Chats are seeded, not created on acceptance.

## Logged-out user taps "Find Connections"
- **Login wall** modal: "Sign in to discover and connect with verified people near you."
- Options: Continue with Google / Email / Phone · Explore as guest (sanitised cards only, connect disabled → login).

## Logged-in connection lifecycle

```
DISCOVER ──like/Vibe──► REQUEST SENT ──recipient──► [ACCEPT] ─► CONNECTED ─► CHAT OPENS
                              │                       [REJECT] ─► CLOSED (hidden, optional block)
                              │ expire 14d ─────────► EXPIRED
                              └ recipient also liked ─► INSTANT MATCH ─► CONNECTED
```

### Discovery feed
- Server returns sanitised, `visibleTo`-filtered candidates (excludes blocks/rejections/banned — extend current `recommendations.ts` filtering to all feeds, B2).
- Feeds already implemented: highlyCompatible, mostReliable, recentlyAttended, verifiedMembers, nearYou, trending (`discovery.ts`).

### Filtering
- Gender, age range, distance, intent, verified-only toggle, interests. Persist to `user_preferences`.

### Requesting (Vibe)
- Optional 140-char note. Creates `connection_requests(from,to,note,status='pending',expires_at)`.
- Dedup: one active request per pair; re-request blocked until expiry.

### Recipient inbox (NEW — closes E1)
- "Requests" tab lists incoming with note + profile preview.
- **Accept** → create `connections(a,b,status='accepted')` + open chat + notify both.
- **Reject** → mark `rejected` (silent to sender) + offer block.
- Mutual likes → auto-accept ("Instant Match").

### Post-connection
- Chat unlocked (Phase 7 rule 1). Either side can block/report/unmatch at any time; unmatch freezes + hides the thread.

## Backend changes
- New `connection_requests` + `connections` tables (see Phase 12); migrate legacy `matches`/`match_outcomes` semantics onto them.
- `POST /api/connections/request`, `POST /api/connections/:id/accept`, `/reject`, `DELETE /api/connections/:id` (unmatch).
- Drive `match_outcomes` status from these actions for analytics continuity.

## Acceptance criteria
- A chat can only exist after an accepted connection (or shared event).
- Sender cannot see whether a reject happened (privacy); only "expired/no response."
- All discovery/feed lists respect blocks and status.
