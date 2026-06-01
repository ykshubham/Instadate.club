# Sprint 3 — Final Review (Scale & Reliability, P2)

**Scope reviewed:** Query Layer · Updates Delta System · Realtime Chat · Read Receipts / Typing / Presence · Image Messaging · Voice Notes · Trust Metric Caching · Performance Indexes · Rate Limiting.

---

## ✅ Remediation addendum (hardening pass applied)

The reliability risks called out below have since been **fixed in code**. Summary of what changed:

| Risk | Fix | Where |
|---|---|---|
| Rate limiter non-atomic (over-admission) | Single `INSERT … ON CONFLICT … RETURNING` atomic window | `worker/services/ratelimit.ts` |
| Per-request full-table `DELETE` on hot path | Moved to `pruneRateLimits()` run from `scheduled()` cron | `ratelimit.ts`, `index.ts` |
| Realtime (DO) message path unthrottled | `checkRateLimit('msg:'+userId,60,60)` + empty/length guard in DO | `index.ts` ChatRoom |
| Attachment/voice uploads unthrottled | `checkRateLimit('att:'+userId,20,60)` on upload route | `index.ts` |
| No WS reconnect catch-up (`/since`) | `GET /api/chats/:slug/since?cursor=` + client fetch on `ws.onopen` | `index.ts`, `main.jsx` |
| No idempotency (offline resend dupes) | `client_msg_id` column + dedup on both HTTP & WS send; client sends `clientMsgId`, reconciles on echo/`ack` | mig `0027`, `index.ts`, `main.jsx` |
| No soft delete | `chat_messages.deleted_at` + `DELETE /api/messages/:id` + `deleted` WS broadcast + tombstone render | mig `0026`, `index.ts`, `main.jsx` |
| `/api/updates` mixed-timestamp comparison unsafe | All comparisons wrapped in `datetime()` both sides | `index.ts` |
| Missing presence/history indexes | `idx_users_last_active`, `idx_chat_messages_chat_created` | mig `0026` |

**Correction to original finding #7 (Trust caching):** the claim that the trust cache is *not* invalidated on verification was **incorrect** — `verifyAction` already calls `recomputeTrustMetrics` (`worker/services/settings.ts:128`). No change was needed; the finding is withdrawn.

**Still deferred (not reliability-blocking):** the frontend query-layer/`api.js` build-out and removal of the 3s `/api/state` poll (§1–§2) remain open product work, and NSFW scan hook + R2 orphan cleanup on delete remain a moderation follow-up. The `/since` endpoint now removes the *reliability* dependency on the poll for chat reconnects even though the poll itself still runs.

All changes verified: `npm run build` (worker typecheck + vite) passes; migrations `0026`/`0027` apply ✅.

---

**Method:** each plan (IMPL-06 chat, IMPL-11 state, IMPL-13 sprint table) cross-checked against the shipped code (`worker/index.ts`, `worker/services/*.ts`, `src/main.jsx`) and the migrations actually applied (`0020`–`0024`).

**Headline:** the realtime, attachment, trust-cache, index, and rate-limit work is **functionally shipped and builds clean**. The gaps are concentrated in three places the plan explicitly called for and the code does not deliver: (1) the **full-state 3s poll was never removed** (the central DoD of both IMPL-06 and IMPL-11), (2) several **chat sub-features specced as Sprint-3 scope are absent** (soft delete, `/since` fallback, idempotency, NSFW hook, message-report), and (3) the **frontend query layer (`api.js` + QueryClient) was not built** — the app still runs on the legacy `useApiState` blob.

Status legend: ✅ done · ⚠️ partial / risk · ❌ missing.

---

## 1. Query Layer (STATE-FE-01/02, STATE-BE-01)

