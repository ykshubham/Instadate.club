// worker/dto.ts
// Sanitised DTO system (Sprint 1, DISC-BE-02).
// Guarantees no contact info or precise geo leaks to non-self viewers.

// Fields that must never appear in a member/recommendation DTO shown to others.
export const SENSITIVE_PROFILE_FIELDS = [
  'whatsapp',
  'phone_e164',
  'instagram',          // handle is contact info; verification flag instagram_verified stays
  'email',
  'profile_latitude',
  'profile_longitude',
  'profile_json'
] as const;

/**
 * Strip sensitive keys from a profile-like object before returning it to other users.
 * Preserves all non-sensitive fields (name, age, city, gender, profession, college,
 * bio, vibe, photos, verification_level, *_verified flags, trust, etc.).
 */
export function sanitizeProfile<T extends Record<string, unknown>>(row: T): Partial<T> {
  const out: Record<string, unknown> = { ...row };
  for (const field of SENSITIVE_PROFILE_FIELDS) {
    delete out[field];
  }
  return out as Partial<T>;
}

/** Canonical public shape for a discovery/member card. Built by construction in /api/members. */
export interface PublicMemberDto {
  id: string;
  name: string;
  age: number;
  city: string;
  vibe: string;
  score: string;
  prompt: string;
  answer: string;
  gradient: string;
  avatar: string;
  photos: string[];
  weekendStatus: string;
  currentWeekendStatus: string;
  weekendStatusUpdatedAt: string;
  trustScore: number;
  isVerified: boolean;
  verification_level: string;
  phone_verified: number;
  instagram_verified: number;
  profile_verified: number;
}
