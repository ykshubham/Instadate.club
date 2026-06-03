import { describe, it, expect } from 'vitest';
import { sanitizeProfile, SENSITIVE_PROFILE_FIELDS } from '../../worker/dto';

describe('sanitizeProfile', () => {
  it('removes every field listed in SENSITIVE_PROFILE_FIELDS', () => {
    const row: Record<string, unknown> = {
      id: 'user-1',
      name: 'Asha',
      age: 27,
      city: 'Bengaluru',
      // sensitive:
      whatsapp: '+919876543210',
      phone_e164: '+919876543210',
      instagram: '@asha',
      email: 'asha@example.com',
      profile_latitude: 12.97,
      profile_longitude: 77.59,
      profile_json: '{"secret":true}'
    };

    const out = sanitizeProfile(row);

    for (const field of SENSITIVE_PROFILE_FIELDS) {
      expect(out).not.toHaveProperty(field);
    }
  });

  it('preserves all non-sensitive fields, including verification flags', () => {
    const row = {
      id: 'user-1',
      name: 'Asha',
      age: 27,
      city: 'Bengaluru',
      gender: 'female',
      profession: 'designer',
      college: 'NID',
      bio: 'hi',
      vibe: 'chill',
      verification_level: 'basic',
      instagram_verified: 1,
      phone_verified: 1,
      profile_verified: 0,
      trustScore: 88,
      phone_e164: '+919876543210'
    };

    const out = sanitizeProfile(row);

    expect(out).toMatchObject({
      id: 'user-1',
      name: 'Asha',
      age: 27,
      city: 'Bengaluru',
      gender: 'female',
      profession: 'designer',
      college: 'NID',
      bio: 'hi',
      vibe: 'chill',
      verification_level: 'basic',
      instagram_verified: 1,
      phone_verified: 1,
      profile_verified: 0,
      trustScore: 88
    });
    // the contact handle is removed, but the verification flag is kept
    expect(out).not.toHaveProperty('phone_e164');
    expect(out).toHaveProperty('instagram_verified', 1);
  });

  it('does not mutate the original input object', () => {
    const row = { name: 'Asha', email: 'asha@example.com' };
    sanitizeProfile(row);
    expect(row.email).toBe('asha@example.com');
  });

  it('returns a plain object even when no sensitive fields are present', () => {
    const out = sanitizeProfile({ name: 'Asha', age: 27 });
    expect(out).toEqual({ name: 'Asha', age: 27 });
  });
});