| Plan item | Status | Evidence |
|---|---|---|
| Split read endpoints returning small payloads (`me/summary`, `me/chats`, `me/events`) | ❌ | No split endpoints exist; `GET /api/state` (`index.ts:679`) still returns the full aggregate blob (profile + events + chats + recommendations + discovery + instant plans + trust + notifications + settings in one response). |
| `src/lib/api.js` central fetch | ❌ | `src/lib/` does not exist. Each call hand-rolls `fetch(..., {credentials, cache})`. |
| `QueryClient` / per-resource cache + SWR + dedup | ❌ | No `QueryClient`/`useQuery`/cache module anywhere in `src/`. App-wide state is still the single `useApiState` poll (`main.jsx:44`, `442`). |

**Missing APIs:** `GET /api/me/summary`, `/api/me/chats`, `/api/me/events`, `/api/me/pending-reviews`.
**Missing dependencies:** query-cache lib (TanStack Query or thin custom) — never added to `package.json`.
**Missing cache invalidation:** there is no key-based invalidation layer at all; the only "cache" is `sessionStorage` profile caching in `AuthContext`. Mutations re-fetch the whole blob instead of invalidating a key.

> **Assessment:** This task is effectively **not started**. Everything downstream that depended on "bounded queries per screen" (the Sprint-3 exit criterion *"no N+1"*) is unverifiable because the blob path is still the hot path.

---

## 2. Updates Delta System (STATE-BE-02, STATE-FE-03)

| Plan item | Status | Evidence |
|---|---|---|
| `GET /api/updates?since=cursor` returns cheap changed-counters | ✅ (backend) | `index.ts:2051` — returns `notifications/connections/events` booleans + `unreadNotificationsCount` + `pendingRequestsCount`, cursor-based. Queries are bounded `COUNT(*)`s. |
| Replace 3s full poll with delta on 20–30s interval | ❌ | **`/api/updates` is never called from the frontend** (`grep` returns zero hits in `src/`). The client still polls `/api/state` every `CLOUD_STATE_POLL_MS = 3000` (`main.jsx:45,442`). |

**Missing realtime/wiring:** the delta endpoint exists but is **orphaned** — no consumer. The plan's intent (delta poll *replaces* full poll) is unmet; both the cheap endpoint and the expensive poll coexist, with only the expensive one active.

**Missing cache invalidation:** delta result is meant to *invalidate* `notifications`/`connections`/`chats` keys (IMPL-11 caching table). With no query layer, there is nothing to invalidate, so the endpoint's booleans have no effect even if wired.

**Correctness risk (timestamps):** `/api/updates` compares `created_at`/`updated_at` against the `since` cursor. Per the project memory ([[timestamp-format-gotcha]]), D1 mixes SQLite `CURRENT_TIMESTAMP` (no `Z`) with JS ISO (`Z`) timestamps; string comparison across the two formats can silently drop or double-count rows. The cursor is JS-ISO (`new Date().toISOString()`) but most rows are SQLite-format — **string `>` comparison is unsafe here.** Needs a QA case.

> **Assessment:** Backend ✅, integration ❌. Marked partial because the DoD ("3s full poll removed") fails.

---

## 3. Realtime Chat (CHAT-BE-03, CHAT-FE-03)

| Plan item | Status | Evidence |
|---|---|---|
| Durable Object `ChatRoom` per chat; persist→fan-out | ✅ | `ChatRoom` DO (`index.ts:2866+`), WS upgrade route `/api/chats/:slug/ws` (`:2210`) with participant authz before upgrade. Message persisted to D1 then `broadcast()`. |
| WS client + reconnection | ✅ | `main.jsx:3268` — connect/reconnect (3s backoff), dev-port rewrite to `:8787`, dedup-on-receive. |
| `assertCanSend` enforced on realtime path | ✅ | DO `message` handler calls `assertCanSend` before persisting (`index.ts:2957`). |
| **Full-state poll removed for chat** (DoD) | ❌ | The 3s `/api/state` poll still runs globally and `sendChatMessage` HTTP path returns `getState(...)` (`index.ts:2294`). Chat is realtime *additively* on top of the poll, not instead of it. |
| `GET /api/chats/:id/since?cursor=` fallback | ❌ | Route does not exist. If the WS drops and the DO is cold, there is **no catch-up fetch** — the client relies on the next full-state poll to reconcile, which is exactly what the plan aimed to remove. |
| Idempotency / client message id | ❌ | No client-message-id; dedup is best-effort by server-assigned id (`main.jsx:3300`). An offline resend produces duplicates (CHAT-BE-07). |

