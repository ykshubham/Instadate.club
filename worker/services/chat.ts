// worker/services/chat.ts
// Chat authorization (Sprint 1 Task 6 — CHAT-BE-01).
// A message may be sent only if the sender is a chat participant, the two parties
// have an accepted connection, neither blocks the other, and the peer is active.

import type { D1Database } from '@cloudflare/workers-types';

export interface SendCheck {
  ok: boolean;
  status: number;       // HTTP status when !ok
  error?: string;
  chatId?: string;      // resolved chat id when ok
  peerId?: string;      // the other participant
}

/**
 * Authorize a message send by chat slug.
 * Order: membership -> connection accepted -> block (either direction) -> peer status.
 */
export async function assertCanSend(db: D1Database, senderId: string, slug: string): Promise<SendCheck> {
  // 1. Membership: chat must exist and sender must be a participant.
  const chat = await db.prepare(
    'SELECT id, participant_a_user_id, participant_b_user_id FROM chats WHERE slug = ?'
  ).bind(slug).first<{ id: string; participant_a_user_id: string | null; participant_b_user_id: string | null }>();
  if (!chat) return { ok: false, status: 404, error: 'chat_not_found' };

  const a = chat.participant_a_user_id;
  const b = chat.participant_b_user_id;
  if (senderId !== a && senderId !== b) {
    return { ok: false, status: 403, error: 'not_a_participant' };
  }
  const peerId = senderId === a ? b : a;
  if (!peerId) return { ok: false, status: 403, error: 'no_peer' };

  // 2. Connection: an accepted connection must exist between the pair (canonical a<b).
  const [x, y] = senderId < peerId ? [senderId, peerId] : [peerId, senderId];
  const conn = await db.prepare(
    "SELECT status FROM connections WHERE user_a_id = ? AND user_b_id = ?"
  ).bind(x, y).first<{ status: string }>();
  if (!conn || conn.status !== 'accepted') {
    return { ok: false, status: 403, error: 'not_connected' };
  }

  // 3. Block: either direction blocks messaging.
  const block = await db.prepare(
    `SELECT 1 AS hit FROM user_blocks
      WHERE (user_id = ?1 AND blocked_user_id = ?2)
         OR (user_id = ?2 AND blocked_user_id = ?1)
      LIMIT 1`
  ).bind(senderId, peerId).first<{ hit: number }>();
  if (block) return { ok: false, status: 403, error: 'blocked' };

  // 4. Status: peer account must be active.
  const peer = await db.prepare("SELECT status FROM users WHERE id = ?").bind(peerId).first<{ status: string }>();
  if (!peer || (peer.status && peer.status !== 'active')) {
    return { ok: false, status: 403, error: 'peer_unavailable' };
  }

  return { ok: true, status: 200, chatId: chat.id, peerId };
}
