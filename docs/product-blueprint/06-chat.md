# Phase 7 — Chat System

## Current state
- Chats seeded; created via `ensureDefaultChats`, not by mutual consent (`worker/index.ts:619-660`).
- Send: `POST /api/chats/:slug/messages` checks chat exists but **not sender membership / connection / block** (E2).
- "Voice verification" gate is **client-side only** (`main.jsx:2660`).
- No typing/read/online/images/voice/delete/report; updates via 3s full-state poll (E3).
- Good empty state exists (`main.jsx:2597-2611`).

## Target architecture

### Logged-out / Guest taps Chat
→ Login wall modal: "Sign in to see your conversations." No chat data loaded.

### Logged-in chat states
| State | UI |
|---|---|
| No conversations | Existing empty state + "Find connections" CTA |
| Active conversation | Thread, composer, header (name, verification, online dot) |
| New message | Unread badge on inbox + tab; bold row; push notif if enabled |
| Message request | Separate "Requests" tab for not-yet-accepted connections (no free texting until accepted) |
| Blocked user | Thread frozen, composer disabled, "You blocked this user — Unblock?" |
| Reported user | Thread continues but flagged to moderation; option to also block |
| Deleted/Deactivated peer | "This account is no longer available," composer disabled, history retained read-only |

### Messaging business rules (server-enforced)
1. A chat exists **only** after a connection is **accepted** (Phase 8) **or** both parties are confirmed attendees/host of the same event (event chats).
2. To send, server verifies: sender ∈ {participant_a, participant_b} **and** connection `accepted` **and** neither party blocks the other **and** sender not suspended/banned (fixes E2).
3. Hosts ↔ attendees: an event creates a host-scoped channel; attendees may message the host; attendee↔attendee requires a normal connection.
4. Rate-limit: N messages/min/user; throttle identical repeated messages.
5. If "voice verification" stays a feature, enforce it **server-side** before persisting.

### Features (phased)
| Feature | Backend |
|---|---|
| Typing indicator | Durable Object channel broadcast (ephemeral, not persisted) |
| Read receipts | `message_reads(message_id,user_id,read_at)`; last-read pointer per chat |
| Online status | presence in Durable Object; `last_seen` fallback |
| Image sharing | Upload to R2 (reuse photo pipeline); store `message.attachment_url`; size/type checks; NSFW scan hook |
| Voice notes | R2 audio; duration cap; transcript optional |
| Message deletion | soft `deleted_at`; render "message deleted"; hard purge job |
| Blocking | `POST /api/blocks`; bidirectional hide; freeze chat |
| Reporting | `POST /api/reports{type:'message', target, reason, evidence}` → moderation queue |

### Real-time (replaces polling — C2/E3)
- **Durable Object per chat** holds connection set; broadcasts new messages, typing, presence over WebSocket.
- Fallback: short-poll a lightweight `/api/chats/:id/since?cursor=` (not full state).
- Inbox list refreshes via a thin `/api/updates?since=` cursor.

## Acceptance criteria
- No message persists unless sender passes the rule-set above.
- Blocking hides both directions immediately and freezes the thread.
- Reports land in a queryable moderation queue.
- Realtime path carries chat; full-state poll removed.
