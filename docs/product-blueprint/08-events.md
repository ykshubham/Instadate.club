# Phase 9 — Events System

## Current state
Create / join / leave exist; host-approve + attendance-mark exist. **No edit, no cancel endpoint, no waitlist** (F1). Capacity = hard 409 (`worker/index.ts:1114-1118`). Soft-delete column exists, no endpoint.

## Target lifecycle

```
DRAFT ─publish─► OPEN ──fills──► FULL ──┐          host edits ─► OPEN (versioned)
                  │                     │ waitlist auto-promote on cancel
                  │ host cancel ─► CANCELLED (notify + refund)
                  │ date passes ─► COMPLETED ─► feedback window
                  └ reported ─► UNDER_REVIEW
```

### Create (host)
- Required: type, title, description, location, date, time, capacity(>0), entry(Free/Paid)+price.
- Optional: cover, approval mode (auto / host-approval), gender ratio pref, visibility (public/invite).
- **Gate:** only **published** (recommend **verified**) users may host.
- Validation: future date/time; capacity 1–N; price ≥0 if Paid; profanity check on text.

### Edit (NEW — F1)
- `PATCH /api/events/:id` host-only; immutable after start; material changes (date/location) notify + re-confirm attendees.

### Cancel (NEW — F1)
- `POST /api/events/:id/cancel` host-only → status `cancelled`, notify all attendees, trigger refunds if Paid, log reason. Distinct from soft `deleted_at`.

### Join / Leave
- Join: capacity-checked; if `approval_required` → status `pending` until host approves (surface this in UI, F2). If full → **offer waitlist**.
- Leave: frees a seat → **auto-promote** first waitlisted, notify them.

### Waitlist (NEW — F1)
- `event_waitlist(event_id,user_id,position,created_at)`. Auto-promote on any seat opening; expire promotion offer after T minutes → next in line.

### Capacity & integrity
- Atomic seat claim (transaction) to prevent oversell under concurrency.
- Per-user one active attendance row per event.

### Attendance & trust
- Host marks attended/no-show (exists). No-show penalises trust; attended boosts it. Feed into reliability shown on profiles.

### Moderation
- `POST /api/reports{type:'event'}`; under-review hides from discovery pending admin action.

## Permissions (see Phase 6)
Host: create/edit/cancel own, approve/mark attendees. Attendee: join/leave/waitlist, review after completion. Guest: view public only.

## Acceptance criteria
- No oversell under concurrent joins.
- Cancelling notifies + refunds; editing date re-confirms.
- Full events offer a waitlist that auto-promotes.
