import { describe, it, expect } from 'vitest';
import { api, seedAuthed } from '../helpers';

// GET /api/updates?since=<iso> — polling summary for the authed user.
describe('GET /api/updates', () => {
  it('authed user → 200 with the documented shape', async () => {
    const u = await seedAuthed({ id: 'upd-user-1', completed: true });
    const since = new Date(0).toISOString();
    const res = await api(`/api/updates?since=${encodeURIComponent(since)}`, { cookie: u.cookie });
    expect(res.status).toBe(200);

    const body = await res.json<{
      cursor: string;
      updates: { notifications: boolean; connections: boolean; events: boolean };
      unreadNotificationsCount: number;
      pendingRequestsCount: number;
    }>();

    expect(typeof body.cursor).toBe('string');
    expect(body.updates).toBeTruthy();
    expect(typeof body.updates.notifications).toBe('boolean');
    expect(typeof body.updates.connections).toBe('boolean');
    expect(typeof body.updates.events).toBe('boolean');
    expect(typeof body.unreadNotificationsCount).toBe('number');
    expect(typeof body.pendingRequestsCount).toBe('number');
  });
});