**Missing APIs:** `GET /api/chats/:id/since?cursor=`, `DELETE /api/messages/:id`.
**Missing realtime states:** **presence is in-memory only.** `ChatRoom.sessions` is a `Map` on the DO instance with no `state.storage` / hibernation API (`grep`: no `acceptWebSocket`/`state.storage`). On DO eviction all presence is lost and not rehydrated; `last_active_at` is updated on every authed request (`index.ts:1773`) but the thread header's online/last-seen is driven only by live WS presence, so a cold peer shows neither.
**Missing dependencies:** none (DO binding + migration present in `wrangler.jsonc`).

> **Assessment:** Realtime transport ✅ and solid. But two plan-scoped deliverables (`/since` fallback, poll removal) are missing, so the reliability goal ("WS delivery; poll removed") is **half-met**. The `/since` gap is the most material reliability hole: reconnect correctness currently *depends on the very poll the sprint set out to delete.*

---

## 4. Read Receipts / Typing / Presence (CHAT-BE-04, CHAT-FE-02)

| Plan item | Status | Evidence |
|---|---|---|
| `message_reads` table + writes | ✅ | `migrations/0020`; inserts on WS connect, on `read` event, on `/api/chats/:slug/read` (`index.ts:2251`), and DO connect (`:2932`). |
| Read receipt UI (sent/read) | ✅ | `read` + `read_all` WS events flip message status (`main.jsx:3310,3327`). |
| Typing indicator | ✅ | `typing` event + debounce timeout (`main.jsx:3410`); animated dots. |
| Presence (online/last-seen) | ⚠️ | Live presence works while both sockets are open; **no durable last-seen surfaced** when peer is offline (see §3 — presence is ephemeral DO state). |

**Missing realtime states:**
- **No read-receipt back-fill on reconnect.** `read_all` only fires on a live connect event; if the peer read messages while you were disconnected and the DO later evicts, your ticks never update until a fresh full-state load (which derives `is_read_by_peer` via subquery, `index.ts:863`). Again this leans on the poll.
- **Typing has no server timeout/guard:** a dropped socket mid-"typing:true" can leave a stuck indicator on the peer until the next message (the false is sent on send/blur only).

**Missing QA coverage:** peer-offline last-seen; typing-stuck-on-disconnect; read receipt across DO eviction; multi-tab same-user presence (the `sessions` map keys by userId with an array — partially handled, untested).

> **Assessment:** ✅ for the happy path; ⚠️ for the durability/edge states the plan's QA row called out ("read/typing/online" under realistic disconnects).

---

## 5. Image Messaging (CHAT-BE-05, CHAT-FE-04)

| Plan item | Status | Evidence |
|---|---|---|
| `chat_messages.attachment_url` column | ✅ | `migrations/0021`. |
| Upload to R2 with type/size check | ✅ | `uploadChatAttachment` (`index.ts:1547`): allow-list of image+audio MIME, 8 MB cap, R2 `put`, message row + WS broadcast. |
| Serve with participant authz | ✅ | `serveChatAttachment` (`index.ts:1607`) checks membership before streaming. |
| **NSFW scan hook** | ❌ | Plan: *"type/size check, NSFW scan hook."* No scan/hold/quarantine path; uploads are immediately live. |
| Soft delete of attachment message | ❌ | No `deleted_at` on `chat_messages` (CHAT-BE-06). |

