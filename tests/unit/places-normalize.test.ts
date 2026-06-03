import { describe, it, expect } from 'vitest';
import { normalizeFoursquareResult } from '../../worker/services/places';

// The proxy normalizer must tolerate BOTH the new Places API shape and the
// legacy v3 shape — Foursquare renamed fields and moved coordinates, so this is
// the provider-drift guard.
describe('normalizeFoursquareResult', () => {
  it('parses the new Places API shape (fsq_place_id + top-level lat/lng + distance)', () => {
    const r = normalizeFoursquareResult({
      fsq_place_id: 'abc123',
      name: 'Chaipartner',
      latitude: 21.1458,
      longitude: 72.7711,
      distance: 320,
      location: { formatted_address: 'Vesu, Surat', locality: 'Vesu' }
    });
    expect(r).toMatchObject({
      placeId: 'abc123',
      name: 'Chaipartner',
      locality: 'Vesu',
      latitude: 21.1458,
      longitude: 72.7711,
      distanceMeters: 320
    });
  });

  it('parses the legacy v3 shape (fsq_id + geocodes.main)', () => {
    const r = normalizeFoursquareResult({
      fsq_id: 'leg456',
      name: 'Starbucks',
      geocodes: { main: { latitude: 21.17, longitude: 72.83 } },
      location: { address: 'VR Mall', region: 'Surat' }
    });
    expect(r?.placeId).toBe('leg456');
    expect(r?.name).toBe('Starbucks');
    expect(r?.latitude).toBe(21.17);
    expect(r?.longitude).toBe(72.83);
    expect(r?.address).toBe('VR Mall');
    expect(r?.locality).toBe('Surat'); // falls back to region
    expect(r?.distanceMeters).toBeNull(); // no distance + no origin
  });

  it('computes distance from origin when the API omits it', () => {
    const r = normalizeFoursquareResult(
      { fsq_id: 'x', name: 'Cubbon Park', geocodes: { main: { latitude: 21.15, longitude: 72.77 } } },
      { lat: 21.15, lng: 72.77 }
    );
    expect(r?.distanceMeters).toBe(0); // same point → 0m
  });

  it('returns null for entries missing id or name', () => {
    expect(normalizeFoursquareResult({ name: 'No id' })).toBeNull();
    expect(normalizeFoursquareResult({ fsq_id: 'no-name' })).toBeNull();
    expect(normalizeFoursquareResult(null)).toBeNull();
  });
});
