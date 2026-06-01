import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { seedUser } from '../helpers';
import { getDiscoveryMembersV2 } from '../../worker/services/discovery';

// Regression: getDiscoveryMembersV2 builds `IN (${placeholders})` enrichment
// queries (photos / interests / trust_metrics). All of them must `.bind(...)`
// the candidate ids — a missing bind throws "Wrong number of parameter bindings"
// at runtime, which propagates up through getState() and 500s the whole app.
describe('getDiscoveryMembersV2 parameter binding', () => {
  it('does not throw when there are visible candidates (all enrichment queries bound)', async () => {
    const viewer = await seedUser({ id: 'disc-viewer' });
    // A handful of active, completed peers so the recommender yields candidates.
    for (let i = 0; i < 4; i++) {
      const id = `disc-peer-${i}`;
      await seedUser({ id, fullName: `Peer ${i}` });
      await env.DB.prepare(
        'INSERT INTO profile_photos (id, user_id, r2_key, url, content_type, size_bytes, position, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(`ph-${id}`, id, `k/${id}`, `/api/p/${id}`, 'image/png', 10, 0, 1).run();
      await env.DB.prepare('INSERT INTO user_interests (user_id, interest, weight) VALUES (?, ?, ?)')
        .bind(id, 'coffee', 3).run();
    }

    // Must resolve, not reject with a D1 binding error. Returns a map of feeds.
    const feeds = await getDiscoveryMembersV2(env.DB, viewer);
    expect(feeds).toBeTruthy();
    expect(Array.isArray(feeds.highlyCompatible)).toBe(true);
    expect(Array.isArray(feeds.mostReliable)).toBe(true);
    expect(Array.isArray(feeds.verifiedMembers)).toBe(true);
  });
});
