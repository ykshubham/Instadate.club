// worker/visibility.ts
// Central visibility guard (Sprint 1, DISC-BE-01).
// A target is hidden from a viewer if: either-direction block, viewer rejected them,
// it is the viewer themselves (in list context), or the target account is not active / soft-deleted.

import type { D1Database } from '@cloudflare/workers-types';

/**
 * All user ids that must NOT be shown to `viewerId` in any list.
 * Includes the viewer themselves (lists never show self).
 * One batched query — no N+1.
 */
export async function hiddenUserIds(db: D1Database, viewerId: string): Promise<Set<string>> {
  const { results } = await db.prepare(`
    SELECT id FROM (
      SELECT blocked_user_id  AS id FROM user_blocks     WHERE user_id = ?1
      UNION SELECT user_id    AS id FROM user_blocks     WHERE blocked_user_id = ?1
      UNION SELECT rejected_user_id AS id FROM user_rejections WHERE user_id = ?1
      UNION SELECT id         AS id FROM users WHERE status != 'active' OR deleted_at IS NOT NULL
    )
  `).bind(viewerId).all<{ id: string }>();
  const set = new Set(results.map(r => r.id));
  set.add(viewerId);
  return set;
}

/** Subset of `candidateIds` visible to the viewer. */
export async function visibleUserIds(
  db: D1Database,
  viewerId: string,
  candidateIds: string[]
): Promise<Set<string>> {
  const hidden = await hiddenUserIds(db, viewerId);
  return new Set(candidateIds.filter(cid => !hidden.has(cid)));
}

/** Single-target check (chat send, profile view). Self is always visible to self. */
export async function visibleTo(db: D1Database, viewerId: string, targetId: string): Promise<boolean> {
  if (viewerId === targetId) return true;
  const hidden = await hiddenUserIds(db, viewerId);
  return !hidden.has(targetId);
}
