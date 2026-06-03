import { describe, it, expect } from 'vitest';
import { api, seedAuthed, count } from '../helpers';

// POST /api/reports — authed user files a report against another user.
describe('POST /api/reports', () => {
  it('reporting another user → 201 { reportId }, open row exists', async () => {
    const reporter = await seedAuthed({ id: 'rep-a-1', completed: true });
    await seedAuthed({ id: 'rep-b-1', completed: true });

    const res = await api('/api/reports', {
      method: 'POST',
      cookie: reporter.cookie,
      body: { targetType: 'user', targetId: 'rep-b-1', reason: 'harassment', details: 'rude messages' }
    });
    expect(res.status).toBe(201);
    const body = await res.json<{ ok: boolean; reportId: string }>();
    expect(body.ok).toBe(true);
    expect(body.reportId).toBeTruthy();

    const n = await count(
      "SELECT COUNT(*) AS n FROM reports WHERE id = ? AND status = 'open' AND reporter_user_id = ? AND target_id = ?",
      body.reportId, 'rep-a-1', 'rep-b-1'
    );
    expect(n).toBe(1);
  });
});
