# STEP 7 — Events System (P1)

## Current State
- Create `POST /api/events` `:1566-1577`; join/leave `/api/events/:id/attendees/me` `:1580-1607`; approve `:1610-1632`; attend/no-show `:1635-1687`. Capacity hard 409 `:1114-1118`. Soft `deleted_at` column, no endpoint. **No edit, no cancel endpoint, no waitlist.**

## Problems
- **F1** no edit/cancel/waitlist; oversell risk under concurrency (non-atomic count+insert).
- **F2** approval state not surfaced to attendees.
- No moderation for events.

## Target State
Full lifecycle DRAFT→OPEN→FULL→COMPLETED/CANCELLED/UNDER_REVIEW; atomic seat claim; waitlist auto-promote; edit/cancel with notifications + refunds; approval visible; report.

## State transitions
```
DRAFT ─publish─► OPEN ─fills─► FULL ─seat frees─► OPEN(promote waitlist)
OPEN/FULL ─host edit─► OPEN(re-confirm on date/location change)
OPEN/FULL ─host cancel─► CANCELLED(notify+refund)
date passes ─► COMPLETED ─► feedback window
report ─► UNDER_REVIEW(hidden)
```

## Frontend Tasks
- `EVT-FE-01` Host edit form (`PATCH`) — immutable after start; warn on date/location change.
- `EVT-FE-02` Cancel action (host) with reason → confirm → notify attendees.
- `EVT-FE-03` Join UX: pending-approval state, full→waitlist offer, waitlisted position display.
- `EVT-FE-04` Attendee states (pending/approved/declined/waitlisted) shown clearly.
- `EVT-FE-05` Report event; under-review hidden from discovery.
- `EVT-FE-06` Empty state for no events (reuse `EmptyState`).

## Backend Tasks
- `EVT-BE-01` Atomic seat claim in a transaction (count + insert guarded) to prevent oversell.
- `EVT-BE-02` `PATCH /api/events/:id` host-only; material-change re-confirm logic.
- `EVT-BE-03` `POST /api/events/:id/cancel` host-only → status cancelled, notify attendees, trigger refund hook.
- `EVT-BE-04` Waitlist: `event_waitlist`; on seat free, auto-promote position 1, notify, expire offer after T → next.
- `EVT-BE-05` Host gating: `requirePublished` (recommend `requireVerified`) to create/host.
- `EVT-BE-06` Report event → moderation queue; hide under-review from `getRecommendedEventsV2`.
- `EVT-BE-07` Apply `visibleTo`/status filters to attendee lists (hide banned).

## Database Tasks
- `event_waitlist` table; `events.status` enum usage (open/full/cancelled/completed/under_review) (migration `0013`).

## API Tasks
- Add `PATCH /api/events/:id`, `POST /api/events/:id/cancel`, `POST /api/events/:id/waitlist`, `DELETE /api/events/:id/waitlist`.
- Modify join to offer waitlist on full; leave to auto-promote.

## QA Tasks
- (−) oversell prevented under concurrent joins; join unpublished→403; invite-only link denied. (+) create→join→attend→review; edit/cancel; waitlist promote. (E) cancel notifies+refunds; date edit re-confirms; capacity lowered handling; host deletion cascade.

## Definition of Done
- No oversell under concurrency; full events offer auto-promoting waitlist.
- Edit/cancel work with notifications/refunds; approval states visible; reports hide events.
