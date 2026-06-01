import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { seedUser, block, count } from '../helpers';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getIncomingRequests,
  getConnections
} from '../../worker/services/connections';

describe('connections', () => {
  it('send creates a pending request that the recipient sees as incoming', async () => {
    await seedUser({ id: 'co-from-1' });
    await seedUser({ id: 'co-to-1' });
    const res = await sendConnectionRequest(env.DB, 'co-from-1', 'co-to-1', 'hi');
    expect(res.ok).toBe(true);
    expect(res.status).toBe('pending');

    expect(await count(
      "SELECT COUNT(*) AS n FROM connection_requests WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'",
      'co-from-1', 'co-to-1'
    )).toBe(1);

    const incoming = await getIncomingRequests(env.DB, 'co-to-1');
    expect(incoming.length).toBe(1);
    expect(incoming[0].from.id).toBe('co-from-1');
    expect(incoming[0].note).toBe('hi');
  });

  it('accept creates a connection + chat and shows in getConnections', async () => {
    await seedUser({ id: 'co-from-2' });
    await seedUser({ id: 'co-to-2' });
    await sendConnectionRequest(env.DB, 'co-from-2', 'co-to-2', 'hello');
    const reqRow = await env.DB.prepare(
      'SELECT id FROM connection_requests WHERE from_user_id = ? AND to_user_id = ?'
    ).bind('co-from-2', 'co-to-2').first<{ id: string }>();

    const accepted = await acceptConnectionRequest(env.DB, 'co-to-2', reqRow!.id);
    expect(accepted.ok).toBe(true);
    expect(accepted.status).toBe('connected');
    expect(accepted.chatId).toBeTruthy();

    // request became accepted
    const after = await env.DB.prepare('SELECT status FROM connection_requests WHERE id = ?')
      .bind(reqRow!.id).first<{ status: string }>();
    expect(after?.status).toBe('accepted');

    // connection exists for both perspectives
    const forFrom = await getConnections(env.DB, 'co-from-2');
    const forTo = await getConnections(env.DB, 'co-to-2');
    expect(forFrom.length).toBe(1);
    expect(forTo.length).toBe(1);
    expect(forFrom[0].other_id).toBe('co-to-2');
    expect(forTo[0].other_id).toBe('co-from-2');
  });

  it('mutual request auto-accepts (instant match)', async () => {
    await seedUser({ id: 'co-a-3' });
    await seedUser({ id: 'co-b-3' });
    const first = await sendConnectionRequest(env.DB, 'co-a-3', 'co-b-3', 'a->b');
    expect(first.status).toBe('pending');

    // B sends to A while A's request is pending => auto-accept
    const second = await sendConnectionRequest(env.DB, 'co-b-3', 'co-a-3', 'b->a');
    expect(second.ok).toBe(true);
    expect(second.status).toBe('connected');
    expect(second.chatId).toBeTruthy();

    expect(await count(
      "SELECT COUNT(*) AS n FROM connections WHERE status = 'accepted' AND ((user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?))",
      'co-a-3', 'co-b-3', 'co-b-3', 'co-a-3'
    )).toBe(1);
  });

  it('send to self is rejected with invalid_target', async () => {
    await seedUser({ id: 'co-self-4' });
    const res = await sendConnectionRequest(env.DB, 'co-self-4', 'co-self-4', '');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('invalid_target');
  });

  it('send to a blocked/unavailable user is rejected with not_available', async () => {
    await seedUser({ id: 'co-from-5' });
    await seedUser({ id: 'co-to-5' });
    // target blocked the sender => not visible
    await block('co-to-5', 'co-from-5');
    const res = await sendConnectionRequest(env.DB, 'co-from-5', 'co-to-5', '');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('not_available');
  });

  it('duplicate send is a no-op returning pending (single row)', async () => {
    await seedUser({ id: 'co-from-6' });
    await seedUser({ id: 'co-to-6' });
    const first = await sendConnectionRequest(env.DB, 'co-from-6', 'co-to-6', 'first');
    const second = await sendConnectionRequest(env.DB, 'co-from-6', 'co-to-6', 'second');
    expect(first.status).toBe('pending');
    expect(second.ok).toBe(true);
    expect(second.status).toBe('pending');
    expect(await count(
      'SELECT COUNT(*) AS n FROM connection_requests WHERE from_user_id = ? AND to_user_id = ?',
      'co-from-6', 'co-to-6'
    )).toBe(1);
  });

  it('reject marks the request rejected; accept of others-request is forbidden', async () => {
    await seedUser({ id: 'co-from-7' });
    await seedUser({ id: 'co-to-7' });
    await seedUser({ id: 'co-other-7' });
    await sendConnectionRequest(env.DB, 'co-from-7', 'co-to-7', '');
    const reqRow = await env.DB.prepare(
      'SELECT id FROM connection_requests WHERE from_user_id = ? AND to_user_id = ?'
    ).bind('co-from-7', 'co-to-7').first<{ id: string }>();

    // someone who isn't the recipient cannot accept
    const forbidden = await acceptConnectionRequest(env.DB, 'co-other-7', reqRow!.id);
    expect(forbidden.ok).toBe(false);
    expect(forbidden.error).toBe('forbidden');

    const rejected = await rejectConnectionRequest(env.DB, 'co-to-7', reqRow!.id);
    expect(rejected.ok).toBe(true);
    const after = await env.DB.prepare('SELECT status FROM connection_requests WHERE id = ?')
      .bind(reqRow!.id).first<{ status: string }>();
    expect(after?.status).toBe('rejected');
  });

  it('accept of an unknown request returns not_found', async () => {
    await seedUser({ id: 'co-x-8' });
    const res = await acceptConnectionRequest(env.DB, 'co-x-8', 'nope');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('not_found');
  });
});