**Missing database changes:** `chat_messages.deleted_at` (specced for `0013`/0020 era; never added). Without it, "message deleted" rendering and the purge job are impossible.
**Missing APIs:** `DELETE /api/messages/:id` (soft delete) — shared gap with §3.
**Missing QA coverage:** oversized/again wrong-MIME upload rejection (handler exists, no test); cross-participant attachment access (403 path); orphaned R2 object cleanup when a message is removed.

> **Assessment:** Core upload/serve ✅. Moderation-adjacent pieces (NSFW hook, soft delete) ❌ — these were in-scope for Sprint 3 chat per IMPL-06.

---

## 6. Voice Notes (CHAT-BE-05, CHAT-FE-04)

| Plan item | Status | Evidence |
|---|---|---|
| Record + upload voice note | ✅ | MediaRecorder flow (`main.jsx:3490+`), audio MIME types in the R2 allow-list, body label `[Voice Note]` (`index.ts:1574`). |
| **Cap recording length** | ⚠️ | Client caps at 60s (`main.jsx:3500`). **Cap is client-side only** — same 8 MB R2 byte-cap as images is the only server bound; a crafted upload can exceed 60s within 8 MB. |
| Playback UI | ✅ | Attachment rendered via `/api/chats/:slug/attachments/:id`. |

**Missing dependencies:** none.
**Missing realtime states:** voice messages broadcast over WS like images ✅, but **no "recording…" presence signal** to the peer (minor; not specced, noting for parity with typing).
**Missing QA coverage:** server-side duration enforcement; mic-permission-denied path (handled with `alert`, untested); voice note delivery over WS vs HTTP fallback parity.

> **Assessment:** ✅ functionally; ⚠️ the "voice cap" QA item (IMPL-06) is only enforced on the trusted client.

---

## 7. Trust Metric Caching (STATE-BE-03)

| Plan item | Status | Evidence |
|---|---|---|
| Cache trust on column; recompute on outcome write (no per-read recompute) | ✅ | `would_meet_again_pct` column (`migrations/0022`); `recomputeTrustMetrics` writes back the cache row; `recordMeetupOutcome` recomputes for both parties on write (`trust.ts:267`). Reads use `getOrInitializeTrustMetrics` (cache-first). |
| Removes C3 per-read recompute | ⚠️ | Mostly. But `getProfile` still calls `getOrInitializeTrustMetrics`, and `/api/members` calls it **per member in a loop** (`index.ts:2584`) — cache-first so no recompute, **but it is a per-row query (latent N+1 read).** Acceptable for cache, flagged for the load-test exit criterion. |

**Missing cache invalidation:** trust cache is recomputed on **meetup outcomes** and on **profile PATCH** (`index.ts:1786`), but **not on verification changes via `/api/settings/verify`** (`index.ts:2108` calls `verifyAction` only). A user who verifies phone/IG won't see `verification_score`/`is_verified` refresh in the trust cache until their next profile save or outcome — a stale-cache bug.
**Missing QA coverage:** assert no recompute on read; assert recompute fires on verify (currently would fail); concurrent outcome writes for the same target (two `UPDATE ... + 1` races — D1 serializes, but untested).

> **Assessment:** ✅ on the core DoD; one real **missing invalidation trigger** (verification → trust) and one latent read-loop to watch.

---

## 8. Performance Indexes (DB — plan "0014", shipped 0023)

| Plan item | Status | Evidence |
|---|---|---|
| Indexes live | ✅ | `migrations/0023_perf_indexes.sql` — reports(reporter), reports(resolved_by), meetup_feedback(target,outcome), recommended_users(generated_at), event_attendees(event,status,user). Applies clean (verified earlier). |

**Gaps vs. the queries that actually run hot:**
- **No index for `message_reads` peer-read subquery** beyond `(chat_id,user_id)` (`0020`) — the hot subquery in `getState` filters `message_id` + `user_id` (`index.ts:863`); covered enough by PK, acceptable.
- **No index on `users.last_active_at`** despite it being written on *every* authed request (`index.ts:1773`) and read for presence/last-seen ordering. Write-heavy, occasionally sorted — candidate.
- **No index on `chat_messages(chat_id, created_at)` confirmed for the per-chat history load** — used in `getState` loop and thread load; worth verifying it exists from `0001`.
- Plan numbering drift: sprint table says "Perf indexes (0014)" but reports/feedback indexes shipped as **0023**, and 0014 is the *reports table*. Doc/během reality mismatch — see §Cross-cutting.

