import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { seedUser, connect, block } from '../helpers';
import { assertCanSend } from '../../worker/services/chat';

// Insert a bare chats row (participants) WITHOUT any connection row.
async function bareChat(a: string, b: string): Promise<string> {
  const [x, y] = a < b ? [a, b] : [b, a];
  const slug = `bare-${x}-${y}`;
  await env.DB.prepare(
    'INSERT INTO chats (id, slug, participant_a_user_id, participant_b_user_id) VALUES (?, ?, ?, ?)'
  ).bind(`chat-bare-${x}-${y}`, slug, x, y).run();
  return slug;
}

// Insert an instant-plan group chat with the given members. `expiresInH` controls
// the plan TTL (negative => already expired).
async function groupChat(planId: string, members: string[], expiresInH = 24): Promise<string> {
  const slug = `plan-${planId}`;
  const chatId = `chat-${slug}`;
  const offsetMs = expiresInH * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + offsetMs).toISOString();
  await env.DB.prepare(
    `INSERT INTO instant_plans (id, creator_user_id, title, activity, time, location, capacity, expires_at)
     VALUES (?, ?, 'Coffee', 'Coffee Meetup', 'Tonight', 'Cafe', 5, ?)`
  ).bind(planId, members[0], expiresAt).run();
  await env.DB.prepare(
    `INSERT INTO chats (id, slug, kind, title, instant_plan_id) VALUES (?, ?, 'group', 'Coffee', ?)`
  ).bind(chatId, slug, planId).run();
  for (const m of members) {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO chat_participants (chat_id, user_id) VALUES (?, ?)'
    ).bind(chatId, m).run();
  }
  return slug;
}

describe('chat.assertCanSend', () => {
  it('returns chat_not_found when slug does not exist', async () => {
    await seedUser({ id: 'ch-sender-1' });
    const res = await assertCanSend(env.DB, 'ch-sender-1', 'does-not-exist');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(404);
    expect(res.error).toBe('chat_not_found');
  });

  it('returns not_a_participant when sender is not in the chat', async () => {
    await seedUser({ id: 'ch-a-2' });
    await seedUser({ id: 'ch-b-2' });
    await seedUser({ id: 'ch-outsider-2' });
    const { slug } = await connect('ch-a-2', 'ch-b-2');
    const res = await assertCanSend(env.DB, 'ch-outsider-2', slug);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toBe('not_a_participant');
  });

  it('returns not_connected when chat exists but no accepted connection', async () => {
    await seedUser({ id: 'ch-a-3' });
    await seedUser({ id: 'ch-b-3' });
    const slug = await bareChat('ch-a-3', 'ch-b-3');
    const res = await assertCanSend(env.DB, 'ch-a-3', slug);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toBe('not_connected');
  });

  it('returns blocked when sender has blocked the peer', async () => {
    await seedUser({ id: 'ch-a-4' });
    await seedUser({ id: 'ch-b-4' });
    const { slug } = await connect('ch-a-4', 'ch-b-4');
    await block('ch-a-4', 'ch-b-4');
    const res = await assertCanSend(env.DB, 'ch-a-4', slug);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toBe('blocked');
  });

  it('returns blocked when peer has blocked the sender (reverse direction)', async () => {
    await seedUser({ id: 'ch-a-5' });
    await seedUser({ id: 'ch-b-5' });
    const { slug } = await connect('ch-a-5', 'ch-b-5');
    await block('ch-b-5', 'ch-a-5');
    const res = await assertCanSend(env.DB, 'ch-a-5', slug);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('blocked');
  });

  it('returns peer_unavailable when peer is suspended', async () => {
    await seedUser({ id: 'ch-a-6' });
    await seedUser({ id: 'ch-b-6', status: 'suspended' });
    const { slug } = await connect('ch-a-6', 'ch-b-6');
    const res = await assertCanSend(env.DB, 'ch-a-6', slug);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toBe('peer_unavailable');
  });

  it('returns peer_unavailable when peer is banned', async () => {
    await seedUser({ id: 'ch-a-7' });
    await seedUser({ id: 'ch-b-7', status: 'banned' });
    const { slug } = await connect('ch-a-7', 'ch-b-7');
    const res = await assertCanSend(env.DB, 'ch-a-7', slug);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('peer_unavailable');
  });

  it('happy path: connected + both active returns ok with chatId + peerId', async () => {
    await seedUser({ id: 'ch-a-8' });
    await seedUser({ id: 'ch-b-8' });
    const { slug, chatId } = await connect('ch-a-8', 'ch-b-8');
    const res = await assertCanSend(env.DB, 'ch-a-8', slug);
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.chatId).toBe(chatId);
    expect(res.peerId).toBe('ch-b-8');
    expect(res.kind).toBe('direct');
  });
});

describe('chat.assertCanSend (group chats)', () => {
  it('happy path: a plan member may send; no connection/peer required', async () => {
    await seedUser({ id: 'grp-a-1' });
    await seedUser({ id: 'grp-b-1' });
    await seedUser({ id: 'grp-c-1' });
    const slug = await groupChat('plan-1', ['grp-a-1', 'grp-b-1', 'grp-c-1']);
    const res = await assertCanSend(env.DB, 'grp-b-1', slug);
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.chatId).toBe(`chat-${slug}`);
    expect(res.kind).toBe('group');
    expect(res.peerId).toBeUndefined();
  });

  it('returns not_a_participant when sender never joined the plan', async () => {
    await seedUser({ id: 'grp-a-2' });
    await seedUser({ id: 'grp-out-2' });
    const slug = await groupChat('plan-2', ['grp-a-2']);
    const res = await assertCanSend(env.DB, 'grp-out-2', slug);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toBe('not_a_participant');
  });

  it('returns plan_expired once the plan TTL has passed', async () => {
    await seedUser({ id: 'grp-a-3' });
    const slug = await groupChat('plan-3', ['grp-a-3'], -1); // expired 1h ago
    const res = await assertCanSend(env.DB, 'grp-a-3', slug);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toBe('plan_expired');
  });
});
