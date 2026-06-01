import { describe, it, expect } from 'vitest';
import { api, seedAuthed } from '../helpers';

// Admin console routes. ADMIN_USER_IDS='admin-seed' in the test env, so the user
// whose id is 'admin-seed' resolves to role 'admin'.
describe('GET /api/admin/me', () => {
  it('normal member → 200 member / not moderator / not admin', async () => {
    const m = await seedAuthed({ id: 'adm-member-1', completed: true });
    const res = await api('/api/admin/me', { cookie: m.cookie });
    expect(res.status).toBe(200);
    const body = await res.json<{ role: string; isModerator: boolean; isAdmin: boolean }>();
    expect(body.role).toBe('member');
    expect(body.isModerator).toBe(false);
    expect(body.isAdmin).toBe(false);
  });
});

describe('GET /api/admin/reports', () => {
  it('normal member → 403', async () => {
    const m = await seedAuthed({ id: 'adm-member-2', completed: true });
    const res = await api('/api/admin/reports', { cookie: m.cookie });
    expect(res.status).toBe(403);
  });

  it('admin → 200 { reports: [...] } and lists a created report', async () => {
    // Seed the admin (id matches ADMIN_USER_IDS) and a reporter who files a report.
    const admin = await seedAuthed({ id: 'admin-seed', completed: true });
    const reporter = await seedAuthed({ id: 'adm-reporter-1', completed: true });
    await seedAuthed({ id: 'adm-target-1', completed: true });

    const created = await api('/api/reports', {
      method: 'POST',
      cookie: reporter.cookie,
      body: { targetType: 'user', targetId: 'adm-target-1', reason: 'spam' }
    });
    expect(created.status).toBe(201);

    const res = await api('/api/admin/reports', { cookie: admin.cookie });
    expect(res.status).toBe(200);
    const body = await res.json<{ reports: unknown[] }>();
    expect(Array.isArray(body.reports)).toBe(true);
    expect(body.reports.length).toBeGreaterThanOrEqual(1);
  });
});
