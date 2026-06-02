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

  it('valid session → returns persisted onboardingStep (cross-device resume)', async () => {
    // Regression: /api/auth/me must SELECT onboarding_step, otherwise the
    // onboarding resume path is dead and Google sign-in restarts at step 1.
    await seedUser({ id: 'me-step-1' });
    await env.DB.prepare('UPDATE users SET onboarding_step = ? WHERE id = ?').bind(7, 'me-step-1').run();
    const sid = await createSession('me-step-1');
    const res = await api('/api/auth/me', { cookie: cookieFor(sid) });
    expect(res.status).toBe(200);
    const body = await res.json<{ user: { onboardingStep: number } | null }>();
    expect(body.user?.onboardingStep).toBe(7);
  });

  it('onboardingCompleted=false for an incomplete account (must resume onboarding)', async () => {
    await seedUser({ id: 'me-incomplete-1', completed: false });
    const sid = await createSession('me-incomplete-1');
    const res = await api('/api/auth/me', { cookie: cookieFor(sid) });
    const body = await res.json<{ user: { onboardingCompleted: boolean } | null }>();
    expect(body.user?.onboardingCompleted).toBe(false);
  });

  it('onboardingCompleted=true for a finished account (must skip onboarding)', async () => {
    await seedUser({ id: 'me-complete-1', completed: true });
    const sid = await createSession('me-complete-1');
    const res = await api('/api/auth/me', { cookie: cookieFor(sid) });
    const body = await res.json<{ user: { onboardingCompleted: boolean } | null }>();
    expect(body.user?.onboardingCompleted).toBe(true);
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
