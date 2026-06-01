import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { seedUser, connect } from '../helpers';
import {
  setAccountStatus,
  createReport,
  listReports,
  resolveReport
} from '../../worker/services/moderation';

describe('moderation.setAccountStatus', () => {
  it('rejects an invalid status', async () => {
    await seedUser({ id: 'mo-u-1' });
    const res = await setAccountStatus(env.DB, 'mo-u-1', 'frozen');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('invalid_status');
  });

  it('rejects an unknown user', async () => {
    const res = await setAccountStatus(env.DB, 'mo-ghost', 'suspended');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('user_not_found');
  });

  it('suspended sets status + reason + until', async () => {
    await seedUser({ id: 'mo-u-2' });
    const until = '2026-12-31T00:00:00.000Z';
    const res = await setAccountStatus(env.DB, 'mo-u-2', 'suspended', 'spam', until);
    expect(res.ok).toBe(true);
    const row = await env.DB.prepare(
      'SELECT status, status_reason, status_until FROM users WHERE id = ?'
    ).bind('mo-u-2').first<{ status: string; status_reason: string; status_until: string }>();
    expect(row?.status).toBe('suspended');
    expect(row?.status_reason).toBe('spam');
    expect(row?.status_until).toBe(until);
  });

  it('active clears reason and until', async () => {
    await seedUser({ id: 'mo-u-3' });
    await setAccountStatus(env.DB, 'mo-u-3', 'suspended', 'spam', '2026-12-31T00:00:00.000Z');
    const res = await setAccountStatus(env.DB, 'mo-u-3', 'active', 'ignored');
    expect(res.ok).toBe(true);
    const row = await env.DB.prepare(
      'SELECT status, status_reason, status_until FROM users WHERE id = ?'
    ).bind('mo-u-3').first<{ status: string; status_reason: string | null; status_until: string | null }>();
    expect(row?.status).toBe('active');
    expect(row?.status_reason).toBeNull();
    expect(row?.status_until).toBeNull();
  });
});

describe('moderation.createReport / resolveReport', () => {
  it('rejects an invalid target type', async () => {
    await seedUser({ id: 'mo-rep-1' });
    const res = await createReport(env.DB, 'mo-rep-1', 'banana', 'tgt', 'bad');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('invalid_target_type');
  });

  it('rejects self-report on a user target', async () => {
    await seedUser({ id: 'mo-rep-2' });
    const res = await createReport(env.DB, 'mo-rep-2', 'user', 'mo-rep-2', 'me');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('cannot_report_self');
  });

  it('rejects an empty reason', async () => {
    await seedUser({ id: 'mo-rep-3' });
    await seedUser({ id: 'mo-tgt-3' });
    const res = await createReport(env.DB, 'mo-rep-3', 'user', 'mo-tgt-3', '   ');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('reason_required');
  });

  it('creates a valid report with status open', async () => {
    await seedUser({ id: 'mo-rep-4' });
    await seedUser({ id: 'mo-tgt-4' });
    const res = await createReport(env.DB, 'mo-rep-4', 'user', 'mo-tgt-4', 'harassment', 'details here');
    expect(res.ok).toBe(true);
    expect(res.reportId).toBeTruthy();
    const row = await env.DB.prepare('SELECT status, reason, target_id FROM reports WHERE id = ?')
      .bind(res.reportId!).first<{ status: string; reason: string; target_id: string }>();
    expect(row?.status).toBe('open');
    expect(row?.reason).toBe('harassment');
    expect(row?.target_id).toBe('mo-tgt-4');
  });

  it('resolveReport sets status + resolved_by + resolved_at', async () => {
    await seedUser({ id: 'mo-rep-5' });
    await seedUser({ id: 'mo-tgt-5' });
    await seedUser({ id: 'mo-admin-5', role: 'admin' });
    const created = await createReport(env.DB, 'mo-rep-5', 'user', 'mo-tgt-5', 'spam');
    const res = await resolveReport(env.DB, 'mo-admin-5', created.reportId!, 'actioned');
    expect(res.ok).toBe(true);
    const row = await env.DB.prepare(
      'SELECT status, resolved_by, resolved_at FROM reports WHERE id = ?'
    ).bind(created.reportId!).first<{ status: string; resolved_by: string; resolved_at: string }>();
    expect(row?.status).toBe('actioned');
    expect(row?.resolved_by).toBe('mo-admin-5');
    expect(row?.resolved_at).toBeTruthy();
  });

  it('resolveReport rejects an invalid status', async () => {
    await seedUser({ id: 'mo-rep-6' });
    await seedUser({ id: 'mo-tgt-6' });
    await seedUser({ id: 'mo-admin-6', role: 'admin' });
    const created = await createReport(env.DB, 'mo-rep-6', 'user', 'mo-tgt-6', 'spam');
    const res = await resolveReport(env.DB, 'mo-admin-6', created.reportId!, 'maybe');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('invalid_status');
  });

  it('resolveReport returns not_found for an unknown report', async () => {
    await seedUser({ id: 'mo-admin-7', role: 'admin' });
    const res = await resolveReport(env.DB, 'mo-admin-7', 'rp-nope', 'dismissed');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('not_found');
  });

  // Regression: listReports' target_name CASE subquery for message reports must
  // select chat_messages.body (NOT a non-existent `message` column). Previously it
  // referenced `message`, which SQLite resolves at parse time for the whole
  // projection — so listReports threw "no such column: message" whenever ANY
  // report row existed, regardless of report type. Fixed in moderation.ts.
  it('listReports returns rows (does not throw) once reports exist', async () => {
    await seedUser({ id: 'mo-rep-8' });
    await seedUser({ id: 'mo-tgt-8a' });
    await createReport(env.DB, 'mo-rep-8', 'user', 'mo-tgt-8a', 'open one');

    const rows = await listReports(env.DB, 'open');
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.some((r: any) => r.reporter_user_id === 'mo-rep-8' && r.target_id === 'mo-tgt-8a')).toBe(true);
  });

  it('listReports resolves a message report target_name from chat_messages.body', async () => {
    await seedUser({ id: 'mo-rep-9' });
    await seedUser({ id: 'mo-tgt-9' });
    const { chatId } = await connect('mo-rep-9', 'mo-tgt-9');
    await env.DB.prepare(
      "INSERT INTO chat_messages (id, chat_id, sender_user_id, sender_role, body) VALUES ('mo-msg-9', ?, 'mo-tgt-9', 'match', 'reported text body')"
    ).bind(chatId).run();
    await createReport(env.DB, 'mo-rep-9', 'message', 'mo-msg-9', 'abusive');

    const rows = await listReports(env.DB);
    const row = rows.find((r: any) => r.target_id === 'mo-msg-9');
    expect(row?.target_name).toBe('reported text body');
  });
});
