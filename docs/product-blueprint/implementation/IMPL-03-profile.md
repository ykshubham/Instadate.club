# STEP 3 — Profile System (P0/P1)

## Current State
- `src/ProfileDashboard.jsx` (~3300 lines). `getProfileCompletion()` `:25-59` uses 6 optional items only. `isGuest=false` hardcoded `:212` → only complete-dashboard branch renders; `GatekeeperAdmissions` logged-out branch `:300-329` is dead code.
- Profile fields/validation `worker/index.ts:154-170`. Photos in R2 `:1419-1557` (max 6, 8MB). Verification levels seeded only (`seeder.ts`).
- `ProfileContext.jsx`, `UserContext.jsx` hold profile + cache.

## Problems
- **B4** single branch renders for all states.
- **G4** completion ignores mandatory fields; `completed=true` once `fullName` set.
- **B3** no suspended/banned UI.
- **G5** fake billing/safety copy (`:1138-1243`).
- **B1** verification cosmetic.

## Target State
Five render states driven by `AuthContext`+`accountStatus`+`completed`: Logged-out wall · Incomplete (mandatory-first checklist) · Complete dashboard · Suspended · Banned. Mandatory-aware completion meter. Honest badges.

## Frontend Tasks
- `PROF-FE-01` Top-level `ProfileRouter` selecting state component from auth/status/completed (remove `:212` literal).
- `PROF-FE-02` `LoggedOutProfile` (login wall, benefits, method buttons, explore-as-guest) — wire real `GatekeeperAdmissions`.
- `PROF-FE-03` `IncompleteProfile`: new completion meter; ordered checklist (mandatory first) deep-linking to editor steps; "Add a photo to appear in discovery" alerts.
- `PROF-FE-04` `CompleteProfile`: keep dashboard; wire stats to real data (events joined/hosted, connections, reliability, no-shows from `/api/me/summary`); honest verification badges; remove fake billing/safety copy (`:1138-1243`).
- `PROF-FE-05` `SuspendedProfile` / `BannedProfile` screens (reason, until, appeal CTA).
- `PROF-FE-06` Rewrite `getProfileCompletion()` to weighted model: mandatory 60% (name/age/gender/photo/city/intent 10% each) + quality 40% (≥3 photos 10, bio≥40 8, interests≥3 7, phone_verified 8, instagram_verified 7).
- `PROF-FE-07` Profile editor sheet: enforce limits client-side (mirror server), age≥18 hard block, ≥40-char bio recommendation, drag-reorder photos, primary selection.

## Backend Tasks
- `PROF-BE-01` `completed` flips only when all mandatory present (align with `ONB-BE-03`).
- `PROF-BE-02` `GET /api/me/summary`: counts (events joined/hosted, connections, no-shows, trust) in **batched** queries (no N+1).
- `PROF-BE-03` Verification: until real flow exists, derive `verification_level` from real signals (`phone_verified`, `instagram_verified`) — relabel "Highly Verified" → only when phone+selfie real; disable seeded gold for real users.
- `PROF-BE-04` Status-gate all profile writes (`requireStatusActive`).
- `PROF-BE-05` Photo orphan-cleanup: if R2 PUT succeeds but DB insert fails, delete R2 object; nightly reconcile job.

## Database Tasks
- None beyond `0012` (status, verification already exist). Optional: `users.last_active_at` for "online/last seen."

## API Tasks
- Add `GET /api/me/summary`. Modify `PATCH /api/profile` (partial-safe, returns completion). Keep photo endpoints; add type/magic-byte check server-side.

## QA Tasks
- (+) create/publish; meter reflects mandatory+quality; badges honest. (−) >8MB/non-image/7th photo/profanity/<18 rejected. (E) delete primary reassigns; last-photo deletion hides from discovery; concurrent edits consistent; R2 outage handled; suspended/banned screens render.

## Definition of Done
- Correct component renders per state; no dead branch.
- Completion = mandatory-aware; `completed` accurate.
- Stats real and batched; no fabricated copy.
- Suspended/banned enforced in UI and API.
