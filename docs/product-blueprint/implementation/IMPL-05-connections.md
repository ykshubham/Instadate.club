# STEP 5 — Connection System (P0)

## Current State
- "Send Vibe" → `POST /api/matches` one-directional row (`worker/index.ts:1689-1715`). `match_outcomes` status ladder exists but no user action drives it. Chats seeded, not created on acceptance. Block/reject endpoints exist (`:1938-1956`); no report system.

## Problems
- **E1** no incoming-request inbox, no accept/reject; mutual consent missing.
- **B2** no reports; blocks not enforced in lists.
- Chats not created from acceptance.

## Target State
Request → accept/reject handshake; on accept create `connections` + chat; mutual like = instant match; unmatch; block (bidirectional, enforced); report → moderation queue; notifications on each transition.

## Flow
```
DISCOVER ─request──► PENDING ─accept─► CONNECTED ─► chat opens + notify both
                       │      reject─► REJECTED (silent to sender) ─► optional block
                       │ both-liked ─► INSTANT MATCH ─► CONNECTED
                       └ 14d ───────► EXPIRED
CONNECTED ─unmatch─► CLOSED (freeze chat, hide)
ANY ─block─► hidden both ways, request voided, chat frozen
ANY ─report─► reports queue (status open)
```

## Frontend Tasks
- `CONN-FE-01` "Requests" inbox tab listing incoming pending with note + sanitised preview; Accept/Reject buttons.
- `CONN-FE-02` Send-request flow from card/profile (optional 140-char note); dedup UI ("Request sent/pending").
- `CONN-FE-03` On accept → toast + open chat; instant-match celebratory state.
- `CONN-FE-04` Unmatch action in chat header (confirm) → freeze thread.
- `CONN-FE-05` Block + Report actions on profile/chat (report reason picker + optional evidence).
- `CONN-FE-06` Notification surfacing (in-app bell) for request/accept (Step 6 notifications).
  - Action handling: a `connection_request` notification's **"View Request"** button marks the notification read immediately (drops the unread bell count and refreshes the sheet via `/api/notifications/read` → fresh `state.notifications`, no reload), then deep-links to the Connection Requests screen carrying the sender id (`/requests?from=<senderId>`). `ConnectionRequestsPage` reads `?from=` and scrolls/highlights the matching request card. `connection_accept`'s "Start Chat" likewise marks read before navigating to `/chat`.

## Backend Tasks
- `CONN-BE-01` `worker/services/connections.ts`: request/accept/reject/unmatch logic; pair dedup; 14d expiry; mutual-like auto-accept.
- `CONN-BE-02` On accept: create `connections` row + `chats` row (real `participant_a/b`), link `connection.chat_id`; drive `match_outcomes.status`.
- `CONN-BE-03` Block: bidirectional; void pending requests; freeze connection/chat; enforce via `visibleTo`.
- `CONN-BE-04` `worker/services/moderation.ts`: create report; admin list/update.
- `CONN-BE-05` Emit notifications on request/accept (and not on reject — silent).
- `CONN-BE-06` Guard: request requires `requirePublished` + `visibleTo`; cannot request self/blocked/non-visible.

## Database Tasks
- `connection_requests`, `connections`, `reports`, `notifications` (migration `0012`/`0013`). Migrate legacy `matches` semantics onto requests; keep `match_outcomes` driven for analytics.

## API Tasks
- Add: `POST /api/connections/request`, `POST /api/connections/:id/accept`, `/reject`, `DELETE /api/connections/:id`, `GET /api/connections/requests`, `GET /api/connections`.
- Add: `POST /api/reports`, `GET /api/blocks`, `DELETE /api/blocks/:id`.
- Deprecate `POST /api/matches` (alias to request during transition).

## QA Tasks
- (+) request→accept→chat; mutual instant match. (−) request to self/blocked/unpublished rejected; duplicate blocked. (E) 14d expiry; recipient deletes before accept; unmatch freezes; reject hidden from sender; block voids request; report lands in queue.

## Definition of Done
- Chat exists only after accepted connection (or shared event, Step 7).
- Reject invisible to sender; block bidirectional + enforced in all lists.
- Reports persisted + admin-visible; notifications fire on request/accept.
