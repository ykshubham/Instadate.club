import { describe, it, expect } from 'vitest';
import { api, seedAuthed, connect, count } from '../helpers';

// POST /api/chats/:slug/messages — requires a published profile AND an accepted
// connection. Success returns 201; idempotent resends (same clientMsgId) collapse.
describe('POST /api/chats/:slug/messages', () => {
  it('connected + published sender → 201', async () => {
    const a = await seedAuthed({ id: 'cm-a-1', completed: true });
    await seedAuthed({ id: 'cm-b-1', completed: true });
    const { slug } = await connect('cm-a-1', 'cm-b-1');

    const res = await api(`/api/chats/${slug}/messages`, {
      method: 'POST',
      cookie: a.cookie,
      body: { text: 'hello there' }
    });
    expect(res.status).toBe(201);
  });

  it('third user (not a participant) → 403', async () => {
    await seedAuthed({ id: 'cm-a-2', completed: true });
    await seedAuthed({ id: 'cm-b-2', completed: true });
    const third = await seedAuthed({ id: 'cm-c-2', completed: true });
    const { slug } = await connect('cm-a-2', 'cm-b-2');

    const res = await api(`/api/chats/${slug}/messages`, {
      method: 'POST',
      cookie: third.cookie,
      body: { text: 'let me in' }
    });
    expect(res.status).toBe(403);
  });

  it('empty text → 400', async () => {
    const a = await seedAuthed({ id: 'cm-a-3', completed: true });
    await seedAuthed({ id: 'cm-b-3', completed: true });
    const { slug } = await connect('cm-a-3', 'cm-b-3');

    const res = await api(`/api/chats/${slug}/messages`, {
      method: 'POST',
      cookie: a.cookie,
      body: { text: '   ' }
    });
    expect(res.status).toBe(400);
  });

  it('text > 4000 chars → 400', async () => {
    const a = await seedAuthed({ id: 'cm-a-4', completed: true });
    await seedAuthed({ id: 'cm-b-4', completed: true });
    const { slug } = await connect('cm-a-4', 'cm-b-4');

    const res = await api(`/api/chats/${slug}/messages`, {
      method: 'POST',
      cookie: a.cookie,
      body: { text: 'x'.repeat(4001) }
    });
    expect(res.status).toBe(400);
  });

  it('idempotency: same clientMsgId → second is deduped, one row only', async () => {
    const a = await seedAuthed({ id: 'cm-a-5', completed: true });
    await seedAuthed({ id: 'cm-b-5', completed: true });
    const { slug, chatId } = await connect('cm-a-5', 'cm-b-5');

    const first = await api(`/api/chats/${slug}/messages`, {
      method: 'POST',
      cookie: a.cookie,
      body: { text: 'dedupe me', clientMsgId: 'client-xyz-1' }
    });
    expect(first.status).toBe(201);

    const second = await api(`/api/chats/${slug}/messages`, {
      method: 'POST',
      cookie: a.cookie,
      body: { text: 'dedupe me', clientMsgId: 'client-xyz-1' }
    });
    expect(second.status).toBe(200);
    const body = await second.json<{ deduped?: boolean }>();
    expect(body.deduped).toBe(true);

    const n = await count('SELECT COUNT(*) AS n FROM chat_messages WHERE chat_id = ?', chatId);
    expect(n).toBe(1);
  });
});