**Missing QA coverage:** `EXPLAIN QUERY PLAN` assertions on the discovery/members/getState hot queries (the exit criterion was "load test p95 met; no N+1" — no load-test artifact exists in the repo).

> **Assessment:** ✅ indexes shipped; coverage is reasonable but **not driven by measured hot paths**, and the **load test that defines Sprint-3 exit was not run/recorded.**

---

## 9. Rate Limiting (AUTH-BE-09)

| Plan item | Status | Evidence |
|---|---|---|
| Limits fire | ✅ | `ratelimit.ts` D1 fixed-window; `rate_limits` table (`migrations/0024`); 429 with `Retry-After` + `X-RateLimit-*`. |
| Applied to sensitive endpoints | ✅ (partial coverage) | auth start/login/otp/magic (`5/60s` per IP), event RSVP (`10/60s`), connection request (`10/3600s`), messages (`60/60s`), reports (`5/3600s`). |

**Missing coverage (endpoints the plan implies but are unlimited):**
- **`/api/updates`** — if it ever gets wired to a 20–30s interval per client it's fine, but it's currently **unlimited** and would be the highest-frequency endpoint.
- **`/api/state`** — the 3s poll itself is **unrate-limited** (by design it's the user's own session, but it's the dominant load source and the thing Sprint 3 wanted gone).
- **Chat attachment / voice upload** (`/api/chats/:slug/attachments`) — **no rate limit**; an authed user can spam 8 MB R2 uploads. Notable cost/abuse gap.
- **WebSocket message flood** inside the DO — the HTTP message route is limited (`60/60s`) but the **DO `message` handler has no rate limit**, so the realtime path bypasses the throttle entirely.

**Correctness/robustness risks:**
- **Fixed-window, not atomic.** `SELECT` then `UPDATE count+1` is a read-modify-write; concurrent requests can both read `count<limit` and both pass (D1 has no row lock across statements). Under burst this **over-admits**. A single `INSERT ... ON CONFLICT DO UPDATE SET count=count+1 RETURNING count` would be atomic.
- **Global DELETE on every call.** `DELETE FROM rate_limits WHERE reset_at <= ?` runs on *every* `checkRateLimit` (`ratelimit.ts:23`) — a full-table scan-delete per request; under load this is itself a bottleneck. Should be a cron sweep, not inline.
- IP key uses `cf-connecting-ip` with `127.0.0.1` fallback — in any context without that header, **all users share one bucket** (`auth_ip:127.0.0.1`).

**Missing QA coverage:** burst/concurrency test for over-admission; per-IP isolation; attachment-upload limit; DO-path flood.

> **Assessment:** ✅ shipped and wired to the key auth/write paths; ⚠️ **atomicity + inline-cleanup** are real reliability concerns for a "scale" sprint, and the **realtime + upload paths are unprotected.**

---

## Cross-cutting findings

### Missing dependencies
- Query-cache library + `src/lib/api.js` (§1) — never added; the single biggest unbuilt piece.
- No load-testing / EXPLAIN tooling committed, yet Sprint-3 exit is defined by a p95 load target (§8).

### Missing APIs (consolidated)
| Endpoint | For | Plan ref |
|---|---|---|
| `GET /api/me/summary` `/me/chats` `/me/events` `/me/pending-reviews` | Query layer split | STATE-BE-01 |
| `GET /api/chats/:id/since?cursor=` | WS reconnect catch-up | CHAT-FE-03 |
| `DELETE /api/messages/:id` | Soft delete | CHAT-BE-06 |
| (wire) `GET /api/updates` from client | Delta poll | STATE-FE-03 |

### Missing database changes
- `chat_messages.deleted_at` (soft delete + purge) — **not shipped**.
- `meetup_feedback` consolidation (plan "0016", DoD *"single source of truth"*) — **not done**; `recordMeetupOutcome` instead writes **both** legacy and new column sets into one row (`trust.ts:216-237`), i.e. it *duplicates* fields rather than consolidating. The dual-write is the opposite of the stated goal and a future-bug magnet.
- Optional: `users.last_active_at` index (§8).

### Missing realtime states
- Durable presence / last-seen across DO eviction (§3, §4).
- Read-receipt and typing reconciliation on reconnect (§4).
- DO presence has no `state.storage`/hibernation — ephemeral.

### Missing cache invalidation
- No query-key invalidation layer exists at all (§1).
- `/api/updates` deltas invalidate nothing (§2).
- Trust cache not invalidated on verification action (§7).

### Missing QA coverage (net-new test cases this review surfaces)
1. `/api/updates` timestamp-format comparison correctness ([[timestamp-format-gotcha]]).
2. Rate-limit burst over-admission (concurrent requests, same key).
3. Per-IP rate-limit isolation when `cf-connecting-ip` absent.
4. Attachment/voice upload rate limiting + 8 MB / 60 s server enforcement.
5. WS message-flood throttle inside DO.
6. Presence/last-seen with peer offline; typing-stuck-on-disconnect.
7. Read receipts across DO eviction / reconnect.
8. Cross-participant attachment access → 403.
9. Trust cache refresh after `/api/settings/verify`.
10. `EXPLAIN QUERY PLAN` on getState/discovery/members hot queries; recorded load test for p95 exit.

### Documentation / numbering drift
The sprint table (IMPL-13) references migrations `0014` (perf) and `0016` (feedback consolidate); reality shipped perf as **0023**, rate-limiting as **0024**, trust caching as **0022**, and **no** feedback-consolidation migration. The plan and the migration history have diverged and should be reconciled so the QA matrix references real artifacts.

---

## Verdict by task

| Task | Verdict | Blocking for Sprint-3 exit? |
|---|---|---|
| Query Layer | ❌ Not started | **Yes** — exit requires "screens use targeted cached queries". |
| Updates Delta | ⚠️ Backend only, orphaned | **Yes** — full poll not removed. |
| Realtime Chat | ⚠️ Transport done; `/since` + poll-removal missing | **Yes** — DoD "poll removed" unmet; reconnect leans on poll. |
| Read/Typing/Presence | ✅ happy path / ⚠️ durability | Partial. |
| Image Messaging | ✅ core / ❌ NSFW hook, soft delete | Partial. |
| Voice Notes | ✅ / ⚠️ server cap | No. |
| Trust Caching | ✅ / ⚠️ verify-invalidation gap | No (fix the invalidation). |
| Perf Indexes | ✅ / ⚠️ not load-validated | Exit needs the load test. |
| Rate Limiting | ✅ / ⚠️ atomicity + uncovered paths | No (harden before GA). |

## Recommended exit-blockers to close before declaring Sprint 3 done
1. **Remove the 3s `/api/state` poll from the hot path** and wire `/api/updates` (the literal DoD of two plans). Requires the query-layer split (`/me/*` endpoints) — currently the largest unbuilt item.
2. **Add `GET /api/chats/:id/since?cursor=`** so WS reconnect no longer depends on the poll.
3. **Make `checkRateLimit` atomic** (`ON CONFLICT DO UPDATE ... RETURNING`) and move the prune to cron; add limits to attachment uploads and the DO message path.
4. **Invalidate trust cache on verification**; decide and execute the `meetup_feedback` consolidation (stop the dual-write).
5. **Run and record the load test** that defines the Sprint-3 exit ("p95 met; no N+1").

Items that can defer to a hardening pass without blocking beta: `chat_messages.deleted_at` + `DELETE /api/messages/:id`, NSFW scan hook, durable presence/last-seen, server-side voice duration cap.
