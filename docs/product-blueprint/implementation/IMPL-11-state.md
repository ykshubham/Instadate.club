# STEP 11 — State Management

## Current State
- `AuthContext.jsx` — user/session, signIn/signOut, profile cache in sessionStorage.
- `ProfileContext.jsx`, `UserContext.jsx` — profile + cache.
- App-wide state via `useApiState` polling `GET /api/state` every 3s (`src/main.jsx:43,246-328`). Optimistic `mutateState`.

## Problems
- 3s full-state poll = backend N+1 multiplier (C1/C2) + battery.
- No query cache/dedup; every screen re-derives from one giant blob.
- Optimistic updates ad-hoc.

## Target State
Lightweight query layer + targeted endpoints + realtime for chat; auth/profile contexts slimmed.

## Frontend Tasks
- `STATE-FE-01` `src/lib/api.js` central fetch (Step 1) — credentials, JSON, 401 event, retry-once, abort.
- `STATE-FE-02` `QueryClient` (lightweight: TanStack Query or a thin custom cache) with per-resource keys: `me/summary`, `me/chats`, `me/events`, `discovery`, `connections/requests`, `notifications`. Stale-while-revalidate; dedup; manual invalidate after mutations.
- `STATE-FE-03` Replace `useApiState` 3s poll with: (a) fetch-on-mount + on-focus; (b) `GET /api/updates?since=cursor` lightweight delta on interval (20–30s) or push; (c) realtime WS for active chat.
- `STATE-FE-04` Mutations: optimistic update → invalidate affected keys → reconcile on response/error.
- `STATE-FE-05` Slim `AuthContext` to {user,status,isAuthenticated,isGuest,signIn,signOut,refresh}; drop large profile blob caching (fetch via query).
- `STATE-FE-06` Offline: queue writes (idempotency keys), show reconnecting, flush on online; never destroy session on transient error.

## Backend Tasks
- `STATE-BE-01` Implement split endpoints (Step 10) returning small payloads.
- `STATE-BE-02` `GET /api/updates?since=cursor`: returns changed counters (unread, new requests, event changes) since cursor — cheap query, no full aggregation.
- `STATE-BE-03` Cache trust metrics on column; recompute on outcome write (removes per-read recompute, C3).

## Caching strategy
| Resource | TTL/strategy |
|---|---|
| me/summary | 60s SWR |
| discovery | 5min SWR + manual refresh |
| chats list | invalidate on WS event / 30s |
| active chat | realtime WS; no poll |
| notifications | invalidate on `/updates` delta |

## Realtime strategy
- Durable Object `ChatRoom` per chat (Step 6) for messages/typing/presence.
- Optional global user DO for notification push; else `/api/updates` delta poll.

## QA Tasks
- Assert query count per screen bounded; no 3s full-state poll remains; offline queue flush + dedup; optimistic rollback on error.

## Definition of Done
- `GET /api/state` removed from hot path; screens use targeted cached queries; chat realtime; backend read load drops measurably under load test.
