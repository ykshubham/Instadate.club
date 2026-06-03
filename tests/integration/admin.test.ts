import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { seedUser } from '../helpers';
import {
  resolveRole,
  setUserRole,
  setEventModeration,
  recordAudit,
  listAuditLogs
} from '../../worker/services/admin';

async function seedEvent(id: string, hostId: string): Promise<string> {
  await env.DB.prepare(
    `INSERT INTO events
       (id, host_user_id, type, title, description, location, display_date, display_time,
        image, status, capacity, entry_type, approval_type)
     VALUES (?, ?, 'meetup', 'Title', 'Desc', 'Mumbai', '2026-07-01', '18:00',
        'img.png', 'active', 10, 'Free', 'Instant')`
  ).bind(id, hostId).run();
  return id;
}

describe('admin.resolveRole', () => {
  it('resolves env-allowlisted ids to admin with fromEnv true', async () => {
    await seedUser({ id: 'ad-x' });
    const p = await resolveRole(env.DB, 'ad-x', 'ad-x,ad-y,ad-z');
    expect(p.role).toBe('admin');
    expect(p.fromEnv).toBe(true);
  });

  it('reads users.role for a moderator (not from env)', async () => {
    await seedUser({ id: 'ad-mod', role: 'moderator' });
    const p = await resolveRole(env.DB, 'ad-mod', 'someone-else');
    expect(p.role).toBe('moderator');
    expect(p.fromEnv).toBe(false);
  });

  it('defaults to member', async () => {
    await seedUser({ id: 'ad-mem' });
    const p = await resolveRole(env.DB, 'ad-mem', '');
    expect(p.role).toBe('member');
    expect(p.fromEnv).toBe(false);
  });
});

describe('admin.setUserRole', () => {
  it('rejects an invalid role', async () => {
    await seedUser({ id: 'ad-sr-1' });
    const res = await setUserRole(env.DB, 'ad-sr-1', 'superuser');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('invalid_role');
  });

  it('rejects an unknown user', async () => {
    const res = await setUserRole(env.DB, 'ad-ghost', 'admin');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('user_not_found');
  });

  it('updates users.role on success', async () => {
    await seedUser({ id: 'ad-sr-2' });
    const res = await setUserRole(env.DB, 'ad-sr-2', 'moderator');
    expect(res.ok).toBe(true);
    const row = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind('ad-sr-2').first<{ role: string }>();
    expect(row?.role).toBe('moderator');
  });
});

describe('admin.setEventModeration', () => {
  it('rejects hidden without a reason', async () => {
    await seedUser({ id: 'ad-host-1' });
    await seedUser({ id: 'ad-mod-1', role: 'moderator' });
    const eid = await seedEvent('ev-1', 'ad-host-1');
    const res = await setEventModeration(env.DB, 'ad-mod-1', eid, 'hidden');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('reason_required');
  });

  it('hides an event with a reason', async () => {
    await seedUser({ id: 'ad-host-2' });
    await seedUser({ id: 'ad-mod-2', role: 'moderator' });
    const eid = await seedEvent('ev-2', 'ad-host-2');
    const res = await setEventModeration(env.DB, 'ad-mod-2', eid, 'hidden', 'inappropriate');
    expect(res.ok).toBe(true);
    const row = await env.DB.prepare(
      'SELECT moderation_status, moderation_reason FROM events WHERE id = ?'
    ).bind(eid).first<{ moderation_status: string; moderation_reason: string }>();
    expect(row?.moderation_status).toBe('hidden');
    expect(row?.moderation_reason).toBe('inappropriate');
  });

  it('active restores an event and clears the reason', async () => {
    await seedUser({ id: 'ad-host-3' });
    await seedUser({ id: 'ad-mod-3', role: 'moderator' });
    const eid = await seedEvent('ev-3', 'ad-host-3');
    await setEventModeration(env.DB, 'ad-mod-3', eid, 'hidden', 'temp');
    const res = await setEventModeration(env.DB, 'ad-mod-3', eid, 'active');
    expect(res.ok).toBe(true);
    const row = await env.DB.prepare(
      'SELECT moderation_status, moderation_reason FROM events WHERE id = ?'
    ).bind(eid).first<{ moderation_status: string; moderation_reason: string | null }>();
    expect(row?.moderation_status).toBe('active');
    expect(row?.moderation_reason).toBeNull();
  });

  it('rejects an invalid status', async () => {
    await seedUser({ id: 'ad-host-4' });
    await seedUser({ id: 'ad-mod-4', role: 'moderator' });
    const eid = await seedEvent('ev-4', 'ad-host-4');
    const res = await setEventModeration(env.DB, 'ad-mod-4', eid, 'nuked', 'x');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('invalid_status');
  });

  it('returns event_not_found for an unknown event', async () => {
    await seedUser({ id: 'ad-mod-5', role: 'moderator' });
    const res = await setEventModeration(env.DB, 'ad-mod-5', 'ev-nope', 'hidden', 'x');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('event_not_found');
  });
});

describe('admin.recordAudit / listAuditLogs', () => {
  it('records an audit row and lists it newest-first with action/targetType filters', async () => {
    await seedUser({ id: 'ad-actor-1', role: 'admin' });
    await recordAudit(env.DB, {
      actorUserId: 'ad-actor-1',
      action: 'user_suspended',
      targetType: 'user',
      targetId: 'tgt-1',
      reason: 'spam',
      metadata: { foo: 'bar' }
    });
    await recordAudit(env.DB, {
      actorUserId: 'ad-actor-1',
      action: 'event_hidden',
      targetType: 'event',
      targetId: 'ev-x'
    });

    const all = await listAuditLogs(env.DB);
    expect(all.length).toBeGreaterThanOrEqual(2);
    // newest first
    expect(all[0].action).toBe('event_hidden');

    const byAction = await listAuditLogs(env.DB, { action: 'user_suspended' });
    expect(byAction.length).toBe(1);
    expect(byAction[0].targetId).toBe('tgt-1');
    expect(byAction[0].metadata).toEqual({ foo: 'bar' });

    const byType = await listAuditLogs(env.DB, { targetType: 'event' });
    expect(byType.length).toBe(1);
    expect(byType[0].action).toBe('event_hidden');
  });
});
