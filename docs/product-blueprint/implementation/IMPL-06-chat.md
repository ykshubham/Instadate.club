# STEP 6 — Chat System (P0 authz / P2 realtime)

## Current State
- `ChatInboxPage`/`ChatConversationPage` `src/main.jsx:2502-2739`. Names fixed via JOIN (`worker/index.ts:821-897`).
- Send `POST /api/chats/:slug/messages` `:1715-1737` — checks chat exists, **not membership/connection/block**. "Voice verification" gate client-side only. Beta always-unlocked stub removed: `isVerified` now reads `appState.verifiedChats[slug]` so the composer stays locked until the peer accepts a voice intro; locked state records a voice note (no manual "Verify Voice" button). Updates via 3s full-state poll (`:43`).
- No typing/read/online/images/voice/delete/report.

## Problems
- **E2** message send not authorized (membership/connection/block); voice gate bypassable.
- **E3/C2** no realtime; full-state 3s poll.
- No message states or moderation hooks.

## Target State
Server-authorized messaging (participant + accepted connection + not blocked + active status); realtime via Durable Object per chat; read/typing/online/images/voice/delete; report.

## Frontend Tasks
- `CHAT-FE-01` Inbox: connections list + separate "Requests" tab (Step 5); unread badges.
  - Inbox rows now sort most-recent-first by `chat.lastMessageAt`, show a relative timestamp (`now`/`Nm`/`Nh`/`Nd`/date) via `formatInboxTime`, and render either an unread tag (`N new message(s)`, accent-coloured) when `chat.unreadCount > 0` or a 40-char last-message preview (`📎 Attachment` for attachment-only, `Say hi 👋` when empty). Backend `getState` (`worker/index.ts`) supplies `lastMessageAt` + `unreadCount` per chat: it now filters `chats` to the requesting participant, excludes soft-deleted messages (`deleted_at IS NULL`), and counts peer-sent messages the user hasn't read (`message_reads`), clearing on open. Mixed SQLite/ISO timestamps are normalised before comparison (the same parse logic lives in `parseChatTs` on the client and `tsMs` in the worker).
- `CHAT-FE-02` Thread: header (name, honest verification, online/last-seen), composer, message states (sending/sent/read), typing indicator.
- `CHAT-FE-03` Realtime client: WebSocket to chat Durable Object; fallback `GET /api/chats/:id/since?cursor=`.
- `CHAT-FE-04` Image attach (reuse photo upload), voice note (record+cap), delete message (soft), block/report from header.
- `CHAT-FE-05` Frozen states: blocked/unmatched/deleted-peer → disabled composer + banner.
- `CHAT-FE-06` Remove dependence on full-state poll for chat (Step 11).

## Backend Tasks
- `CHAT-BE-01` `worker/services/chat.ts` `assertCanSend(senderId, chatId)`: sender ∈ participants AND connection accepted AND neither blocks other AND status active. Reject else 403.
- `CHAT-BE-02` Enforce voice-verification server-side if kept (check `verified_by_user_ids_json`).
- `CHAT-BE-03` Durable Object `ChatRoom`: holds connections, broadcasts message/typing/presence; persists message to D1 then fans out.
- `CHAT-BE-04` `message_reads` writes + last-read pointer; presence/`last_active_at`.
- `CHAT-BE-05` Attachments to R2 (type/size check, NSFW scan hook); `chat_messages.attachment_url`.
- `CHAT-BE-06` Soft delete `chat_messages.deleted_at`; render "message deleted"; purge job.
- `CHAT-BE-07` Rate-limit messages/min/user; throttle duplicates (client message id idempotency).
- `CHAT-BE-08` Report message → `reports{type:'message'}`.

## Database Tasks
- `message_reads`, `chat_messages.attachment_url`, `chat_messages.deleted_at`, `users.last_active_at` (migration `0013`). Convert `chats` to route via `connections`; fix loose `participant_b_user_id` FK (D1).

## API Tasks
- Modify `POST /api/chats/:slug/messages` (authz + idempotency + attachments).
- Add `GET /api/chats/:id/since?cursor=`, `POST /api/chats/:id/read`, `DELETE /api/messages/:id`, WS upgrade route `/api/chats/:id/ws`.
- Replace chat polling with `GET /api/updates?since=` (Step 11).

## QA Tasks
- (−) non-connection/non-member send → 403; empty/oversized/spam rejected; crafted slug rejected. (+) realtime delivery; read/typing/online. (E) block mid-chat freezes both ways; peer deletion read-only; offline queue+dedup; report→queue; NSFW hold; voice cap.

## Definition of Done
- No message persists unless `assertCanSend` passes.
- Realtime path carries chat; full-state poll removed for chat.
- Block freezes both ways; reports queued; message states + delete work.
