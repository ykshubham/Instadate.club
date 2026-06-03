import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { api, seedAuthed, connect } from '../helpers';

// Insert a chat_messages row directly with a known id.
async function seedMessage(id: string, chatId: string, sender: string, body = 'seeded body') {
  await env.DB.prepare(
    "INSERT INTO chat_messages (id, chat_id, sender_user_id, sender_role, body) VALUES (?, ?, ?, 'you', ?)"
  ).bind(id, chatId, sender, body).run();
}

// GET /api/chats/:slug/since — catch-up fetch for participants.
describe('GET /api/chats/:slug/since', () => {
  it('participant → 200 { messages, cursor } including seeded rows', async () => {
    const a = await seedAuthed({ id: 'sd-a-1', completed: true });
    await seedAuthed({ id: 'sd-b-1', completed: true });
    const { slug, chatId } = await connect('sd-a-1', 'sd-b-1');
    await seedMessage('sd-msg-1', chatId, 'sd-a-1', 'first');
    await seedMessage('sd-msg-2', chatId, 'sd-b-1', 'second');

    const res = await api(`/api/chats/${slug}/since`, { cookie: a.cookie });
    expect(res.status).toBe(200);
    const body = await res.json<{ messages: Array<{ id: string; body: string }>; cursor: string }>();
    expect(body.messages.length).toBe(2);
    expect(body.messages.map(m => m.body)).toEqual(['first', 'second']);
    expect(body.cursor).toBeTruthy();
  });

  it('non-participant (third user) → 403', async () => {
    await seedAuthed({ id: 'sd-a-2', completed: true });
    await seedAuthed({ id: 'sd-b-2', completed: true });
    const third = await seedAuthed({ id: 'sd-c-2', completed: true });
    const { slug } = await connect('sd-a-2', 'sd-b-2');

    const res = await api(`/api/chats/${slug}/since`, { cookie: third.cookie });
    expect(res.status).toBe(403);
  });

  it('unknown slug → 404', async () => {
    const a = await seedAuthed({ id: 'sd-a-3', completed: true });
    const res = await api('/api/chats/no-such-slug/since', { cookie: a.cookie });
    expect(res.status).toBe(404);
  });
});

// DELETE /api/messages/:id — soft delete by the author only.
describe('DELETE /api/messages/:id', () => {
  it('owner deletes → 200, body becomes [message deleted] and deleted_at set', async () => {
    const a = await seedAuthed({ id: 'del-a-1', completed: true });
    await seedAuthed({ id: 'del-b-1', completed: true });
    const { chatId } = await connect('del-a-1', 'del-b-1');
    await seedMessage('del-msg-1', chatId, 'del-a-1', 'secret');

    const res = await api('/api/messages/del-msg-1', { method: 'DELETE', cookie: a.cookie });
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean }>();
    expect(body.ok).toBe(true);

    const row = await env.DB.prepare(
      'SELECT body, deleted_at FROM chat_messages WHERE id = ?'
    ).bind('del-msg-1').first<{ body: string; deleted_at: string | null }>();
    expect(row?.body).toBe('[message deleted]');
    expect(row?.deleted_at).toBeTruthy();
  });

  it('a different user deleting → 403', async () => {
    await seedAuthed({ id: 'del-a-2', completed: true });
    const b = await seedAuthed({ id: 'del-b-2', completed: true });
    const { chatId } = await connect('del-a-2', 'del-b-2');
    await seedMessage('del-msg-2', chatId, 'del-a-2', 'owned by a');

    const res = await api('/api/messages/del-msg-2', { method: 'DELETE', cookie: b.cookie });
    expect(res.status).toBe(403);
  });

  it('unknown id → 404', async () => {
    const a = await seedAuthed({ id: 'del-a-3', completed: true });
    const res = await api('/api/messages/does-not-exist', { method: 'DELETE', cookie: a.cookie });
    expect(res.status).toBe(404);
  });
});
