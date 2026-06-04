// worker/services/connections.ts
// Mutual-consent connection system (Sprint 1 Task 5 — CONN-BE-01/02).
// request -> accept/reject; chat created on accept; mutual request auto-accepts.

import type { D1Database } from '@cloudflare/workers-types';
import { visibleTo } from '../visibility';
import { createNotification } from './notifications';

const REQUEST_TTL_DAYS = 14;

export interface ConnResult {
  ok: boolean;
  error?: string;
  status?: 'pending' | 'connected';
  chatId?: string;
}

/** Canonical ordering so (x,y) and (y,x) map to one connection/chat. */
function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function createChatForPair(db: D1Database, a: string, b: string): Promise<string> {
  const [x, y] = pair(a, b);
  const slug = `conn-${x}__${y}`;
  const existing = await db.prepare('SELECT id FROM chats WHERE slug = ?').bind(slug).first<{ id: string }>();
  if (existing) return existing.id;
  const chatId = `chat-${crypto.randomUUID()}`;
  await db.prepare(
    'INSERT INTO chats (id, slug, participant_a_user_id, participant_b_user_id) VALUES (?, ?, ?, ?)'
  ).bind(chatId, slug, x, y).run();
  return chatId;
}

async function upsertOutcome(db: D1Database, a: string, b: string, status: string) {
  const [x, y] = pair(a, b);
  await db.prepare(
    `INSERT INTO match_outcomes (id, user_id_a, user_id_b, status)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id_a, user_id_b)
     DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP`
  ).bind(`mo-${crypto.randomUUID()}`, x, y, status).run();
}

/** Create (or reuse) an accepted connection + its chat. Returns the chat id. */
export async function createConnection(db: D1Database, a: string, b: string): Promise<string> {
  const [x, y] = pair(a, b);
  const chatId = await createChatForPair(db, x, y);
  const existing = await db.prepare(
    'SELECT id, chat_id, status FROM connections WHERE user_a_id = ? AND user_b_id = ?'
  ).bind(x, y).first<{ id: string; chat_id: string; status: string }>();

  if (existing) {
    if (existing.status !== 'accepted') {
      await db.prepare("UPDATE connections SET status = 'accepted', chat_id = ? WHERE id = ?").bind(chatId, existing.id).run();
    }
  } else {
    await db.prepare(
      "INSERT INTO connections (id, user_a_id, user_b_id, chat_id, status) VALUES (?, ?, ?, ?, 'accepted')"
    ).bind(`cn-${crypto.randomUUID()}`, x, y, chatId).run();
  }
  await upsertOutcome(db, x, y, 'accepted');
  return chatId;
}

export async function sendConnectionRequest(
  db: D1Database, fromUserId: string, toUserId: string, note: string
): Promise<ConnResult> {
  if (!toUserId || toUserId === fromUserId) return { ok: false, error: 'invalid_target' };
  if (!(await visibleTo(db, fromUserId, toUserId))) return { ok: false, error: 'not_available' };

  // Already connected?
  const [x, y] = pair(fromUserId, toUserId);
  const conn = await db.prepare(
    "SELECT chat_id, status FROM connections WHERE user_a_id = ? AND user_b_id = ?"
  ).bind(x, y).first<{ chat_id: string; status: string }>();
  if (conn?.status === 'accepted') return { ok: true, status: 'connected', chatId: conn.chat_id };

  // Reverse pending request = mutual like -> auto-accept.
  const reverse = await db.prepare(
    "SELECT id FROM connection_requests WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'"
  ).bind(toUserId, fromUserId).first<{ id: string }>();
  if (reverse) {
    await db.prepare("UPDATE connection_requests SET status = 'accepted' WHERE id = ?").bind(reverse.id).run();
    const chatId = await createConnection(db, fromUserId, toUserId);
    
    // Notify both users of the mutual connection
    const senderProfile = await db.prepare('SELECT full_name FROM profiles WHERE user_id = ?').bind(fromUserId).first<{ full_name: string }>();
    const senderName = senderProfile?.full_name || 'Someone';
    await createNotification(db, toUserId, 'connection_accept', {
      message: `You and ${senderName} are now connected!`,
      senderId: fromUserId,
      senderName: senderName,
      chatId
    });

    const targetProfile = await db.prepare('SELECT full_name FROM profiles WHERE user_id = ?').bind(toUserId).first<{ full_name: string }>();
    const targetName = targetProfile?.full_name || 'Someone';
    await createNotification(db, fromUserId, 'connection_accept', {
      message: `You and ${targetName} are now connected!`,
      senderId: toUserId,
      senderName: targetName,
      chatId
    });

    return { ok: true, status: 'connected', chatId };
  }

  const expiresAt = new Date(Date.now() + REQUEST_TTL_DAYS * 86400000).toISOString();
  const mine = await db.prepare(
    'SELECT id, status FROM connection_requests WHERE from_user_id = ? AND to_user_id = ?'
  ).bind(fromUserId, toUserId).first<{ id: string; status: string }>();

  if (mine) {
    if (mine.status === 'pending') return { ok: true, status: 'pending' };
    // Re-request after a prior reject/expiry.
    await db.prepare(
      "UPDATE connection_requests SET status = 'pending', note = ?, created_at = CURRENT_TIMESTAMP, expires_at = ? WHERE id = ?"
    ).bind(note || null, expiresAt, mine.id).run();
  } else {
    await db.prepare(
      "INSERT INTO connection_requests (id, from_user_id, to_user_id, note, status, expires_at) VALUES (?, ?, ?, ?, 'pending', ?)"
    ).bind(`cr-${crypto.randomUUID()}`, fromUserId, toUserId, note || null, expiresAt).run();
  }

  // Trigger connection request notification to the target user
  const senderProfile = await db.prepare('SELECT full_name FROM profiles WHERE user_id = ?').bind(fromUserId).first<{ full_name: string }>();
  const senderName = senderProfile?.full_name || 'Someone';
  await createNotification(db, toUserId, 'connection_request', {
    message: `${senderName} sent you a connection request.`,
    senderId: fromUserId,
    senderName: senderName,
    note: note || ''
  });

  return { ok: true, status: 'pending' };
}

