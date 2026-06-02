import { describe, it, expect } from 'vitest';
import { api, seedAuthed } from '../helpers';

// FOURSQUARE_API_KEY is unset in the test env, so the proxy exercises the
// auth + graceful-degradation paths (the live Foursquare call can't run here).
describe('GET /api/places/search', () => {
  it('guest (no session) → 401', async () => {
    const res = await api('/api/places/search?q=coffee');
    expect(res.status).toBe(401);
  });

  it('authed + Foursquare unconfigured → 200 { configured:false, results:[] }', async () => {
    const { cookie } = await seedAuthed({ id: 'places-user-1' });
    const res = await api('/api/places/search?q=coffee', { cookie });
    expect(res.status).toBe(200);
    const body = await res.json<{ configured: boolean; results: unknown[] }>();
    expect(body.configured).toBe(false);
    expect(body.results).toEqual([]);
  });
});
