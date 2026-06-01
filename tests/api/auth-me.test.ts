import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { api, seedUser, createSession, cookieFor } from '../helpers';

// GET /api/auth/me — session resolution via the SESSION cookie.
describe('GET /api/auth/me', () => {
  it('no cookie → 200 { user: null }', async () => {
    const res = await api('/api/auth/me');
    expect(res.status).toBe(200);
    const body = await res.json<{ user: unknown }>();
    expect(body.user).toBeNull();
  });

  it('valid session → 200 with the user id', async () => {
    await seedUser({ id: 'me-valid-1' });
    const sid = await createSession('me-valid-1');
    const res = await api('/api/auth/me', { cookie: cookieFor(sid) });
    expect(res.status).toBe(200);
    const body = await res.json<{ user: { id: string } | null }>();
    expect(body.user?.id).toBe('me-valid-1');
  });

  it('garbage cookie → 200 { user: null }', async () => {
    const res = await api('/api/auth/me', { cookie: cookieFor('not-a-real-session') });
    expect(res.status).toBe(200);
    const body = await res.json<{ user: unknown }>();
    expect(body.user).toBeNull();
  });

  it('expired session → 200 { user: null }', async () => {
    await seedUser({ id: 'me-expired-1' });
    // Insert a session that already expired.
    await env.DB.prepare(
      "INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, datetime(CURRENT_TIMESTAMP, '-1 day'))"
    ).bind('sess-expired-1', 'me-expired-1').run();
    const res = await api('/api/auth/me', { cookie: cookieFor('sess-expired-1') });
    expect(res.status).toBe(200);
    const body = await res.json<{ user: unknown }>();
    expect(body.user).toBeNull();
  });
});
