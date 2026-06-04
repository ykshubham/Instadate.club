// worker/services/vibe-checks.ts
// Vibe Check System: voice-first connection flow.
// send -> listen -> accept/pass. Chat created only on accept.

import type { D1Database } from '@cloudflare/workers-types';
// R2Bucket / ReadableStream intentionally use the ambient worker globals (same
// types worker/index.ts's Env uses). Importing R2Bucket from
// @cloudflare/workers-types pulls a second, incompatible Headers/ReadableStream
// declaration and breaks the build at the env.PROFILE_IMAGES call sites.
import { visibleTo } from '../visibility';
import { createNotification } from './notifications';
import { createConnection } from './connections';

const VC_EXPIRY_DAYS = 7;
const VC_DECLINE_COOLDOWN_DAYS = 30;
const VC_MAX_DURATION_SEC = 30;
const VC_MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const VC_DAILY_LIMIT = 10;

export interface VibeCheckResult {
  ok: boolean;
  error?: string;
  status?: 'pending' | 'connected';
  vibeCheckId?: string;
  chatId?: string;
  voiceUrl?: string;
}

export interface DailyQuota {
  used: number;
  remaining: number;
  total: number;
}

/** Canonical pair ordering (a < b). Reused from connections service pattern. */
function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Resolve today's date string in UTC (YYYY-MM-DD). */
function todayUTC(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Check and increment daily quota. Returns remaining count. */
export async function checkDailyQuota(db: D1Database, userId: string): Promise<DailyQuota> {
  const date = todayUTC();
  const row = await db.prepare(
    'SELECT count FROM vibe_check_daily_quotas WHERE user_id = ? AND date = ?'
  ).bind(userId, date).first<{ count: number }>();
  return {
    used: row?.count ?? 0,
    remaining: Math.max(0, VC_DAILY_LIMIT - (row?.count ?? 0)),
    total: VC_DAILY_LIMIT
  };
}

async function incrementDailyQuota(db: D1Database, userId: string): Promise<void> {
  const date = todayUTC();
  await db.prepare(
    `INSERT INTO vibe_check_daily_quotas (user_id, date, count) VALUES (?, ?, 1)
     ON CONFLICT(user_id, date) DO UPDATE SET count = count + 1`
  ).bind(userId, date).run();
}

/**
 * Send a vibe check: upload voice to R2, create DB record, notify recipient.
 * Validates: not self, not blocked, no active VC, no decline cooldown, daily quota < 10.
 */
export async function sendVibeCheck(
  db: D1Database,
  r2: R2Bucket,
  fromUserId: string,
  toUserId: string,
  voiceBuffer: ArrayBuffer,
  contentType: string,
  durationSec: number
): Promise<VibeCheckResult> {
  // 1. Basic validation
  if (!toUserId || toUserId === fromUserId) return { ok: false, error: 'invalid_target' };
  if (durationSec <= 0 || durationSec > VC_MAX_DURATION_SEC) return { ok: false, error: 'invalid_duration' };
  if (voiceBuffer.byteLength <= 0 || voiceBuffer.byteLength > VC_MAX_FILE_BYTES) return { ok: false, error: 'file_too_large' };

  // 2. Visibility check (blocks)
  if (!(await visibleTo(db, fromUserId, toUserId))) return { ok: false, error: 'not_available' };

  // 3. Already connected?
  const [x, y] = pair(fromUserId, toUserId);
  const conn = await db.prepare(
    "SELECT chat_id, status FROM connections WHERE user_a_id = ? AND user_b_id = ?"
  ).bind(x, y).first<{ chat_id: string; status: string }>();
  if (conn?.status === 'accepted') return { ok: true, status: 'connected', chatId: conn.chat_id };

  // 4. One active vibe check per pair
  const existing = await db.prepare(
    "SELECT id, status FROM vibe_checks WHERE from_user_id = ? AND to_user_id = ? AND status IN ('pending', 'listened')"
  ).bind(fromUserId, toUserId).first<{ id: string; status: string }>();
  if (existing) return { ok: false, error: 'already_pending', vibeCheckId: existing.id };

  // 5. Decline cooldown check
  const cooldown = await db.prepare(
    "SELECT cooldown_until FROM vibe_check_decline_cooldowns WHERE from_user_id = ? AND to_user_id = ? AND cooldown_until > datetime('now')"
  ).bind(fromUserId, toUserId).first<{ cooldown_until: string }>();
  if (cooldown) return { ok: false, error: 'cooldown_active', vibeCheckId: undefined };

  // 6. Daily quota
  const quota = await checkDailyQuota(db, fromUserId);
  if (quota.remaining <= 0) return { ok: false, error: 'daily_quota_exceeded' };

  // 7. Upload voice to R2
  const vcId = `vc-${crypto.randomUUID()}`;
  const voiceExt = contentType.includes('webm') ? 'webm'
    : contentType.includes('ogg') ? 'ogg'
    : contentType.includes('wav') ? 'wav'
    : contentType.includes('mpeg') || contentType.includes('mp4') || contentType.includes('x-m4a') ? 'm4a'
    : 'webm';
  const r2Key = `vibe-checks/${vcId}.${voiceExt}`;
  const voiceUrl = `/api/vibe-checks/${vcId}/voice`;

  await r2.put(r2Key, voiceBuffer, {
    httpMetadata: { contentType }
  });

  // 8. Insert vibe check record
  const expiresAt = new Date(Date.now() + VC_EXPIRY_DAYS * 86400000).toISOString();
  await db.prepare(
    `INSERT INTO vibe_checks (id, from_user_id, to_user_id, voice_url, voice_duration, status, expires_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`
  ).bind(vcId, fromUserId, toUserId, voiceUrl, durationSec, expiresAt).run();

  // 9. Increment daily quota
  await incrementDailyQuota(db, fromUserId);

  // 10. Notify recipient
  const senderProfile = await db.prepare(
    'SELECT full_name FROM profiles WHERE user_id = ?'
  ).bind(fromUserId).first<{ full_name: string }>();
  const senderName = senderProfile?.full_name || 'Someone';
  await createNotification(db, toUserId, 'vibe_check_received', {
    message: `${senderName} sent you a Vibe Check! 🎤`,
    senderId: fromUserId,
    senderName,
    vibeCheckId: vcId
  });

  return { ok: true, status: 'pending', vibeCheckId: vcId, voiceUrl };
}

/** List incoming pending vibe checks with sender profile preview. */
export async function getIncomingVibeChecks(db: D1Database, userId: string) {
  const { results } = await db.prepare(`
    SELECT vc.id, vc.voice_url, vc.voice_duration, vc.status, vc.listened_at, vc.created_at, vc.expires_at,
           vc.from_user_id,
           p.full_name, p.age, p.city, p.bio, p.vibe, p.verification_level,
           tm.trust_score
    FROM vibe_checks vc
    JOIN users u ON u.id = vc.from_user_id
    JOIN profiles p ON p.user_id = vc.from_user_id
    LEFT JOIN trust_metrics tm ON tm.user_id = vc.from_user_id
    WHERE vc.to_user_id = ?1 AND vc.status IN ('pending', 'listened')
      AND (vc.expires_at IS NULL OR datetime(vc.expires_at) > datetime(CURRENT_TIMESTAMP))
      AND u.status = 'active'
      AND vc.from_user_id NOT IN (SELECT blocked_user_id FROM user_blocks WHERE user_id = ?1)
      AND vc.from_user_id NOT IN (SELECT user_id FROM user_blocks WHERE blocked_user_id = ?1)
    ORDER BY vc.created_at DESC
  `).bind(userId).all<any>();

  const vibeChecks = [];
  for (const r of results) {
    const { results: photos } = await db.prepare(
      'SELECT url FROM profile_photos WHERE user_id = ? ORDER BY position ASC'
    ).bind(r.from_user_id).all<{ url: string }>();
    vibeChecks.push({
      id: r.id,
      voiceUrl: r.voice_url,
      voiceDuration: r.voice_duration,
      status: r.status,
      listenedAt: r.listened_at,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      from: {
        id: r.from_user_id,
        name: r.full_name,
        age: r.age,
        city: r.city,
        bio: r.bio,
        vibe: r.vibe,
        verification_level: r.verification_level,
        trustScore: r.trust_score ?? null,
        photos: photos.map(p => p.url),
        avatar: (r.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        gradient: 'pink'
      }
    });
  }
  return vibeChecks;
}

/** List sent vibe checks with status and recipient info. */
export async function getOutgoingVibeChecks(db: D1Database, userId: string) {
  const { results } = await db.prepare(`
    SELECT vc.id, vc.voice_url, vc.voice_duration, vc.status, vc.listened_at, vc.responded_at, vc.created_at, vc.expires_at,
           vc.to_user_id,
           p.full_name, p.age, p.city, p.verification_level
    FROM vibe_checks vc
    JOIN profiles p ON p.user_id = vc.to_user_id
    WHERE vc.from_user_id = ?1
      AND vc.to_user_id NOT IN (SELECT blocked_user_id FROM user_blocks WHERE user_id = ?1)
      AND vc.to_user_id NOT IN (SELECT user_id FROM user_blocks WHERE blocked_user_id = ?1)
    ORDER BY vc.created_at DESC
    LIMIT 50
  `).bind(userId).all<any>();

  const vibeChecks = [];
  for (const r of results) {
    const { results: photos } = await db.prepare(
      'SELECT url FROM profile_photos WHERE user_id = ? ORDER BY position ASC'
    ).bind(r.to_user_id).all<{ url: string }>();
    vibeChecks.push({
      id: r.id,
      voiceUrl: r.voice_url,
      voiceDuration: r.voice_duration,
      status: r.status,
      listenedAt: r.listened_at,
      respondedAt: r.responded_at,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      to: {
        id: r.to_user_id,
        name: r.full_name,
        age: r.age,
        city: r.city,
        verification_level: r.verification_level,
        photos: photos.map(p => p.url),
        avatar: (r.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        gradient: 'purple'
      }
    });
  }
  return vibeChecks;
}

/** Mark a vibe check as listened (recipient-only action). Idempotent. */
export async function markVibeCheckListened(
  db: D1Database, userId: string, vcId: string
): Promise<{ ok: boolean; error?: string }> {
  const vc = await db.prepare(
    "SELECT id, to_user_id, status, listened_at FROM vibe_checks WHERE id = ?"
  ).bind(vcId).first<{ id: string; to_user_id: string; status: string; listened_at: string | null }>();
  if (!vc) return { ok: false, error: 'not_found' };
  if (vc.to_user_id !== userId) return { ok: false, error: 'forbidden' };
  if (vc.status !== 'pending' && vc.status !== 'listened') return { ok: false, error: 'not_pending' };
  if (vc.listened_at) return { ok: true }; // already listened, idempotent

  await db.prepare(
    "UPDATE vibe_checks SET status = 'listened', listened_at = datetime('now') WHERE id = ?"
  ).bind(vcId).run();
  return { ok: true };
}

/** Serve the voice file for a vibe check (both sender and recipient can access). */
export async function getVibeCheckVoice(
  db: D1Database, r2: R2Bucket, userId: string, vcId: string
): Promise<{ ok: boolean; error?: string; status?: number; body?: ReadableStream; contentType?: string }> {
  const vc = await db.prepare(
    'SELECT id, from_user_id, to_user_id, voice_url FROM vibe_checks WHERE id = ?'
  ).bind(vcId).first<{ id: string; from_user_id: string; to_user_id: string; voice_url: string }>();
  if (!vc) return { ok: false, error: 'not_found', status: 404 };
  if (userId !== vc.from_user_id && userId !== vc.to_user_id) {
    return { ok: false, error: 'forbidden', status: 403 };
  }

  // Extract R2 key from URL pattern /api/vibe-checks/{vcId}/voice
  // R2 key is vibe-checks/{vcId}.{ext}
  const listResult = await r2.list({ prefix: `vibe-checks/${vcId}.`, limit: 1 });
  if (listResult.objects.length === 0) {
    return { ok: false, error: 'voice_not_found', status: 404 };
  }
  const object = await r2.get(listResult.objects[0].key);
  if (!object) return { ok: false, error: 'voice_not_found', status: 404 };

  return {
    ok: true,
    body: object.body,
    contentType: object.httpMetadata?.contentType || 'audio/webm'
  };
}

/** Accept a vibe check: creates connection + chat, notifies sender. */
export async function acceptVibeCheck(
  db: D1Database, userId: string, vcId: string
): Promise<VibeCheckResult> {
  const vc = await db.prepare(
    "SELECT id, from_user_id, to_user_id, status FROM vibe_checks WHERE id = ?"
  ).bind(vcId).first<{ id: string; from_user_id: string; to_user_id: string; status: string }>();
  if (!vc) return { ok: false, error: 'not_found' };
  if (vc.to_user_id !== userId) return { ok: false, error: 'forbidden' };
  if (vc.status !== 'pending' && vc.status !== 'listened') return { ok: false, error: 'not_pending' };

  // Check peer still active and not blocked
  if (!(await visibleTo(db, userId, vc.from_user_id))) return { ok: false, error: 'not_available' };

  // Mark accepted
  await db.prepare(
    "UPDATE vibe_checks SET status = 'accepted', responded_at = datetime('now') WHERE id = ?"
  ).bind(vcId).run();

  // Clear any reverse pending vibe check (auto-accept mutual)
  const reverse = await db.prepare(
    "SELECT id FROM vibe_checks WHERE from_user_id = ? AND to_user_id = ? AND status IN ('pending', 'listened')"
  ).bind(userId, vc.from_user_id).first<{ id: string }>();
  if (reverse) {
    await db.prepare(
      "UPDATE vibe_checks SET status = 'accepted', responded_at = datetime('now') WHERE id = ?"
    ).bind(reverse.id).run();
  }

  // Create connection + chat (reuse existing connection service)
  const chatId = await createConnection(db, vc.from_user_id, userId);

  // Notify sender
  const accepterProfile = await db.prepare(
    'SELECT full_name FROM profiles WHERE user_id = ?'
  ).bind(userId).first<{ full_name: string }>();
  const accepterName = accepterProfile?.full_name || 'Someone';
  await createNotification(db, vc.from_user_id, 'vibe_check_accepted', {
    message: `${accepterName} accepted your Vibe Check! Start chatting. 💬`,
    senderId: userId,
    senderName: accepterName,
    chatId,
    vibeCheckId: vcId
  });

  return { ok: true, status: 'connected', vibeCheckId: vcId, chatId };
}

/** Decline a vibe check: sets cooldown, notifies sender. */
export async function declineVibeCheck(
  db: D1Database, userId: string, vcId: string
): Promise<{ ok: boolean; error?: string }> {
  const vc = await db.prepare(
    "SELECT id, from_user_id, to_user_id, status FROM vibe_checks WHERE id = ?"
  ).bind(vcId).first<{ id: string; from_user_id: string; to_user_id: string; status: string }>();
  if (!vc) return { ok: false, error: 'not_found' };
  if (vc.to_user_id !== userId) return { ok: false, error: 'forbidden' };
  if (vc.status !== 'pending' && vc.status !== 'listened') return { ok: false, error: 'not_pending' };

  await db.prepare(
    "UPDATE vibe_checks SET status = 'declined', responded_at = datetime('now') WHERE id = ?"
  ).bind(vcId).run();

  // Set 30-day cooldown
  const cooldownUntil = new Date(Date.now() + VC_DECLINE_COOLDOWN_DAYS * 86400000).toISOString();
  await db.prepare(
    `INSERT INTO vibe_check_decline_cooldowns (from_user_id, to_user_id, declined_at, cooldown_until)
     VALUES (?, ?, datetime('now'), ?)
     ON CONFLICT(from_user_id, to_user_id) DO UPDATE SET cooldown_until = excluded.cooldown_until, declined_at = excluded.declined_at`
  ).bind(vc.from_user_id, vc.to_user_id, cooldownUntil).run();

  // Notify sender (silent decline — no details given)
  const declinerProfile = await db.prepare(
    'SELECT full_name FROM profiles WHERE user_id = ?'
  ).bind(userId).first<{ full_name: string }>();
  const declinerName = declinerProfile?.full_name || 'Someone';
  await createNotification(db, vc.from_user_id, 'vibe_check_declined', {
    message: `${declinerName} passed on your Vibe Check.`,
    senderId: userId,
    senderName: declinerName,
    vibeCheckId: vcId
  });

  return { ok: true };
}

/** Expire stale vibe checks (called by cron or lazily). */
export async function expireStaleVibeChecks(db: D1Database): Promise<number> {
  const { meta } = await db.prepare(
    "UPDATE vibe_checks SET status = 'expired' WHERE status IN ('pending', 'listened') AND datetime(expires_at) <= datetime('now')"
  ).run();
  return meta.changes || 0;
}

/** Clean up expired cooldowns (called by cron or lazily). */
export async function cleanupExpiredCooldowns(db: D1Database): Promise<number> {
  const { meta } = await db.prepare(
    "DELETE FROM vibe_check_decline_cooldowns WHERE datetime(cooldown_until) <= datetime('now')"
  ).run();
  return meta.changes || 0;
}
