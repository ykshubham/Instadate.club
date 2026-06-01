# Phase 10 — Settings & Account

## Current state
`SimplifiedSettings` (`ProfileDashboard.jsx:1138-1243`) shows Google account, verification status, **fake billing ("Rs. 1,200 referral balance")**, preference filters, **fake safety ("Live safety check-in active")**. Logout works. **No delete-account, no privacy controls, no block-list UI** (H1, G5).

## Target settings module

| Group | Setting | Behaviour |
|---|---|---|
| **Account** | Edit profile | Opens profile editor (existing sheet) |
| | Connected logins | Show Google/email/phone; link/unlink (cannot unlink last method) |
| | Phone verification | Start/redo OTP → sets `phone_verified`, updates verification level |
| **Notifications** | Push / Email toggles per type (connections, messages, events) | Persist to `notification_prefs`; respect at send time |
| **Privacy** | Profile visibility (everyone / verified-only / paused) | Gate discovery inclusion |
| | Show distance / last-active | Per-field privacy flags on public DTO |
| | Who can message me (connections-only / event peers) | Enforced server-side in chat rules |
| **Safety** | Blocked users list | Read `user_blocks`; unblock action (closes B2 UI gap) |
| | Report history | List user's submitted reports + status |
| **Security** | Active sessions / devices | List `auth_sessions`; "Sign out everywhere" |
| **Data** | Export my data | Generate JSON export (H1 / GDPR-DPDP) |
| | Deactivate account | Soft pause: hide from discovery, freeze chats, reversible on next login |
| | **Delete account** | `DELETE /api/account` → 30-day grace soft-delete → hard cascade purge; immediate logout (H1, store-blocking) |
| | Logout | Existing flow |

### Delete-account spec (H1)
1. Confirm modal (type-to-confirm) + reason (optional).
2. Offer **export** first.
3. Soft-delete: `users.status='deactivated'`, scrub from discovery/chat immediately, freeze content.
4. 30-day grace: logging in offers "reactivate."
5. After grace: hard cascade (profile, photos in R2, messages anonymised/removed per policy, connections, RSVPs). Keep minimal legal/abuse records as required, unlinked from PII.

## Acceptance criteria
- Every setting maps to a real persisted value and is honoured server-side.
- No fabricated billing/safety claims remain (G5).
- In-app account deletion works end-to-end (app-store requirement).
- Blocked list is viewable and reversible.
