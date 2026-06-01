# STEP 8 — Settings System (P0/P1)

## Current State
`SimplifiedSettings` `ProfileDashboard.jsx:1138-1243`: Google account, verification status, **fake billing ("Rs.1,200 referral")**, preference filters, **fake safety ("Live safety check-in active")**. Logout works. No delete/export, no privacy, no block-list UI, no sessions UI.

## Problems
- **H1** no account deletion/export (store-blocking).
- **G5** fabricated billing/safety copy.
- **B2** no block-list/report-history UI.
- **A2** no sessions/devices UI.

## Target State
Real settings: Account, Notifications, Privacy, Safety (block list, report history), Security (sessions), Data (export, deactivate, delete), Logout — each persisted + server-honoured.

## Frontend Tasks
- `SET-FE-01` Remove fake billing/safety copy (`:1138-1243`).
- `SET-FE-02` Account: connected logins (link/unlink, block unlink-last), phone verification (start/redo OTP).
- `SET-FE-03` Notifications: per-type push/email toggles → `notification_prefs`.
- `SET-FE-04` Privacy: visibility (everyone/verified-only/paused), show distance/last-active, who-can-message.
- `SET-FE-05` Safety: blocked users list + unblock; report history + status.
- `SET-FE-06` Security: active sessions/devices list + "Sign out everywhere."
- `SET-FE-07` Data: export (download), deactivate (reversible), delete (type-to-confirm, offer export first).

## Backend Tasks
- `SET-BE-01` `notification_prefs` table + read/write; honour at notification send time.
- `SET-BE-02` Privacy flags on profile → enforced in sanitised DTO + discovery inclusion + chat rules.
- `SET-BE-03` Block list read (`GET /api/blocks`) + unblock (`DELETE /api/blocks/:id`).
- `SET-BE-04` Sessions list/revoke (from Step 1).
- `SET-BE-05` Export (`GET /api/account/export`) + delete (`DELETE /api/account`) from Step 1; deactivate (`POST /api/account/deactivate`).

## Database Tasks
- `notification_prefs`, profile privacy flags (`visibility`, `show_distance`, `show_last_active`, `who_can_message`) (migration `0013`).

## API Tasks
- Add `GET/POST /api/notifications/prefs`, `POST /api/account/deactivate`. Reuse blocks/sessions/export/delete endpoints.

## QA Tasks
- (+) each setting persists + honoured server-side; deactivate→reactivate; export complete; delete→grace→purge. (−) cannot unlink last login method; deleted user can't re-login post-grace. (E) delete during active chat/hosted event handled.

## Definition of Done
- Every setting maps to a real persisted, server-honoured value.
- No fabricated copy. In-app deletion + export functional. Block list viewable/reversible. Sessions manageable.