export async function acceptConnectionRequest(db: D1Database, userId: string, requestId: string): Promise<ConnResult> {
  const req = await db.prepare('SELECT from_user_id, to_user_id, status FROM connection_requests WHERE id = ?')
    .bind(requestId).first<{ from_user_id: string; to_user_id: string; status: string }>();
  if (!req) return { ok: false, error: 'not_found' };
  if (req.to_user_id !== userId) return { ok: false, error: 'forbidden' };
  if (req.status !== 'pending') return { ok: false, error: 'not_pending' };

  await db.prepare("UPDATE connection_requests SET status = 'accepted' WHERE id = ?").bind(requestId).run();
  const chatId = await createConnection(db, req.from_user_id, req.to_user_id);

  // Trigger acceptance notification to the requester
  const accepterProfile = await db.prepare('SELECT full_name FROM profiles WHERE user_id = ?').bind(userId).first<{ full_name: string }>();
  const accepterName = accepterProfile?.full_name || 'Someone';
  await createNotification(db, req.from_user_id, 'connection_accept', {
    message: `${accepterName} accepted your connection request!`,
    senderId: userId,
    senderName: accepterName,
    chatId: chatId
  });

  return { ok: true, status: 'connected', chatId };
}

export async function rejectConnectionRequest(db: D1Database, userId: string, requestId: string): Promise<ConnResult> {
  const req = await db.prepare('SELECT to_user_id, status FROM connection_requests WHERE id = ?')
    .bind(requestId).first<{ to_user_id: string; status: string }>();
  if (!req) return { ok: false, error: 'not_found' };
  if (req.to_user_id !== userId) return { ok: false, error: 'forbidden' };
  await db.prepare("UPDATE connection_requests SET status = 'rejected' WHERE id = ?").bind(requestId).run();
  return { ok: true };
}

/** Incoming pending requests with a sanitised sender preview (no contact/geo). */
export async function getIncomingRequests(db: D1Database, userId: string) {
  const { results } = await db.prepare(`
    SELECT cr.id, cr.note, cr.created_at, cr.from_user_id,
           p.full_name, p.age, p.city, p.bio, p.vibe, p.verification_level
    FROM connection_requests cr
    JOIN users u ON u.id = cr.from_user_id
    JOIN profiles p ON p.user_id = cr.from_user_id
    WHERE cr.to_user_id = ?1 AND cr.status = 'pending'
      AND (cr.expires_at IS NULL OR datetime(cr.expires_at) > datetime(CURRENT_TIMESTAMP))
      AND u.status = 'active'
      AND cr.from_user_id NOT IN (SELECT blocked_user_id FROM user_blocks WHERE user_id = ?1)
      AND cr.from_user_id NOT IN (SELECT user_id FROM user_blocks WHERE blocked_user_id = ?1)
    ORDER BY cr.created_at DESC
  `).bind(userId).all<any>();

  const requests = [];
  for (const r of results) {
    const { results: photos } = await db.prepare(
      'SELECT url FROM profile_photos WHERE user_id = ? ORDER BY position ASC'
    ).bind(r.from_user_id).all<{ url: string }>();
    requests.push({
      id: r.id,
      note: r.note || '',
      sentAt: r.created_at,
      from: {
        id: r.from_user_id,
        name: r.full_name,
        age: r.age,
        city: r.city,
        bio: r.bio,
        vibe: r.vibe,
        verification_level: r.verification_level,
        photos: photos.map(p => p.url),
        avatar: (r.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        gradient: 'pink'
      }
    });
  }
  return requests;
}

export async function getConnections(db: D1Database, userId: string) {
  const { results } = await db.prepare(`
    SELECT c.id, c.chat_id, c.created_at,
           CASE WHEN c.user_a_id = ?1 THEN c.user_b_id ELSE c.user_a_id END AS other_id
    FROM connections c
    WHERE (c.user_a_id = ?1 OR c.user_b_id = ?1) AND c.status = 'accepted'
      AND c.user_a_id NOT IN (SELECT blocked_user_id FROM user_blocks WHERE user_id = c.user_b_id)
      AND c.user_b_id NOT IN (SELECT blocked_user_id FROM user_blocks WHERE user_id = c.user_a_id)
    ORDER BY c.created_at DESC
  `).bind(userId).all<any>();
  return results;
}
