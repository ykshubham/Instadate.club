import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { api, seedAuthed } from '../helpers';

// Verifies migration 0028 columns exist AND the getState mapping surfaces them,
// so the host form's saved venue (coords/place_id) round-trips to the client.
describe('event venue fields in /api/state', () => {
  it('returns venueName/formattedAddress/lat/lng/placeId for a stored event', async () => {
    const { userId, cookie } = await seedAuthed({ id: 'venue-host-1' });

    await env.DB.prepare(
      `INSERT INTO events (
        id, host_user_id, type, title, description, location, display_date, display_time,
        image, status, capacity, entry_type, approval_type, source,
        venue_name, formatted_address, latitude, longitude, place_id, place_provider
      ) VALUES (?, ?, 'Coffee', 'Sip and Talk', 'desc', 'Chaipartner', 'Fri Jun 06', '6 PM',
        '/x.png', 'Open Plan', 10, 'Free', 'Host Approval', 'hosted',
        ?, ?, ?, ?, ?, 'foursquare')`
    ).bind('evt-venue-1', userId, 'Chaipartner', 'Vesu, Surat', 21.1458, 72.7711, 'fsq-abc').run();

    const res = await api('/api/state', { cookie });
    expect(res.status).toBe(200);
    const body = await res.json<{ state: { hostedEvents: Array<Record<string, any>> } }>();
    const ev = body.state.hostedEvents.find(e => e.id === 'evt-venue-1');

    expect(ev).toBeTruthy();
    expect(ev!.venueName).toBe('Chaipartner');
    expect(ev!.formattedAddress).toBe('Vesu, Surat');
    expect(ev!.latitude).toBeCloseTo(21.1458, 4);
    expect(ev!.longitude).toBeCloseTo(72.7711, 4);
    expect(ev!.placeId).toBe('fsq-abc');
    expect(ev!.placeProvider).toBe('foursquare');
  });
});
