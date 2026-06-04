import type { D1Database } from '@cloudflare/workers-types';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  payload_json: string;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPayload {
  message: string;
  senderId?: string;
  senderName?: string;
  eventId?: string;
  eventTitle?: string;
  connectionId?: string;
  [key: string]: any;
}

/**
 * Creates a notification for a user.
 */
export async function createNotification(
  db: D1Database,
  userId: string,
  type: string,
  payload: NotificationPayload
): Promise<string> {
  const id = `nt-${crypto.randomUUID()}`;
  const payloadJson = JSON.stringify(payload);
  
  await db.prepare(
    `INSERT INTO notifications (id, user_id, type, payload_json, read_at, created_at)
     VALUES (?, ?, ?, ?, NULL, datetime('now'))`
  ).bind(id, userId, type, payloadJson).run();
  
  return id;
}

/**
 * Retrieves the latest 50 notifications for a user.
 */
export async function getNotifications(db: D1Database, userId: string): Promise<any[]> {
  const { results: blocks } = await db.prepare(
    'SELECT blocked_user_id AS id FROM user_blocks WHERE user_id = ?1 UNION SELECT user_id AS id FROM user_blocks WHERE blocked_user_id = ?1'
  ).bind(userId).all<{ id: string }>();
  const blockedSet = new Set(blocks.map(b => b.id));

  const { results } = await db.prepare(
    `SELECT id, user_id, type, payload_json, read_at, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`
  ).bind(userId).all<Notification>();

  const mapped = results.map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    payload: row.payload_json ? JSON.parse(row.payload_json) : {},
    readAt: row.read_at,
    createdAt: row.created_at
  }));

  return mapped.filter(n => {
    const senderId = n.payload?.senderId;
    if (senderId && blockedSet.has(senderId)) return false;
    return true;
  });
}

/**
 * Marks a single or all notifications as read for a user.
 */
export async function markNotificationsRead(
  db: D1Database,
  userId: string,
  notificationId?: string
): Promise<void> {
  if (notificationId) {
    await db.prepare(
      `UPDATE notifications
       SET read_at = datetime('now')
       WHERE id = ? AND user_id = ? AND read_at IS NULL`
    ).bind(notificationId, userId).run();
  } else {
    await db.prepare(
      `UPDATE notifications
       SET read_at = datetime('now')
       WHERE user_id = ? AND read_at IS NULL`
    ).bind(userId).run();
  }
}
