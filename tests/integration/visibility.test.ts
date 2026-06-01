import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { seedUser, block } from '../helpers';
import { hiddenUserIds, visibleUserIds, visibleTo } from '../../worker/visibility';

async function reject(userId: string, rejectedId: string): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO user_rejections (user_id, rejected_user_id) VALUES (?, ?)'
  ).bind(userId, rejectedId).run();
}

describe('visibility', () => {
  it('hides blocked users in both directions', async () => {
    await seedUser({ id: 'vi-viewer-1' });
    await seedUser({ id: 'vi-t1-1' });
    await seedUser({ id: 'vi-t2-1' });
    await block('vi-viewer-1', 'vi-t1-1'); // viewer -> t1
    await block('vi-t2-1', 'vi-viewer-1'); // t2 -> viewer
    const hidden = await hiddenUserIds(env.DB, 'vi-viewer-1');
    expect(hidden.has('vi-t1-1')).toBe(true);
    expect(hidden.has('vi-t2-1')).toBe(true);
  });

  it('hides rejected users', async () => {
    await seedUser({ id: 'vi-viewer-2' });
    await seedUser({ id: 'vi-rejected-2' });
    await reject('vi-viewer-2', 'vi-rejected-2');
    const hidden = await hiddenUserIds(env.DB, 'vi-viewer-2');
    expect(hidden.has('vi-rejected-2')).toBe(true);
  });

  it('hides banned/suspended/deactivated accounts', async () => {
    await seedUser({ id: 'vi-viewer-3' });
    await seedUser({ id: 'vi-banned-3', status: 'banned' });
    await seedUser({ id: 'vi-susp-3', status: 'suspended' });
    await seedUser({ id: 'vi-deact-3', status: 'deactivated' });
    const hidden = await hiddenUserIds(env.DB, 'vi-viewer-3');
    expect(hidden.has('vi-banned-3')).toBe(true);
    expect(hidden.has('vi-susp-3')).toBe(true);
    expect(hidden.has('vi-deact-3')).toBe(true);
  });

  it('includes the viewer themselves in hiddenUserIds but visibleTo(self,self) is true', async () => {
    await seedUser({ id: 'vi-viewer-4' });
    const hidden = await hiddenUserIds(env.DB, 'vi-viewer-4');
    expect(hidden.has('vi-viewer-4')).toBe(true);
    expect(await visibleTo(env.DB, 'vi-viewer-4', 'vi-viewer-4')).toBe(true);
  });

  it('visibleUserIds returns only the active, non-blocked subset', async () => {
    await seedUser({ id: 'vi-viewer-5' });
    await seedUser({ id: 'vi-ok-5' });
    await seedUser({ id: 'vi-blocked-5' });
    await seedUser({ id: 'vi-banned-5', status: 'banned' });
    await block('vi-viewer-5', 'vi-blocked-5');
    const visible = await visibleUserIds(env.DB, 'vi-viewer-5', [
      'vi-ok-5', 'vi-blocked-5', 'vi-banned-5', 'vi-viewer-5'
    ]);
    expect(visible.has('vi-ok-5')).toBe(true);
    expect(visible.has('vi-blocked-5')).toBe(false);
    expect(visible.has('vi-banned-5')).toBe(false);
    expect(visible.has('vi-viewer-5')).toBe(false); // self excluded from lists
  });

  it('visibleTo returns false for a hidden target and true for a visible one', async () => {
    await seedUser({ id: 'vi-viewer-6' });
    await seedUser({ id: 'vi-ok-6' });
    await seedUser({ id: 'vi-blocked-6' });
    await block('vi-viewer-6', 'vi-blocked-6');
    expect(await visibleTo(env.DB, 'vi-viewer-6', 'vi-ok-6')).toBe(true);
    expect(await visibleTo(env.DB, 'vi-viewer-6', 'vi-blocked-6')).toBe(false);
  });
});
