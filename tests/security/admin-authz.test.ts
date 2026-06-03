// SECURITY: privileged admin/moderation surface is gated by role.
//   member     → 403 on all admin routes
//   admin-seed → ADMIN_USER_IDS env allowlist → full admin
//   moderator  → may read the moderation queue, but role grants are admin-only
import { describe, it, expect } from 'vitest';
import { api, seedAuthed } from '../helpers';

describe('normal member is denied the admin surface', () => {
  it('GET reports / users / audit and POST status all → 403', async () => {
    const m = await seedAuthed({ id: 'authz-member', role: 'member', completed: true });
    const ipBase = '198.51.101';

    const reports = await api('/api/admin/reports', { cookie: m.cookie, headers: { 'cf-connecting-ip': `${ipBase}.1` } });
    const users = await api('/api/admin/users', { cookie: m.cookie, headers: { 'cf-connecting-ip': `${ipBase}.2` } });
    const audit = await api('/api/admin/audit', { cookie: m.cookie, headers: { 'cf-connecting-ip': `${ipBase}.3` } });
    const status = await api('/api/admin/users/some-target/status', {
      method: 'POST', cookie: m.cookie, body: { status: 'banned' },
      headers: { 'cf-connecting-ip': `${ipBase}.4` }
    });

    expect(reports.status).toBe(403);
    expect(users.status).toBe(403);
    expect(audit.status).toBe(403);
    expect(status.status).toBe(403);
  });
});

describe('admin (env allowlist) has full access', () => {
  it('GET reports / users / audit → 200', async () => {
    // 'admin-seed' is in ADMIN_USER_IDS; seed the user row + session for it.
    const a = await seedAuthed({ id: 'admin-seed', role: 'member', completed: true });
    const ipBase = '198.51.102';

    const reports = await api('/api/admin/reports', { cookie: a.cookie, headers: { 'cf-connecting-ip': `${ipBase}.1` } });
    const users = await api('/api/admin/users', { cookie: a.cookie, headers: { 'cf-connecting-ip': `${ipBase}.2` } });
    const audit = await api('/api/admin/audit', { cookie: a.cookie, headers: { 'cf-connecting-ip': `${ipBase}.3` } });

    expect(reports.status).toBe(200);
    expect(users.status).toBe(200);
    expect(audit.status).toBe(200);
  });
});

describe('moderator: queue read allowed, role grant denied', () => {
  it('GET reports → 200 but POST users/<id>/role → 403 (admin-only)', async () => {
    const mod = await seedAuthed({ id: 'authz-mod', role: 'moderator', completed: true });
    const ipBase = '198.51.103';

    const reports = await api('/api/admin/reports', { cookie: mod.cookie, headers: { 'cf-connecting-ip': `${ipBase}.1` } });
    expect(reports.status).toBe(200);

    const roleGrant = await api('/api/admin/users/authz-member/role', {
      method: 'POST', cookie: mod.cookie, body: { role: 'admin' },
      headers: { 'cf-connecting-ip': `${ipBase}.2` }
    });
    expect(roleGrant.status).toBe(403);
  });
});
