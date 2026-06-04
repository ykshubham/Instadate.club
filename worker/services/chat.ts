// worker/services/chat.ts
// Chat authorization (Sprint 1 Task 6 — CHAT-BE-01).
//
// Direct (1:1) chats: a message may be sent only if the sender is a chat
// participant, the two parties have an accepted connection, neither blocks the
// other, and the peer is active.
//
// Group chats (instant-plan outings): there is no peer/connection — authorization
// is membership in chat_participants plus the plan not having expired. Everyone in
// the group already opted in by joining the plan, so the connection/block/peer
// gates don't apply.

import type { D1Database } from '@cloudflare/workers-types';

// Parse a timestamp that may be SQLite-style ("YYYY-MM-DD HH:MM:SS", UTC, no zone)
// or a full ISO string ("…T…Z") into epoch millis. Returns 0 on junk. Mirrors the
// normalizer used in worker/index.ts so expiry comparisons agree across the codebase.
function tsMs(s: string | null | undefined): number {
  if (!s) return 0;
  const str = String(s);
  const norm = str.includes('T') ? str : str.replace(' ', 'T');
  const zoned = /[zZ]|[+-]\d\d:?\d\d$/.test(norm) ? norm : `${norm}Z`;
  return Date.parse(zoned) || 0;
}

export interface SendCheck {
  ok: boolean;
  status: number;       // HTTP status when !ok
  error?: string;
  chatId?: string;      // resolved chat id when ok
  peerId?: string;      // the other participant (direct chats only; undefined for groups)
  kind?: string;        // 'direct' | 'group'
}

/**
 * Authorize a message send by chat slug.
 * Group chats: membership (chat_participants) + not expired.
 * Direct chats: membership -> connection accepted -> block (either dir) -> peer status.
 */
export async function assertCanSend(db: D1Database, senderId: string, slug: string): Promise<SendCheck> {
  // Chat must exist. Pull kind + the group-chat columns so we can branch.
  const chat = await db.prepare(
    `SELECT c.id, c.kind, c.participant_a_user_id, c.participant_b_user_id, ip.expires_at
       FROM chats c
       LEFT JOIN instant_plans ip ON ip.id = c.instant_plan_id
      WHERE c.slug = ?`
  ).bind(slug).first<{
    id: string;
    kind: string | null;
    participant_a_user_id: string | null;
    participant_b_user_id: string | null;
    expires_at: string | null;
  }>();
  if (!chat) return { ok: false, status: 404, error: 'chat_not_found' };

  // --- Group chats: membership + expiry only. ---
  if (chat.kind === 'group') {
    const exp = tsMs(chat.expires_at);
    if (exp && exp < Date.now()) {
      return { ok: false, status: 403, error: 'plan_expired' };
    }
    const member = await db.prepare(
      'SELECT 1 AS hit FROM chat_participants WHERE chat_id = ? AND user_id = ?'
    ).bind(chat.id, senderId).first<{ hit: number }>();
    if (!member) return { ok: false, status: 403, error: 'not_a_participant' };
    return { ok: true, status: 200, chatId: chat.id, kind: 'group' };
  }

  // --- Direct chats: full 1:1 gate. ---
  // 1. Membership: sender must be one of the two participants.
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

  return { ok: true, status: 200, chatId: chat.id, peerId, kind: 'direct' };
}
