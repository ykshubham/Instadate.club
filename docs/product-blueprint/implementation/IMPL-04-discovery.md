# STEP 4 — Discovery System (P1)

## Current State
- `GET /api/discovery` → `discovery.ts:6-142`, 6 feeds (highlyCompatible, mostReliable, recentlyAttended, verifiedMembers, nearYou, trending).
- `GET /api/members` `worker/index.ts:1966-2019` — all completed profiles + trust.
- Recommendations `recommendations.ts:98-182`, 1h cache; excludes blocks/rejections (`:118-121`).
- `MembersPage` `src/main.jsx:1633+` with shimmer (added) + Three.js header.

## Problems
- **B2** `/api/members` and feeds (except recommendations) do **not** filter blocks/banned/suspended → blocked users still appear.
- Returns full profiles incl. PII to guests (ties to A1).
- N+1 enrichment per rec (`discovery.ts:14-56`).
- No standard empty state for filtered/zero results (G2).

## Target State
All feeds + `/api/members` pass through a single `visibleTo` filter; sanitised DTOs for guests/non-connections; batched enrichment; consistent empty states; server-side filters.

## Frontend Tasks
- `DISC-FE-01` Filter panel: gender, age range, distance, intent, verified-only, interests → persists to `user_preferences`; sends as query params.
- `DISC-FE-02` Standard `EmptyState` component for zero results ("Loosen filters") — reuse across discovery/events/chat (G2).
- `DISC-FE-03` Card DTO: render only sanitised fields for non-connections (no phone/IG/exact distance → show city/approx).
- `DISC-FE-04` Keep shimmer; drive loading from query state (Step 11) not setTimeout.

## Backend Tasks
- `DISC-BE-01` `visibleTo(viewerId, targetId)` in `worker/authz.ts`: exclude either-direction blocks, rejected, `status != active`, self, deleted. Apply to `/api/members`, all discovery feeds, recommendations, member profile fetch.
- `DISC-BE-02` Sanitised public DTO builder: strip phone/whatsapp/IG/exact lat-long for non-connections + guests.
- `DISC-BE-03` Batch enrichment in `discovery.ts`: fetch profiles/trust/photos/interests for the rec set in set-based queries (IN clauses), not per-row loops.
- `DISC-BE-04` Server-side filter params on `/api/members` & `/api/discovery` (gender/age/distance/verified/interests).
- `DISC-BE-05` Ranking: keep compatibility score; add recency/active boost; verified boost.

## Database Tasks
- Indexes: `idx_profiles_city` exists; add composite for filter perf if needed; `users.last_active_at` for recency.

## API Tasks
- Modify `/api/members`, `/api/discovery`, `/api/recommendations`: accept filters, apply `visibleTo`, return sanitised DTOs.

## QA Tasks
- (−) blocked/rejected/banned never appear in any feed or members list; guest never receives PII. (+) filters narrow correctly; ranking sensible. (E) zero-result empty state; N+1 removed (assert query count).

## Definition of Done
- Single `visibleTo` guard on every list; blocks/status honoured everywhere.
- Guests/non-connections get sanitised DTOs only.
- Enrichment batched; empty states consistent.
