import { env, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { seedAuthed, api, count } from '../helpers';

describe('vibe-checks API', () => {
  it('GET /api/vibe-checks/daily-quota returns quota', async () => {
    const { cookie } = await seedAuthed({ id: 'api-vc-quota' });
    const res = await api('/api/vibe-checks/daily-quota', { cookie });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.total).toBe(10);
    expect(data.remaining).toBe(10);
    expect(data.used).toBe(0);
  });

  it('GET /api/vibe-checks/inbox returns empty when no vibe checks', async () => {
    const { cookie } = await seedAuthed({ id: 'api-vc-inbox-empty' });
    const res = await api('/api/vibe-checks/inbox', { cookie });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.vibeChecks).toEqual([]);
  });

  it('GET /api/vibe-checks/outbox returns empty initially', async () => {
    const { cookie } = await seedAuthed({ id: 'api-vc-out-empty' });
    const res = await api('/api/vibe-checks/outbox', { cookie });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.vibeChecks).toEqual([]);
  });

  it('POST /api/vibe-checks/:id/accept returns 400 for non-existent check', async () => {
    const { cookie } = await seedAuthed({ id: 'api-vc-bad-accept' });
    const res = await api('/api/vibe-checks/vc-nonexistent/accept', { method: 'POST', cookie });
    expect(res.status).toBe(400);
  });

  it('POST /api/vibe-checks/:id/decline returns 400 for non-existent check', async () => {
    const { cookie } = await seedAuthed({ id: 'api-vc-bad-decline' });
    const res = await api('/api/vibe-checks/vc-nonexistent/decline', { method: 'POST', cookie });
    expect(res.status).toBe(400);
  });

  it('POST /api/vibe-checks/:id/listen returns 400 for non-existent check', async () => {
    const { cookie } = await seedAuthed({ id: 'api-vc-bad-listen' });
    const res = await api('/api/vibe-checks/vc-nonexistent/listen', { method: 'POST', cookie });
    expect(res.status).toBe(400);
  });

  it('Vibe check data is included in GET /api/state', async () => {
    const { cookie: cookieA } = await seedAuthed({ id: 'api-vc-state-a', fullName: 'Sender A' });
    const { cookie: cookieB } = await seedAuthed({ id: 'api-vc-state-b', fullName: 'Receiver B' });

    // Send a vibe check from A to B via DB directly (simulating the service call)
    // Then check that B's state includes it
    const vcId = 'vc-state-test-1';
    await env.DB.prepare(
      `INSERT INTO vibe_checks (id, from_user_id, to_user_id, voice_url, voice_duration, status, expires_at)
       VALUES (?, ?, ?, ?, ?, 'pending', datetime('now', '+7 days'))`
    ).bind(vcId, 'api-vc-state-a', 'api-vc-state-b', '/api/vibe-checks/vc-state-test-1/voice', 8).run();

    const res = await api('/api/state', { cookie: cookieB });
    expect(res.ok).toBe(true);
    const data = await res.json();
    const inbox = data.state?.vibeChecks?.inbox || [];
    const found = inbox.find((vc: any) => vc.id === vcId);
    expect(found).toBeTruthy();
    expect(found.from.name).toBe('Sender A');
    expect(found.voiceDuration).toBe(8);
  });
});
