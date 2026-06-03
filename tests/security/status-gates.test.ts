// SECURITY: account-status gates at the dispatch boundary.
//   suspended → reads allowed, writes blocked (403 account_suspended)
//   banned    → everything blocked (403 account_banned), including GETs
import { describe, it, expect } from 'vitest';
import { api, seedAuthed } from '../helpers';

describe('suspended account: reads allowed, writes blocked', () => {
  it('GET /api/state → 200 (reads allowed)', async () => {
    const s = await seedAuthed({ id: 'gate-susp-1', status: 'suspended', completed: true });
    const res = await api('/api/state', {
      cookie: s.cookie,
      headers: { 'cf-connecting-ip': '198.51.100.60' }
    });
    expect(res.status).toBe(200);
  });

  it('PATCH /api/profile → 403 account_suspended (writes blocked)', async () => {
    const s = await seedAuthed({ id: 'gate-susp-2', status: 'suspended', completed: true });
    const res = await api('/api/profile', {
      method: 'PATCH',
      cookie: s.cookie,
      body: { profile: { bio: 'updated' } },
      headers: { 'cf-connecting-ip': '198.51.100.61' }
    });
    expect(res.status).toBe(403);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe('account_suspended');
  });

  it('POST /api/reports → 403 account_suspended (writes blocked)', async () => {
    const s = await seedAuthed({ id: 'gate-susp-3', status: 'suspended', completed: true });
    const res = await api('/api/reports', {
      method: 'POST',
      cookie: s.cookie,
      body: { targetType: 'user', targetId: 'someone', reason: 'spam' },
      headers: { 'cf-connecting-ip': '198.51.100.62' }
    });
    expect(res.status).toBe(403);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe('account_suspended');
  });
});

describe('banned account: everything blocked', () => {
  it('GET /api/state → 403 account_banned', async () => {
    const s = await seedAuthed({ id: 'gate-ban-1', status: 'banned', completed: true });
    const res = await api('/api/state', {
      cookie: s.cookie,
      headers: { 'cf-connecting-ip': '198.51.100.63' }
    });
    expect(res.status).toBe(403);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe('account_banned');
  });

  it('PATCH /api/profile → 403 account_banned', async () => {
    const s = await seedAuthed({ id: 'gate-ban-2', status: 'banned', completed: true });
    const res = await api('/api/profile', {
      method: 'PATCH',
      cookie: s.cookie,
      body: { profile: { bio: 'x' } },
      headers: { 'cf-connecting-ip': '198.51.100.64' }
    });
    expect(res.status).toBe(403);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe('account_banned');
  });
});
