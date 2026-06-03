// SECURITY: a guest never resolves to a real user, and no PII / contact details
// ever leak through the public member DTO.
import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { api, seedUser, seedAuthed } from '../helpers';

describe('guest never resolves to a real user', () => {
  it('GET /api/state with NO cookie → 401 authentication required', async () => {
    const res = await api('/api/state', { headers: { 'cf-connecting-ip': '198.51.100.1' } });
    expect(res.status).toBe(401);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe('Authentication required');
  });

  it('GET /api/auth/me with no cookie → {user:null} (never a real user)', async () => {
    // Even with real users present in the DB, an unauthenticated caller is a guest.
    await seedUser({ id: 'pii-realuser', email: 'realuser@secret.example' });
    const res = await api('/api/auth/me', { headers: { 'cf-connecting-ip': '198.51.100.2' } });
    expect(res.status).toBe(200);
    const body = await res.json<{ user: unknown }>();
    expect(body.user).toBeNull();
  });
});

describe('member DTO carries no PII / contact details', () => {
  it('GET /api/members never exposes whatsapp, instagram handle, or email', async () => {
    // User A has secret contact fields stamped directly onto the profile row.
    await seedUser({ id: 'pii-A', email: 'a-private@secret.example' });
    await env.DB.prepare(
      "UPDATE profiles SET whatsapp = 'SECRET999', instagram = 'secrethandle' WHERE user_id = ?"
    ).bind('pii-A').run();

    // User B is a completed, authenticated member who lists everyone.
    const b = await seedAuthed({ id: 'pii-B', completed: true });

    const res = await api('/api/members', {
      cookie: b.cookie,
      headers: { 'cf-connecting-ip': '198.51.100.3' }
    });
    expect(res.status).toBe(200);

    const raw = JSON.stringify(await res.json());
    // A must appear in the list (sanity) but WITHOUT any contact PII.
    expect(raw).toContain('pii-A');
    expect(raw).not.toContain('SECRET999');
    expect(raw).not.toContain('secrethandle');
    expect(raw).not.toContain('a-private@secret.example');
  });
});
