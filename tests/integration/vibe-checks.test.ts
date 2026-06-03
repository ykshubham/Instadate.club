import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { seedUser, block, count } from '../helpers';
import {
  sendVibeCheck,
  getIncomingVibeChecks,
  getOutgoingVibeChecks,
  checkDailyQuota,
  markVibeCheckListened,
  acceptVibeCheck,
  declineVibeCheck,
  expireStaleVibeChecks,
  cleanupExpiredCooldowns
} from '../../worker/services/vibe-checks';

const fakeAudioBuffer = new ArrayBuffer(1024);
const fakeContentType = 'audio/webm';

describe('vibe-checks', () => {
  // --- SEND ---

  it('send creates a pending vibe check visible in inbox', async () => {
    await seedUser({ id: 'vc-from-1' });
    await seedUser({ id: 'vc-to-1' });
    const res = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-from-1', 'vc-to-1', fakeAudioBuffer, fakeContentType, 5);
    expect(res.ok).toBe(true);
    expect(res.status).toBe('pending');
    expect(res.vibeCheckId).toBeTruthy();

    expect(await count(
      "SELECT COUNT(*) AS n FROM vibe_checks WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'",
      'vc-from-1', 'vc-to-1'
    )).toBe(1);

    const inbox = await getIncomingVibeChecks(env.DB, 'vc-to-1');
    expect(inbox.length).toBe(1);
    expect(inbox[0].from.id).toBe('vc-from-1');
    expect(inbox[0].voiceDuration).toBe(5);
  });

  it('send to self is rejected', async () => {
    await seedUser({ id: 'vc-self' });
    const res = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-self', 'vc-self', fakeAudioBuffer, fakeContentType, 5);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('invalid_target');
  });

  it('send when already pending is rejected', async () => {
    await seedUser({ id: 'vc-dup-a' });
    await seedUser({ id: 'vc-dup-b' });
    await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-dup-a', 'vc-dup-b', fakeAudioBuffer, fakeContentType, 5);
    const res2 = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-dup-a', 'vc-dup-b', fakeAudioBuffer, fakeContentType, 10);
    expect(res2.ok).toBe(false);
    expect(res2.error).toBe('already_pending');
  });

  it('send to blocked user is rejected', async () => {
    await seedUser({ id: 'vc-block-a' });
    await seedUser({ id: 'vc-block-b' });
    await block('vc-block-b', 'vc-block-a'); // B blocks A
    const res = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-block-a', 'vc-block-b', fakeAudioBuffer, fakeContentType, 5);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('not_available');
  });

  it('send exceeds message duration limit', async () => {
    await seedUser({ id: 'vc-dur-a' });
    await seedUser({ id: 'vc-dur-b' });
    const res = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-dur-a', 'vc-dur-b', fakeAudioBuffer, fakeContentType, 31);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('invalid_duration');
  });

  // --- DAILY QUOTA ---

  it('daily quota tracks usage', async () => {
    await seedUser({ id: 'vc-quota' });
    const initial = await checkDailyQuota(env.DB, 'vc-quota');
    expect(initial.total).toBe(10);
    expect(initial.remaining).toBe(10);
  });

  // --- ACCEPT ---

  it('accept creates a connection + chat', async () => {
    await seedUser({ id: 'vc-acc-a' });
    await seedUser({ id: 'vc-acc-b' });
    const sent = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-acc-a', 'vc-acc-b', fakeAudioBuffer, fakeContentType, 5);
    expect(sent.ok).toBe(true);

    const accepted = await acceptVibeCheck(env.DB, 'vc-acc-b', sent.vibeCheckId!);
    expect(accepted.ok).toBe(true);
    expect(accepted.status).toBe('connected');
    expect(accepted.chatId).toBeTruthy();

    // Vibe check status updated
    const vc = await env.DB.prepare('SELECT status FROM vibe_checks WHERE id = ?')
      .bind(sent.vibeCheckId!).first<{ status: string }>();
    expect(vc?.status).toBe('accepted');

    // Connection exists
    expect(await count(
      "SELECT COUNT(*) AS n FROM connections WHERE status = 'accepted' AND ((user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?))",
      'vc-acc-a', 'vc-acc-b', 'vc-acc-b', 'vc-acc-a'
    )).toBe(1);

    // Chat created
    expect(await count(
      "SELECT COUNT(*) AS n FROM chats WHERE (participant_a_user_id = ? AND participant_b_user_id = ?) OR (participant_a_user_id = ? AND participant_b_user_id = ?)",
      'vc-acc-a', 'vc-acc-b', 'vc-acc-b', 'vc-acc-a'
    )).toBe(1);
  });

  it('cannot accept a vibe check not addressed to you', async () => {
    await seedUser({ id: 'vc-acc-c' });
    await seedUser({ id: 'vc-acc-d' });
    await seedUser({ id: 'vc-acc-e' });
    const sent = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-acc-c', 'vc-acc-d', fakeAudioBuffer, fakeContentType, 5);
    const res = await acceptVibeCheck(env.DB, 'vc-acc-e', sent.vibeCheckId!);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('forbidden');
  });

  // --- MUTUAL ACCEPT ---

  it('mutual vibe checks auto-accept both when one accepts', async () => {
    await seedUser({ id: 'vc-mut-a' });
    await seedUser({ id: 'vc-mut-b' });
    // A sends to B
    const aToB = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-mut-a', 'vc-mut-b', fakeAudioBuffer, fakeContentType, 5);
    // B sends to A
    const bToA = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-mut-b', 'vc-mut-a', fakeAudioBuffer, fakeContentType, 8);
    expect(bToA.ok).toBe(true);

    // B accepts A's vibe check
    const accepted = await acceptVibeCheck(env.DB, 'vc-mut-b', aToB.vibeCheckId!);
    expect(accepted.ok).toBe(true);
    expect(accepted.status).toBe('connected');

    // Both should be accepted
    const aToBStatus = await env.DB.prepare('SELECT status FROM vibe_checks WHERE id = ?')
      .bind(aToB.vibeCheckId!).first<{ status: string }>();
    const bToAStatus = await env.DB.prepare('SELECT status FROM vibe_checks WHERE id = ?')
      .bind(bToA.vibeCheckId!).first<{ status: string }>();
    expect(aToBStatus?.status).toBe('accepted');
    expect(bToAStatus?.status).toBe('accepted');

    // One connection
    expect(await count(
      "SELECT COUNT(*) AS n FROM connections WHERE status = 'accepted' AND ((user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?))",
      'vc-mut-a', 'vc-mut-b', 'vc-mut-b', 'vc-mut-a'
    )).toBe(1);
  });

  // --- DECLINE ---

  it('decline sets cooldown and prevents re-send', async () => {
    await seedUser({ id: 'vc-dec-a' });
    await seedUser({ id: 'vc-dec-b' });
    const sent = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-dec-a', 'vc-dec-b', fakeAudioBuffer, fakeContentType, 5);
    const dec = await declineVibeCheck(env.DB, 'vc-dec-b', sent.vibeCheckId!);
    expect(dec.ok).toBe(true);

    // Status updated
    const vc = await env.DB.prepare('SELECT status FROM vibe_checks WHERE id = ?')
      .bind(sent.vibeCheckId!).first<{ status: string }>();
    expect(vc?.status).toBe('declined');

    // Cooldown exists
    expect(await count(
      "SELECT COUNT(*) AS n FROM vibe_check_decline_cooldowns WHERE from_user_id = ? AND to_user_id = ?",
      'vc-dec-a', 'vc-dec-b'
    )).toBe(1);

    // Cannot re-send
    const resend = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-dec-a', 'vc-dec-b', fakeAudioBuffer, fakeContentType, 5);
    expect(resend.ok).toBe(false);
    expect(resend.error).toBe('cooldown_active');
  });

  // --- LISTEN ---

  it('mark listened updates status', async () => {
    await seedUser({ id: 'vc-listen-a' });
    await seedUser({ id: 'vc-listen-b' });
    const sent = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-listen-a', 'vc-listen-b', fakeAudioBuffer, fakeContentType, 5);

    const res = await markVibeCheckListened(env.DB, 'vc-listen-b', sent.vibeCheckId!);
    expect(res.ok).toBe(true);

    const vc = await env.DB.prepare('SELECT status, listened_at FROM vibe_checks WHERE id = ?')
      .bind(sent.vibeCheckId!).first<{ status: string; listened_at: string | null }>();
    expect(vc?.status).toBe('listened');
    expect(vc?.listened_at).toBeTruthy();
  });

  it('cannot mark listened if not recipient', async () => {
    await seedUser({ id: 'vc-listen-c' });
    await seedUser({ id: 'vc-listen-d' });
    const sent = await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-listen-c', 'vc-listen-d', fakeAudioBuffer, fakeContentType, 5);
    const res = await markVibeCheckListened(env.DB, 'vc-listen-c', sent.vibeCheckId!);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('forbidden');
  });

  // --- EXPIRY ---

  it('expireStaleVibeChecks expires old pending checks', async () => {
    await seedUser({ id: 'vc-exp-a' });
    await seedUser({ id: 'vc-exp-b' });
    // Insert an already-expired vibe check directly
    await env.DB.prepare(
      `INSERT INTO vibe_checks (id, from_user_id, to_user_id, voice_url, voice_duration, status, expires_at)
       VALUES (?, ?, ?, ?, ?, 'pending', datetime('now', '-1 day'))`
    ).bind('vc-exp-1', 'vc-exp-a', 'vc-exp-b', '/api/vibe-checks/vc-exp-1/voice', 5).run();

    const n = await expireStaleVibeChecks(env.DB);
    expect(n).toBeGreaterThanOrEqual(1);

    const vc = await env.DB.prepare('SELECT status FROM vibe_checks WHERE id = ?')
      .bind('vc-exp-1').first<{ status: string }>();
    expect(vc?.status).toBe('expired');
  });

  // --- OUTBOX ---

  it('outbox shows sent vibe checks', async () => {
    await seedUser({ id: 'vc-out-a' });
    await seedUser({ id: 'vc-out-b' });
    await sendVibeCheck(env.DB, env.PROFILE_IMAGES, 'vc-out-a', 'vc-out-b', fakeAudioBuffer, fakeContentType, 5);

    const outbox = await getOutgoingVibeChecks(env.DB, 'vc-out-a');
    expect(outbox.length).toBe(1);
    expect(outbox[0].to.id).toBe('vc-out-b');
    expect(outbox[0].status).toBe('pending');
  });
});
