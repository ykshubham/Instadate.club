export interface Env {
  DB: D1Database;
  PROFILE_IMAGES: R2Bucket;
  ASSETS: Fetcher;
  CHAT_ROOM: DurableObjectNamespace;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  ENVIRONMENT?: string;
  DATABASE_EMPTY?: string | boolean | number;
  ADMIN_USER_IDS?: string;
  // Phone OTP / SMS (Sprint 2 Task 1). Unset => dev console provider (code logged).
  SMS_PROVIDER?: string;            // 'msg91' | 'twilio' | unset(console)
  MSG91_AUTH_KEY?: string;
  MSG91_TEMPLATE_ID?: string;
  MSG91_SENDER?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM?: string;
}

import {
  getOrInitializeTrustMetrics,
  recordMeetupOutcome,
  recomputeTrustMetrics
} from './services/trust';
import {
  getOrInitializePreferences,
  savePreferences,
  getOrGenerateRecommendationsV2,
  runCronMatchmaking
} from './services/recommendations';
import {
  getDiscoveryMembersV2
} from './services/discovery';
import {
  getRecommendedEventsV2
} from './services/events';
import {
  calculateCompatibilityV2
} from './services/compatibility';
import {
  getCoordinatesForCity
} from './services/location';
import {
  logEvent,
  getRecentActivityFeed
} from './services/analytics';
import {
  getFunnelMetrics
} from './services/funnels';
import {
  getDashboardAnalytics
} from './services/dashboard';
import {
  getCohortAnalytics
} from './services/cohorts';
import {
  getCompanyHealthMetrics
} from './services/health';
import {
  seedDatabaseIfEmpty
} from './services/seeder';
import {
  checkRateLimit,
  rateLimitResponse,
  pruneRateLimits
} from './services/ratelimit';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  getCookie,
  sessionCookie,
  clearSessionCookie,
  base64UrlEncode,
  sha256,
  randomToken,
  resolvePrincipal,
  safeRedirect
} from './auth';
import { requireAuthedActive, requirePublished, requireVerified } from './authz';
import { visibleUserIds } from './visibility';
import { sanitizeProfile } from './dto';
import { setAccountStatus, createReport, listReports, resolveReport } from './services/moderation';
import {
  resolveRole,
  isModerator,
  isAdmin,
  recordAudit,
  listAuditLogs,
  listUsersForModeration,
  listEventsForModeration,
  setEventModeration,
  setUserRole
} from './services/admin';
import {
  deactivateAccount,
  requestDeletion,
  reactivateAccount,
  exportAccountData,
  runScheduledPurge
} from './services/account';
import { normalizePhone, startOtp, verifyOtp } from './services/otp';
import { startMagicLink, verifyMagicLink } from './services/magic';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getIncomingRequests,
  getConnections
} from './services/connections';
import { assertCanSend } from './services/chat';
import { getNotifications, createNotification, markNotificationsRead } from './services/notifications';
import { getSettings, updateSettings, verifyAction } from './services/settings';

type AppState = {
  profile: Record<string, unknown>;
  vibeRequests: Record<string, unknown>;
  rsvps: Record<string, unknown>;
  hostedEvents: EventDto[];
  verifiedChats: Record<string, boolean>;
  chatMessages: Record<string, Array<[string, string, string?, string?, string?]>>;
  lastUpdated: string;
  recommendations?: any[];
  discovery?: any;
  recommendedEvents?: any[];
  instantPlans?: any[];
  trustMetrics?: any;
  pendingReviews?: any;
  chats?: any[];
  outcomes?: any[];
  notifications?: any[];
  settings?: any;
};

type EventDto = {
  id: string;
  title: string;
  type: string;
  date: string;
  rawDate: string | null;
  time: string;
  place: string;
  image: string;
  status: string;
  description: string;
  capacity: number;
  entry: string;
  price: string;
  approval: string;
  hostName: string;
  createdAt: string;
  source: string;
  attendeeCount: number;
  category?: string;
  activityType?: string;
  approvalRequired?: boolean;
  genderRatioPreference?: string;
  visibility?: string;
  score?: number;
  explanations?: string[];
};

type UserDto = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  authProvider: string;
  status: string;
  statusReason: string | null;
  statusUntil: string | null;
  role?: string;
  onboardingStep?: number;
  onboardingCompletedAt?: string | null;
};

type ProfileDto = {
  photo: string;
  photos: string[];
  fullName: string;
  age: string;
  instagram: string;
  city: string;
  whatsapp: string;
  gender: string;
  profession: string;
  college: string;
  intent: string;
  weekendStatus: string;
  currentWeekendStatus?: string;
  weekendStatusUpdatedAt?: string;
  bio: string;
  vibe: string;
  plan: string;
  completed: boolean;
  updatedAt: string;
  interests?: Array<{ interest: string; weight: number }>;
  intents?: string[];
  profileLatitude?: number | null;
  profileLongitude?: number | null;
  trustMetrics?: {
    attendanceScore: number;
    noShowCount: number;
    attendedCount: number;
    verificationScore: number;
    isVerified: boolean;
    responseRate: number;
    trustScore: number;
  };
  preferred_gender?: string | null;
  min_age?: number;
  max_age?: number;
  preferred_distance_km?: number;
  phone_verified?: number;
  instagram_verified?: number;
  profile_verified?: number;
  verification_level?: string;
};

// SESSION_COOKIE / SESSION_MAX_AGE_SECONDS now imported from ./auth
const MAX_PROFILE_PHOTOS = 6;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const PROFILE_TEXT_LIMITS: Record<string, number> = {
  fullName: 90,
  age: 2,
  instagram: 60,
  city: 80,
  whatsapp: 20,
  gender: 40,
  profession: 90,
  college: 120,
  intent: 120,
  weekendStatus: 280,
  bio: 900,
  vibe: 120,
  plan: 80
};

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init.headers || {})
    }
  });
}

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

// Session/cookie/crypto helpers and resolvePrincipal moved to ./auth (Sprint 1).

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return await request.json<T>();
  } catch {
    return {} as T;
  }
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function isGoogleConfigured(env: Env) {
  return Boolean(
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET &&
    !env.GOOGLE_CLIENT_ID.startsWith('your-') &&
    !env.GOOGLE_CLIENT_SECRET.startsWith('your-')
  );
}

function userDto(row: Record<string, unknown>): UserDto {
  return {
    id: row.id as string,
    email: (row.email as string) || '',
    fullName: (row.full_name as string) || '',
    avatarUrl: (row.avatar_url as string) || '',
    authProvider: (row.auth_provider as string) || 'google',
    status: (row.status as string) || 'active',
    statusReason: (row.status_reason as string) ?? null,
    statusUntil: (row.status_until as string) ?? null,
    role: (row.role as string) || 'member',
    onboardingStep: row.onboarding_step !== undefined ? Number(row.onboarding_step) : undefined,
    onboardingCompletedAt: (row.onboarding_completed_at as string) ?? null
  };
}

function profileDto(row: Record<string, unknown> | null, photos: Array<Record<string, unknown>> = []): ProfileDto {
  const orderedPhotos = photos
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map(photo => photo.url as string);

  return {
    photo: orderedPhotos[0] || '',
    photos: orderedPhotos,
    fullName: (row?.full_name as string) || '',
    age: (row?.age as string) || '',
    instagram: (row?.instagram as string) || '',
    city: (row?.city as string) || '',
    whatsapp: (row?.whatsapp as string) || '',
    gender: (row?.gender as string) || '',
    profession: (row?.profession as string) || '',
    college: (row?.college as string) || '',
    intent: (row?.intent as string) || '',
    weekendStatus: (row?.weekend_status as string) || '',
    currentWeekendStatus: (() => {
      const status = ((row?.weekend_status as string) || '').toLowerCase();
      if (status.includes('movie') || status.includes('film')) return 'Movie';
      if (status.includes('coffee') || status.includes('cafe') || status.includes('tea')) return 'Coffee';
      if (status.includes('walk') || status.includes('trek') || status.includes('travel')) return 'Walk';
      if (status.includes('pickleball') || status.includes('play') || status.includes('court')) return 'Pickleball';
      // Fallback based on vibe
      const vibe = ((row?.vibe as string) || '').toLowerCase();
      if (vibe.includes('cafe')) return 'Coffee';
      if (vibe.includes('travel') || vibe.includes('art')) return 'Walk';
      if (vibe.includes('concert')) return 'Movie';
      return 'Coffee';
    })(),
    weekendStatusUpdatedAt: (row?.updated_at as string) || new Date().toISOString(),
    bio: (row?.bio as string) || '',
    vibe: (row?.vibe as string) || '',
    plan: (row?.plan as string) || 'Instadate Plus',
    completed: Boolean(row?.completed),
    profileLatitude: row?.profile_latitude !== null && row?.profile_latitude !== undefined ? Number(row.profile_latitude) : null,
    profileLongitude: row?.profile_longitude !== null && row?.profile_longitude !== undefined ? Number(row.profile_longitude) : null,
    phone_verified: Number(row?.phone_verified ?? 0),
    instagram_verified: Number(row?.instagram_verified ?? 0),
    profile_verified: Number(row?.profile_verified ?? 0),
    verification_level: (row?.verification_level as string) || 'none',
    updatedAt: (row?.updated_at as string) || new Date().toISOString()
  };
}

async function ensureUser(db: D1Database, userId: string) {
  const existing = await db.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
  if (existing) {
    await ensureProfile(db, userId);
    return;
  }

  await db.prepare(
    `INSERT INTO users (id, email, full_name, auth_provider, completed, profile_json)
     VALUES (?, ?, ?, 'system', 0, '{}')`
  ).bind(userId, `${userId}@instadate.local`, '').run();
  await ensureProfile(db, userId);
  await logEvent(db, { user_id: userId, event_name: 'user_registered', metadata: { provider: 'system' } });
}

async function ensureProfile(db: D1Database, userId: string) {
  const existing = await db.prepare('SELECT user_id FROM profiles WHERE user_id = ?').bind(userId).first();
  if (existing) return;

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<Record<string, unknown>>();
  const userProfileJson = parseJson<Record<string, unknown>>(user?.profile_json as string, {});
  const cityCoords = getCoordinatesForCity(user?.city as string);

  await db.prepare(
    `INSERT INTO profiles (
      user_id, full_name, age, instagram, city, whatsapp, gender, profession, college,
      intent, weekend_status, bio, vibe, plan, completed, profile_latitude, profile_longitude
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    userId,
    user?.full_name || '',
    user?.age || '',
    user?.instagram || '',
    user?.city || '',
    user?.whatsapp || '',
    user?.gender || '',
    userProfileJson.profession || '',
    userProfileJson.college || '',
    user?.intent || '',
    user?.weekend_status || '',
    user?.bio || '',
    user?.vibe || '',
    userProfileJson.plan || 'Instadate Plus',
    user?.completed ? 1 : 0,
    cityCoords ? cityCoords.lat : null,
    cityCoords ? cityCoords.lon : null
  ).run();
}

async function getTrustMetrics(db: D1Database, userId: string) {
  let metrics = await db.prepare('SELECT * FROM trust_metrics WHERE user_id = ?').bind(userId).first<Record<string, unknown>>();
  if (!metrics) {
    // Initialize default trust metrics
    await db.prepare(`
      INSERT INTO trust_metrics (user_id, attendance_score, no_show_count, attended_count, verification_score, is_verified, response_rate, trust_score)
      VALUES (?, 100.0, 0, 0, 0.0, 0, 100.0, 75.0)
    `).bind(userId).run();
    metrics = await db.prepare('SELECT * FROM trust_metrics WHERE user_id = ?').bind(userId).first<Record<string, unknown>>();
  }
  return {
    attendanceScore: Number(metrics?.attendance_score ?? 100.0),
    noShowCount: Number(metrics?.no_show_count ?? 0),
    attendedCount: Number(metrics?.attended_count ?? 0),
    verificationScore: Number(metrics?.verification_score ?? 0.0),
    isVerified: Boolean(metrics?.is_verified ?? 0),
    responseRate: Number(metrics?.response_rate ?? 100.0),
    trustScore: Number(metrics?.trust_score ?? 75.0)
  };
}

async function getProfile(db: D1Database, userId: string): Promise<ProfileDto> {
  await ensureProfile(db, userId);
  const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(userId).first<Record<string, unknown>>();
  const { results: photos } = await db.prepare(
    'SELECT id, url, position, is_primary FROM profile_photos WHERE user_id = ? ORDER BY position ASC, created_at ASC'
  ).bind(userId).all<Record<string, unknown>>();

  const { results: interests } = await db.prepare(
    'SELECT interest, weight FROM user_interests WHERE user_id = ?'
  ).bind(userId).all<Record<string, unknown>>();

  const { results: intents } = await db.prepare(
    'SELECT intent FROM user_intents WHERE user_id = ?'
  ).bind(userId).all<Record<string, unknown>>();

  const trustMetrics = await getTrustMetrics(db, userId);
  const preferences = await getOrInitializePreferences(db, userId);

  return {
    ...profileDto(profile, photos),
    interests: interests.map(i => ({ interest: i.interest as string, weight: Number(i.weight) })),
    intents: intents.map(i => i.intent as string),
    trustMetrics,
    preferred_gender: preferences.preferred_gender,
    min_age: preferences.min_age,
    max_age: preferences.max_age,
    preferred_distance_km: preferences.preferred_distance_km
  };
}

// --- MATCHMAKING & INTENT COMPATIBILITY ENGINE ---
async function calculateCompatibility(db: D1Database, userIdA: string, userIdB: string) {
  return calculateCompatibilityV2(db, userIdA, userIdB);
}

// --- RECOMMENDATION ENGINE ---
async function getOrGenerateRecommendations(db: D1Database, userId: string) {
  return getOrGenerateRecommendationsV2(db, userId);
}

async function getRecommendationsWithProfilesV2(db: D1Database, userId: string) {
  const recs = await getOrGenerateRecommendationsV2(db, userId);
  const visible = await visibleUserIds(db, userId, recs.map(r => r.recommended_user_id));
  const results: any[] = [];

  for (const r of recs) {
    if (!visible.has(r.recommended_user_id)) continue;
    const profile = await getProfile(db, r.recommended_user_id);
    const user = await db.prepare('SELECT avatar_url FROM users WHERE id = ?').bind(r.recommended_user_id).first<Record<string, unknown>>();

    results.push({
      id: r.recommended_user_id,
      score: r.score,
      explanation: parseJson<string[]>(r.explanation, []),
      profile: sanitizeProfile({
        ...profile,
        avatarUrl: user?.avatar_url || ''
      })
    });
  }
  return results;
}

// --- MEMBER DISCOVERY ---
async function getDiscoveryMembers(db: D1Database, userId: string) {
  return getDiscoveryMembersV2(db, userId);
}

// --- EVENT RECOMMENDATION ENGINE ---
async function getRecommendedEvents(db: D1Database, userId: string) {
  return getRecommendedEventsV2(db, userId);
}


// --- INSTANT PLANS ---
async function createInstantPlan(db: D1Database, userId: string, plan: Record<string, any>) {
  const planId = id('plan');
  await db.prepare(`
    INSERT INTO instant_plans (id, creator_user_id, title, activity, time, location, capacity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    planId,
    userId,
    plan.title || 'Untitled Plan',
    plan.activity || 'Coffee Meetup',
    plan.time || 'Tonight',
    plan.location || 'Cafe',
    Number(plan.capacity || 5)
  ).run();

  await db.prepare(`
    INSERT INTO instant_plan_members (plan_id, user_id) VALUES (?, ?)
  `).bind(planId, userId).run();

  return planId;
}

async function joinInstantPlan(db: D1Database, userId: string, planId: string) {
  const plan = await db.prepare('SELECT capacity FROM instant_plans WHERE id = ?').bind(planId).first<{ capacity: number }>();
  if (!plan) return { error: 'Plan not found', status: 404 };

  const countRow = await db.prepare(
    'SELECT COUNT(*) AS count FROM instant_plan_members WHERE plan_id = ?'
  ).bind(planId).first<{ count: number }>();

  if (Number(countRow?.count || 0) >= plan.capacity) {
    return { error: 'Plan capacity reached', status: 409 };
  }

  await db.prepare(`
    INSERT OR IGNORE INTO instant_plan_members (plan_id, user_id) VALUES (?, ?)
  `).bind(planId, userId).run();

  return null;
}

async function leaveInstantPlan(db: D1Database, userId: string, planId: string) {
  await db.prepare(`
    DELETE FROM instant_plan_members WHERE plan_id = ? AND user_id = ?
  `).bind(planId, userId).run();
}

async function getInstantPlans(db: D1Database, userId: string) {
  const myProfile = await getProfile(db, userId);
  const myInterests = myProfile.interests || [];

  const { results: plans } = await db.prepare(`
    SELECT ip.*, u.full_name AS creator_name, u.avatar_url AS creator_avatar,
      COUNT(ipm.user_id) AS attendee_count
    FROM instant_plans ip
    JOIN users u ON u.id = ip.creator_user_id
    LEFT JOIN instant_plan_members ipm ON ipm.plan_id = ip.id
    GROUP BY ip.id
    ORDER BY ip.created_at DESC
  `).all<Record<string, unknown>>();

  const plansList: any[] = [];

  for (const row of plans) {
    const activity = (row.activity as string || '').toLowerCase();
    const title = (row.title as string || '').toLowerCase();
    
    let score = 0;
    const explanations: string[] = [];

    let interestBoost = 0;
    for (const item of myInterests) {
      const term = item.interest.toLowerCase();
      if (activity.includes(term) || title.includes(term)) {
        interestBoost = Math.max(interestBoost, item.weight * 20);
      }
    }

    if (interestBoost > 0) {
      score = interestBoost;
      explanations.push('Matches your active interests');
    } else {
      score = 30;
    }

    const planId = row.id as string;
    const { results: members } = await db.prepare(`
      SELECT u.id, u.full_name, u.avatar_url 
      FROM instant_plan_members ipm
      JOIN users u ON u.id = ipm.user_id
      WHERE ipm.plan_id = ?
    `).bind(planId).all<{ id: string; full_name: string; avatar_url: string }>();

    const creatorTrust = await db.prepare('SELECT trust_score, is_verified FROM trust_metrics WHERE user_id = ?').bind(row.creator_user_id).first<{ trust_score: number; is_verified: number }>();
    const creatorProfile = await db.prepare('SELECT verification_level FROM profiles WHERE user_id = ?').bind(row.creator_user_id).first<{ verification_level: string }>();

    plansList.push({
      id: planId,
      creatorId: row.creator_user_id as string,
      creatorName: row.creator_name as string,
      creatorAvatar: row.creator_avatar as string,
      creatorTrustScore: creatorTrust?.trust_score ?? 94,
      creatorVerificationLevel: creatorProfile?.verification_level ?? 'none',
      creatorIsVerified: creatorTrust?.is_verified ?? 0,
      title: row.title as string,
      activity: row.activity as string,
      time: row.time as string,
      location: row.location as string,
      capacity: Number(row.capacity),
      attendeeCount: Number(row.attendee_count || 0),
      members: members.map(m => ({ id: m.id, fullName: m.full_name, avatarUrl: m.avatar_url })),
      score,
      explanations
    });
  }

  return plansList.sort((a, b) => b.score - a.score);
}

// --- TRUST SCORES, BLOCKS & REJECTIONS ---
async function blockUser(db: D1Database, userId: string, targetId: string) {
  if (!targetId || targetId === userId) return;
  await db.prepare(
    'INSERT OR IGNORE INTO user_blocks (user_id, blocked_user_id) VALUES (?, ?)'
  ).bind(userId, targetId).run();
  // Void any pending connection requests in either direction.
  await db.prepare(
    `UPDATE connection_requests SET status = 'rejected'
      WHERE status = 'pending'
        AND ((from_user_id = ?1 AND to_user_id = ?2) OR (from_user_id = ?2 AND to_user_id = ?1))`
  ).bind(userId, targetId).run();
  // Unmatch any existing connection (canonical a<b) so the chat freezes.
  const x = userId < targetId ? userId : targetId;
  const y = userId < targetId ? targetId : userId;
  await db.prepare(
    "UPDATE connections SET status = 'unmatched' WHERE user_a_id = ? AND user_b_id = ?"
  ).bind(x, y).run();
}

async function rejectUser(db: D1Database, userId: string, targetId: string) {
  await db.prepare(
    'INSERT OR IGNORE INTO user_rejections (user_id, rejected_user_id) VALUES (?, ?)'
  ).bind(userId, targetId).run();
}

async function ensureDefaultChats(db: D1Database, userId: string) {
  const defaults = [
    {
      slug: 'ishaan-verma',
      messages: [
        ['match', 'Hey, I recorded a quick intro. Listen first?'],
        ['system', 'Voice verification is required before free texting.'],
        ['you', 'Perfect. I will verify mine too.']
      ]
    },
    {
      slug: 'kabir-kapoor',
      messages: [
        ['match', 'I know a quiet jazz cafe near GK.'],
        ['you', 'That sounds very on-brand.'],
        ['match', 'Friday after 7?']
      ]
    },
    {
      slug: 'aarav-mehta',
      messages: [
        ['match', 'Cubbon early morning has the best light.'],
        ['you', 'I am listening. Send the route.'],
        ['match', 'Only if coffee is part of the route.']
      ]
    }
  ];

  for (const chat of defaults) {
    const existing = await db.prepare('SELECT id FROM chats WHERE slug = ?').bind(chat.slug).first<{ id: string }>();
    const chatId = existing?.id || `chat-${chat.slug}`;

    if (!existing) {
      await db.prepare('INSERT INTO chats (id, slug, participant_a_user_id) VALUES (?, ?, ?)').bind(chatId, chat.slug, userId).run();
      for (const [index, message] of chat.messages.entries()) {
        await db.prepare(
          'INSERT INTO chat_messages (id, chat_id, sender_role, body, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(`msg-${chat.slug}-${index}`, chatId, message[0], message[1], new Date(Date.now() + index).toISOString()).run();
      }
    }
  }
}

async function getState(db: D1Database, userId: string): Promise<AppState> {
  await ensureUser(db, userId);
  // Beta: no fake demo chats injected into real users' inboxes.
  const profile = await getProfile(db, userId);

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<Record<string, unknown>>();
  const { results: events } = await db.prepare(
    `SELECT e.*, u.full_name AS host_name,
      COUNT(CASE WHEN ea.status = 'joined' THEN 1 END) AS attendee_count
     FROM events e
     LEFT JOIN users u ON u.id = e.host_user_id
     LEFT JOIN event_attendees ea ON ea.event_id = e.id
     WHERE e.deleted_at IS NULL AND e.moderation_status = 'active'
     GROUP BY e.id
     ORDER BY e.created_at DESC`
  ).all<Record<string, unknown>>();

  const enrichedHostedEvents: any[] = [];
  for (const row of events) {
    const eventId = row.id as string;
    const hostUserId = row.host_user_id as string;

    // 1. Fetch Event Quality Metrics
    const feedback = await db.prepare(`
      SELECT 
        AVG(rating) as avg_rating,
        AVG(host_rating) as avg_host_rating,
        AVG(would_attend_again) as avg_would_attend
      FROM event_feedback
      WHERE event_id = ?
    `).bind(eventId).first<{ avg_rating: number | null; avg_host_rating: number | null; avg_would_attend: number | null }>();

    const rsvpsRow = await db.prepare("SELECT COUNT(*) as count FROM event_attendees WHERE event_id = ? AND status = 'joined'").bind(eventId).first<{ count: number }>();
    const noShowsRow = await db.prepare("SELECT COUNT(*) as count FROM no_show_logs WHERE event_id = ?").bind(eventId).first<{ count: number }>();
    
    const rsvps = rsvpsRow?.count ?? 0;
    const noShows = noShowsRow?.count ?? 0;
    const attendance = Math.max(0, rsvps - noShows);
    const attendanceRate = rsvps > 0 ? (attendance / rsvps) * 100 : 100.0;

    const eventRating = feedback?.avg_rating ?? 5.0;
    const hostRating = feedback?.avg_host_rating ?? 5.0;
    const wouldAttendAgainPct = (feedback?.avg_would_attend ?? 1.0) * 100;

    // Weight: Attendance Rate = 30%, Event Rating = 30%, Would Attend Again = 20%, Host Rating = 20%
    const qualityScore = Math.round(
      0.30 * attendanceRate +
      0.30 * (eventRating / 5 * 100) +
      0.20 * wouldAttendAgainPct +
      0.20 * (hostRating / 5 * 100)
    );

    // 2. Fetch Host Reliability Score
    let hostReliabilityScore = 100;
    if (hostUserId) {
      const hostFeedbackRow = await db.prepare(`
        SELECT AVG(host_rating) as avg_rating 
        FROM event_feedback ef
        JOIN events e ON ef.event_id = e.id
        WHERE e.host_user_id = ?
      `).bind(hostUserId).first<{ avg_rating: number | null }>();
      const avgHostRating = hostFeedbackRow?.avg_rating ?? 5.0;

      const hostRsvpsRow = await db.prepare(`
        SELECT COUNT(*) as count FROM event_attendees ea 
        JOIN events e ON ea.event_id = e.id 
        WHERE e.host_user_id = ? AND ea.status = 'joined'
      `).bind(hostUserId).first<{ count: number }>();
      const hostRsvps = hostRsvpsRow?.count ?? 0;

      const hostNoShowsRow = await db.prepare(`
        SELECT COUNT(*) as count FROM no_show_logs ns 
        JOIN events e ON ns.event_id = e.id 
        WHERE e.host_user_id = ?
      `).bind(hostUserId).first<{ count: number }>();
      const hostNoShows = hostNoShowsRow?.count ?? 0;

      const hostAttendance = Math.max(0, hostRsvps - hostNoShows);
      const hostAttendanceRate = hostRsvps > 0 ? (hostAttendance / hostRsvps) * 100 : 100.0;

      const hostTotalEventsRow = await db.prepare("SELECT COUNT(*) as count FROM events WHERE host_user_id = ?").bind(hostUserId).first<{ count: number }>();
      const hostTotalEvents = hostTotalEventsRow?.count ?? 0;
      
      const hostCancelledEventsRow = await db.prepare("SELECT COUNT(*) as count FROM events WHERE host_user_id = ? AND deleted_at IS NOT NULL").bind(hostUserId).first<{ count: number }>();
      const hostCancelledEvents = hostCancelledEventsRow?.count ?? 0;

      const hostCancellationRate = hostTotalEvents > 0 ? (hostCancelledEvents / hostTotalEvents) * 100 : 0.0;
      const hostCompletionRate = 100 - hostCancellationRate;

      hostReliabilityScore = Math.round(
        0.40 * (avgHostRating / 5 * 100) +
        0.40 * hostAttendanceRate +
        0.20 * hostCompletionRate
      );
    }

    enrichedHostedEvents.push({
      id: eventId,
      title: row.title as string,
      type: row.type as string,
      date: row.display_date as string,
      rawDate: (row.raw_date as string) || null,
      time: row.display_time as string,
      place: row.location as string,
      image: row.image as string,
      status: row.status as string,
      description: row.description as string,
      capacity: Number(row.capacity),
      entry: row.entry_type as string,
      price: (row.price as string) || '',
      approval: row.approval_type as string,
      hostName: (row.host_name as string) || 'Club host',
      hostUserId,
      createdAt: row.created_at as string,
      source: row.source as string,
      attendeeCount: Number(row.attendee_count || 0),
      qualityScore,
      rating: Math.round(eventRating * 10) / 10,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      wouldAttendAgainPct: Math.round(wouldAttendAgainPct * 10) / 10,
      hostRating: Math.round(hostRating * 10) / 10,
      hostReliabilityScore
    });
  }

  const hostedEvents = enrichedHostedEvents;

  const { results: attendeeRows } = await db.prepare(
    `SELECT e.id, e.title, e.display_date, e.location, ea.joined_at
     FROM event_attendees ea
     JOIN events e ON e.id = ea.event_id
     WHERE ea.user_id = ? AND ea.status = 'joined' AND e.deleted_at IS NULL`
  ).bind(userId).all<Record<string, unknown>>();

  const rsvps = Object.fromEntries(attendeeRows.map(row => [
    row.id as string,
    {
      eventId: row.id,
      title: row.title,
      date: row.display_date,
      place: row.location,
      savedAt: row.joined_at
    }
  ]));

  const { results: matchRows } = await db.prepare(
    'SELECT * FROM matches WHERE requester_user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all<Record<string, unknown>>();

  const vibeRequests = Object.fromEntries(matchRows.map(row => [
    row.target_member_id as string,
    {
      memberId: row.target_member_id,
      memberName: row.target_member_name,
      note: row.note || '',
      sentAt: row.created_at
    }
  ]));

  const { results: chatRows } = await db.prepare(`
    SELECT c.*,
           CASE
             WHEN c.participant_a_user_id = ? THEN COALESCE(ub.full_name, REPLACE(REPLACE(c.slug, '-', ' '), 'seeded chat ', ''))
             ELSE COALESCE(ua.full_name, REPLACE(REPLACE(c.slug, '-', ' '), 'seeded chat ', ''))
           END as name,
           CASE
             WHEN c.participant_a_user_id = ? THEN ub.id
             ELSE ua.id
           END as other_user_id,
           CASE
             WHEN c.participant_a_user_id = ? THEN ub.last_active_at
             ELSE ua.last_active_at
           END as last_active_at
    FROM chats c
    LEFT JOIN users ua ON c.participant_a_user_id = ua.id
    LEFT JOIN users ub ON c.participant_b_user_id = ub.id
    ORDER BY c.created_at ASC
  `).bind(userId, userId, userId).all<Record<string, unknown>>();
  const chatMessages: Record<string, Array<[string, string, string?, string?, string?]>> = {};
  const verifiedChats: Record<string, boolean> = {};

  for (const chat of chatRows) {
    const { results: messages } = await db.prepare(`
      SELECT cm.sender_user_id, cm.sender_role, cm.body, cm.id as message_id, cm.attachment_url,
             (SELECT 1 FROM message_reads mr WHERE mr.message_id = cm.id AND mr.user_id = ?1) as is_read_by_peer
      FROM chat_messages cm
      WHERE cm.chat_id = ?2
      ORDER BY cm.created_at ASC
    `).bind(chat.other_user_id, chat.id).all<Record<string, unknown>>();

    chatMessages[chat.slug as string] = messages.map(message => {
      let role = message.sender_role as string;
      if (message.sender_user_id) {
        role = message.sender_user_id === userId ? 'you' : 'match';
      }
      const status = message.is_read_by_peer ? 'read' : 'sent';
      const msgId = message.message_id as string || '';
      const attachmentUrl = message.attachment_url as string || '';
      return [role, message.body as string, status, msgId, attachmentUrl];
    });
    verifiedChats[chat.slug as string] = parseJson<string[]>(chat.verified_by_user_ids_json as string, []).includes(userId);
  }

  // 3. Find pending meetup reviews
  const pendingMeetups = (await db.prepare(`
    SELECT mo.id as matchOutcomeId, mo.user_id_a, mo.user_id_b, mo.updated_at,
           u.full_name as targetName, u.id as targetUserId
    FROM match_outcomes mo
    JOIN users u ON u.id = CASE WHEN mo.user_id_a = ? THEN mo.user_id_b ELSE mo.user_id_a END
    WHERE (mo.user_id_a = ? OR mo.user_id_b = ?) 
      AND mo.status = 'meetup_planned'
      AND mo.id NOT IN (
        SELECT COALESCE(meetup_id, '') FROM meetup_feedback WHERE user_id = ?
      )
  `).bind(userId, userId, userId, userId).all<any>()).results;

  // 4. Find pending event reviews
  const pendingEvents = (await db.prepare(`
    SELECT ea.event_id as id, e.title, e.display_date as date, e.location as place, e.image
    FROM event_attendees ea
    JOIN events e ON ea.event_id = e.id
    WHERE ea.user_id = ? AND ea.status = 'joined' AND e.deleted_at IS NULL
      AND ea.event_id NOT IN (
        SELECT event_id FROM event_feedback WHERE user_id = ?
      )
  `).bind(userId, userId).all<any>()).results;

  const pendingReviews = {
    meetups: pendingMeetups.map(m => ({
      matchOutcomeId: m.matchOutcomeId,
      targetUserId: m.targetUserId,
      name: m.targetName,
      updatedAt: m.updated_at
    })),
    events: pendingEvents.map(e => ({
      id: e.id,
      title: e.title,
      date: e.date,
      place: e.place,
      image: e.image
    }))
  };

  const liveChats = chatRows.map(row => {
    const messages = chatMessages[row.slug as string] || [];
    const lastMessage = messages.length > 0 ? messages[messages.length - 1][1] : '';
    return {
      id: row.id,
      slug: row.slug as string,
      name: row.name as string || 'Unknown',
      avatar: ((row.name as string) || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      gradient: 'cyan',
      messages,
      lastActiveAt: row.last_active_at as string || null
    };
  });

  const { results: outingRows } = await db.prepare(`
    SELECT mo.id, mo.status, mo.updated_at,
           u.id AS target_user_id, u.full_name AS target_name, u.avatar_url AS target_avatar,
           p.city AS target_city, p.weekend_status AS target_weekend_status, p.verification_level AS target_verification_level,
           tm.trust_score AS target_trust_score, tm.is_verified AS target_is_verified
    FROM match_outcomes mo
    JOIN users u ON u.id = CASE WHEN mo.user_id_a = ?1 THEN mo.user_id_b ELSE mo.user_id_a END
    JOIN profiles p ON p.user_id = u.id
    LEFT JOIN trust_metrics tm ON tm.user_id = u.id
    WHERE mo.user_id_a = ?1 OR mo.user_id_b = ?1
    ORDER BY mo.updated_at DESC
  `).bind(userId).all<any>();

  const enrichedOutcomes = [];
  for (const row of outingRows) {
    const { results: photos } = await db.prepare(
      'SELECT url FROM profile_photos WHERE user_id = ? ORDER BY position ASC'
    ).bind(row.target_user_id).all<{ url: string }>();
    const photoUrls = photos.map(ph => ph.url);
    
    enrichedOutcomes.push({
      id: row.id,
      status: row.status,
      updatedAt: row.updated_at,
      targetUserId: row.target_user_id,
      targetName: row.target_name,
      targetAvatar: row.target_avatar,
      targetCity: row.target_city,
      targetWeekendStatus: row.target_weekend_status,
      targetVerificationLevel: row.target_verification_level || 'none',
      targetTrustScore: row.target_trust_score || 90,
      targetIsVerified: row.target_is_verified || 0,
      photos: photoUrls.length > 0 ? photoUrls : [row.target_avatar || '']
    });
  }

  return {
    profile: { ...profile, id: userId },
    vibeRequests,
    rsvps,
    hostedEvents,
    verifiedChats,
    chatMessages,
    chats: liveChats,
    outcomes: enrichedOutcomes,
    recommendations: await getRecommendationsWithProfilesV2(db, userId),
    discovery: await getDiscoveryMembersV2(db, userId),
    recommendedEvents: await getRecommendedEventsV2(db, userId),
    instantPlans: await getInstantPlans(db, userId),
    trustMetrics: await getOrInitializeTrustMetrics(db, userId, profile.completed),
    pendingReviews,
    notifications: await getNotifications(db, userId),
    settings: await getSettings(db, userId),
    lastUpdated: new Date().toISOString()
  };
}

async function saveProfile(db: D1Database, userId: string, profile: Record<string, any>) {
  const profileExists = await db.prepare('SELECT completed FROM profiles WHERE user_id = ?').bind(userId).first<{ completed: number }>();
  await ensureProfile(db, userId);
  const prevProfile = await db.prepare('SELECT completed FROM profiles WHERE user_id = ?').bind(userId).first<{ completed: number }>();
  
  const nextProfile = {
    fullName: cleanText(profile.fullName, PROFILE_TEXT_LIMITS.fullName),
    age: cleanText(profile.age, PROFILE_TEXT_LIMITS.age).replace(/\D/g, '').slice(0, 2),
    instagram: cleanText(profile.instagram, PROFILE_TEXT_LIMITS.instagram),
    city: cleanText(profile.city, PROFILE_TEXT_LIMITS.city),
    whatsapp: cleanText(profile.whatsapp, PROFILE_TEXT_LIMITS.whatsapp).replace(/\D/g, '').slice(0, 15),
    gender: cleanText(profile.gender, PROFILE_TEXT_LIMITS.gender),
    profession: cleanText(profile.profession, PROFILE_TEXT_LIMITS.profession),
    college: cleanText(profile.college, PROFILE_TEXT_LIMITS.college),
    intent: cleanText(profile.intent, PROFILE_TEXT_LIMITS.intent),
    weekendStatus: cleanText(profile.weekendStatus, PROFILE_TEXT_LIMITS.weekendStatus),
    bio: cleanText(profile.bio, PROFILE_TEXT_LIMITS.bio),
    vibe: cleanText(profile.vibe, PROFILE_TEXT_LIMITS.vibe),
    plan: cleanText(profile.plan || 'Instadate Plus', PROFILE_TEXT_LIMITS.plan),
    completed: false
  };

  // Dynamically calculate if all mandatory fields are present (ONB-BE-02 / ONB-BE-03)
  const nameOk = typeof nextProfile.fullName === 'string' && nextProfile.fullName.trim().length > 0;
  const ageInt = parseInt(nextProfile.age, 10);
  const ageOk = !isNaN(ageInt) && ageInt >= 18;
  const genderOk = typeof nextProfile.gender === 'string' && nextProfile.gender.trim().length > 0;
  const intentOk = typeof nextProfile.intent === 'string' && nextProfile.intent.trim().length > 0;
  const cityOk = typeof nextProfile.city === 'string' && nextProfile.city.trim().length > 0;

  const photoCountRow = await db.prepare('SELECT COUNT(*) AS count FROM profile_photos WHERE user_id = ?').bind(userId).first<{ count: number }>();
  const hasPhoto = (photoCountRow?.count ?? 0) > 0 || (profile.photos && Array.isArray(profile.photos) && profile.photos.length > 0);

  const allMandatoryPresent = nameOk && ageOk && genderOk && intentOk && cityOk && hasPhoto;
  nextProfile.completed = allMandatoryPresent;

  const cityCoords = getCoordinatesForCity(nextProfile.city);
  const profileLatitude = profile.profileLatitude !== undefined ? (profile.profileLatitude !== null ? Number(profile.profileLatitude) : null) : (cityCoords ? cityCoords.lat : null);
  const profileLongitude = profile.profileLongitude !== undefined ? (profile.profileLongitude !== null ? Number(profile.profileLongitude) : null) : (cityCoords ? cityCoords.lon : null);

  const phoneVerified = profile.phone_verified !== undefined ? (profile.phone_verified !== null ? Number(profile.phone_verified) : null) : null;
  const instagramVerified = profile.instagram_verified !== undefined ? (profile.instagram_verified !== null ? Number(profile.instagram_verified) : null) : null;
  const profileVerified = profile.profile_verified !== undefined ? (profile.profile_verified !== null ? Number(profile.profile_verified) : null) : null;
  const verificationLevel = profile.verification_level !== undefined ? (profile.verification_level !== null ? String(profile.verification_level) : null) : null;

  await db.prepare(
    `UPDATE profiles SET
      full_name = ?, age = ?, instagram = ?, city = ?, whatsapp = ?, gender = ?, profession = ?,
      college = ?, intent = ?, weekend_status = ?, bio = ?, vibe = ?, plan = ?, completed = ?,
      profile_latitude = ?, profile_longitude = ?,
      phone_verified = COALESCE(?, phone_verified),
      instagram_verified = COALESCE(?, instagram_verified),
      profile_verified = COALESCE(?, profile_verified),
      verification_level = COALESCE(?, verification_level),
      updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(
    nextProfile.fullName,
    nextProfile.age,
    nextProfile.instagram,
    nextProfile.city,
    nextProfile.whatsapp,
    nextProfile.gender,
    nextProfile.profession,
    nextProfile.college,
    nextProfile.intent,
    nextProfile.weekendStatus,
    nextProfile.bio,
    nextProfile.vibe,
    nextProfile.plan,
    nextProfile.completed ? 1 : 0,
    profileLatitude,
    profileLongitude,
    phoneVerified,
    instagramVerified,
    profileVerified,
    verificationLevel,
    userId
  ).run();

  await db.prepare(
    `UPDATE users SET full_name = COALESCE(NULLIF(?, ''), full_name), completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(nextProfile.fullName, nextProfile.completed ? 1 : 0, userId).run();

  if (profile.onboarding_step !== undefined) {
    await db.prepare('UPDATE users SET onboarding_step = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(Number(profile.onboarding_step), userId).run();
  }

  if (profile.interests && Array.isArray(profile.interests)) {
    await db.prepare('DELETE FROM user_interests WHERE user_id = ?').bind(userId).run();
    for (const item of profile.interests) {
      if (typeof item === 'object' && item !== null && 'interest' in item && 'weight' in item) {
        await db.prepare(
          'INSERT INTO user_interests (user_id, interest, weight) VALUES (?, ?, ?)'
        ).bind(userId, item.interest, Number(item.weight)).run();
      }
    }
  }

  if (profile.intents && Array.isArray(profile.intents)) {
    await db.prepare('DELETE FROM user_intents WHERE user_id = ?').bind(userId).run();
    for (const intentVal of profile.intents) {
      if (typeof intentVal === 'string') {
        await db.prepare('INSERT INTO user_intents (user_id, intent) VALUES (?, ?)').bind(userId, intentVal).run();
      }
    }
  }

  if (
    profile.preferred_gender !== undefined ||
    profile.min_age !== undefined ||
    profile.max_age !== undefined ||
    profile.preferred_distance_km !== undefined
  ) {
    await savePreferences(db, userId, {
      preferred_gender: profile.preferred_gender,
      min_age: profile.min_age !== undefined ? Number(profile.min_age) : undefined,
      max_age: profile.max_age !== undefined ? Number(profile.max_age) : undefined,
      preferred_distance_km: profile.preferred_distance_km !== undefined ? Number(profile.preferred_distance_km) : undefined
    });
  }

  const isFirstTime = !profileExists;
  const isCompleting = nextProfile.completed && (!prevProfile || prevProfile.completed === 0);

  if (isFirstTime) {
    await logEvent(db, { user_id: userId, event_name: 'profile_started' });
  }
  if (isCompleting) {
    await db.prepare(
      "UPDATE users SET onboarding_completed_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(userId).run();
    await logEvent(db, { user_id: userId, event_name: 'profile_completed' });
  }
  await logEvent(db, { user_id: userId, event_name: 'profile_updated' });
}

async function createEvent(db: D1Database, userId: string, event: Record<string, any>) {
  await ensureUser(db, userId);
  const eventId = (event.id as string) || id('event');

  await db.prepare(
    `INSERT INTO events (
      id, host_user_id, type, title, description, location, display_date, raw_date, display_time,
      image, status, capacity, entry_type, price, approval_type, source,
      category, activity_type, approval_required, gender_ratio_preference, visibility
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    eventId,
    userId,
    event.type || 'Host Party Plan',
    event.title || 'Untitled plan',
    event.description || '',
    event.place || event.location || '',
    event.date || 'Tonight',
    event.rawDate || null,
    event.time || 'Tonight',
    event.image || '/assets/social_mixer.png',
    event.status || 'Join Tonight',
    Number(event.capacity || 10),
    event.entry || 'Free',
    event.price || '',
    event.approval || 'Host Approval',
    event.source || 'hosted',
    event.category || 'Social',
    event.activityType || 'Social Outing',
    event.approvalRequired ? 1 : 0,
    event.genderRatioPreference || 'None',
    event.visibility || 'Public'
  ).run();

  return eventId;
}

async function joinEvent(db: D1Database, userId: string, eventId: string) {
  await ensureUser(db, userId);
  const event = await db.prepare('SELECT capacity, is_closed, host_user_id, title FROM events WHERE id = ? AND deleted_at IS NULL').bind(eventId).first<{ capacity: number; is_closed: number; host_user_id: string; title: string }>();
  if (!event) return json({ error: 'Event not found' }, { status: 404 });
  if (event.is_closed) return json({ error: 'Event is closed' }, { status: 409 });

  const countRow = await db.prepare(
    "SELECT COUNT(*) AS count FROM event_attendees WHERE event_id = ? AND status = 'joined'"
  ).bind(eventId).first<{ count: number }>();
  if (Number(countRow?.count || 0) >= Number(event.capacity)) {
    return json({ error: 'Event capacity reached' }, { status: 409 });
  }

  await db.prepare(
    `INSERT INTO event_attendees (event_id, user_id, status)
     VALUES (?, ?, 'joined')
     ON CONFLICT(event_id, user_id) DO UPDATE SET status = 'joined', updated_at = CURRENT_TIMESTAMP`
  ).bind(eventId, userId).run();

  // Trigger event RSVP notification to the host
  if (event.host_user_id && event.host_user_id !== userId) {
    const attendeeProfile = await db.prepare('SELECT full_name FROM profiles WHERE user_id = ?').bind(userId).first<{ full_name: string }>();
    const attendeeName = attendeeProfile?.full_name || 'Someone';
    await createNotification(db, event.host_user_id, 'event_rsvp', {
      message: `${attendeeName} RSVPed to your event "${event.title}".`,
      senderId: userId,
      senderName: attendeeName,
      eventId: eventId,
      eventTitle: event.title
    });
  }

  return null;
}

async function createGoogleAuthUrl(request: Request, env: Env) {
  if (!isGoogleConfigured(env)) {
    return { error: json({ error: 'Google login is not configured' }, { status: 503 }) };
  }

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/profile';
  const state = randomToken('state-');
  const codeVerifier = randomToken();
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

  await env.DB.prepare(
    'INSERT INTO oauth_states (state, code_verifier, redirect_to, expires_at) VALUES (?, ?, ?, datetime(CURRENT_TIMESTAMP, ?))'
  ).bind(state, codeVerifier, redirectTo, '+10 minutes').run();

  const callbackUrl = `${url.origin}/api/auth/google/callback`;
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('prompt', 'select_account');

  return { authUrl: authUrl.toString() };
}

async function startGoogleLogin(request: Request, env: Env) {
  if (!isGoogleConfigured(env)) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo') || '/profile';
    let mockUserId = 'seeded_user_1';
    const userExists = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(mockUserId).first();
    if (!userExists) {
      const anyUser = await env.DB.prepare('SELECT id FROM users LIMIT 1').first<{ id: string }>();
      if (anyUser) {
        mockUserId = anyUser.id;
      } else {
        mockUserId = 'dev_mock_user';
        await env.DB.prepare(`
          INSERT INTO users (id, email, full_name, age, completed, auth_provider)
          VALUES (?, 'developer@instadate.club', 'Dev Local', '25', 1, 'google')
        `).bind(mockUserId).run();
      }
    }
    return createSessionResponse(request, env, mockUserId, redirectTo);
  }

  const result = await createGoogleAuthUrl(request, env);
  if (result.error) return result.error;
  return Response.redirect(result.authUrl, 302);
}

async function googleLoginUrl(request: Request, env: Env) {
  if (!isGoogleConfigured(env)) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get('redirectTo') || '/profile';
    return json({ url: `/api/auth/google/start?redirectTo=${encodeURIComponent(redirectTo)}` });
  }

  const result = await createGoogleAuthUrl(request, env);
  if (result.error) return result.error;
  return json({ url: result.authUrl });
}

async function upsertGoogleUser(db: D1Database, googleProfile: {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}) {
  if (!googleProfile.sub) throw new Error('Google profile is missing sub');
  if (!googleProfile.email || !googleProfile.email_verified) throw new Error('Google email must be verified');

  const existing = await db.prepare(
    'SELECT id FROM users WHERE google_sub = ? OR email = ?'
  ).bind(googleProfile.sub, googleProfile.email).first<{ id: string }>();
  const userId = existing?.id || id('user');

  if (existing) {
    await db.prepare(
      `UPDATE users SET google_sub = ?, email = ?, full_name = COALESCE(NULLIF(full_name, ''), ?),
        avatar_url = ?, email_verified = ?, auth_provider = 'google', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      googleProfile.sub,
      googleProfile.email,
      googleProfile.name || googleProfile.email,
      googleProfile.picture || '',
      1,
      userId
    ).run();
  } else {
    await db.prepare(
      `INSERT INTO users (id, email, google_sub, full_name, avatar_url, email_verified, auth_provider, completed, profile_json)
       VALUES (?, ?, ?, ?, ?, 1, 'google', 0, '{}')`
    ).bind(
      userId,
      googleProfile.email,
      googleProfile.sub,
      googleProfile.name || googleProfile.email,
      googleProfile.picture || ''
    ).run();
  }

  if (!existing) {
    await logEvent(db, { user_id: userId, event_name: 'user_registered', metadata: { provider: 'google' } });
  }

  await ensureProfile(db, userId);
  return userId;
}

async function createSessionResponse(request: Request, env: Env, userId: string, redirectTo = '/profile') {
  const sessionId = randomToken('sess-');
  await env.DB.prepare(
    'INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, datetime(CURRENT_TIMESTAMP, ?))'
  ).bind(sessionId, userId, '+30 days').run();

  return new Response(null, {
    status: 302,
    headers: {
      location: safeRedirect(redirectTo),
      'set-cookie': sessionCookie(request, sessionId)
    }
  });
}

async function verifyGoogleIdToken(env: Env, idToken: string) {
  if (!env.GOOGLE_CLIENT_ID) throw new Error('Google login is not configured');
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) throw new Error('Invalid Google token');
  const payload = await response.json<Record<string, string>>();

  if (payload.aud !== env.GOOGLE_CLIENT_ID) throw new Error('Google token audience mismatch');
  if (payload.email_verified !== 'true') throw new Error('Google email must be verified');
  if (!payload.sub || !payload.email) throw new Error('Google token is missing required profile fields');

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: true,
    name: payload.name || payload.email,
    picture: payload.picture || ''
  };
}

async function tokenLogin(request: Request, env: Env) {
  if (!env.GOOGLE_CLIENT_ID) return json({ error: 'Google login is not configured' }, { status: 503 });
  const body = await readJson<{ idToken?: string }>(request);
  if (!body.idToken) return json({ error: 'Google idToken is required' }, { status: 400 });

  try {
    const googleProfile = await verifyGoogleIdToken(env, body.idToken);
    const userId = await upsertGoogleUser(env.DB, googleProfile);
    const sessionId = randomToken('sess-');
    await env.DB.prepare(
      'INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, datetime(CURRENT_TIMESTAMP, ?))'
    ).bind(sessionId, userId, '+30 days').run();

    const user = await env.DB.prepare(
      'SELECT id, email, full_name, avatar_url, auth_provider, status, status_reason, status_until, role FROM users WHERE id = ?'
    ).bind(userId).first<Record<string, unknown>>();

    return json({ user: user ? userDto(user) : null, profile: await getProfile(env.DB, userId) }, {
      headers: { 'set-cookie': sessionCookie(request, sessionId) }
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Google login failed' }, { status: 401 });
  }
}

async function handleGoogleCallback(request: Request, env: Env) {
  if (!isGoogleConfigured(env)) {
    return json({ error: 'Google login is not configured' }, { status: 503 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return json({ error: 'Missing OAuth callback parameters' }, { status: 400 });

  const oauthState = await env.DB.prepare(
    'SELECT * FROM oauth_states WHERE state = ? AND expires_at > CURRENT_TIMESTAMP'
  ).bind(state).first<Record<string, unknown>>();
  if (!oauthState) return json({ error: 'OAuth state expired or invalid' }, { status: 400 });

  await env.DB.prepare('DELETE FROM oauth_states WHERE state = ?').bind(state).run();

  const callbackUrl = `${url.origin}/api/auth/google/callback`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      code,
      code_verifier: oauthState.code_verifier as string,
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl
    })
  });

  if (!tokenResponse.ok) {
    return json({ error: 'Google token exchange failed' }, { status: 401 });
  }

  const tokens = await tokenResponse.json<{ access_token?: string }>();
  if (!tokens.access_token) return json({ error: 'Missing Google access token' }, { status: 401 });

  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${tokens.access_token}` }
  });
  if (!profileResponse.ok) return json({ error: 'Google profile fetch failed' }, { status: 401 });

  const googleProfile = await profileResponse.json<{
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  }>();

  const userId = await upsertGoogleUser(env.DB, googleProfile);
  const redirectTo = (oauthState.redirect_to as string) || '/profile';
  return createSessionResponse(request, env, userId, redirectTo);
}

async function currentAuth(request: Request, env: Env) {
  const sessionId = getCookie(request, SESSION_COOKIE);
  if (!sessionId) {
    return json({ user: null });
  }

  const user = await env.DB.prepare(
    `SELECT u.id, u.email, u.full_name, u.avatar_url, u.auth_provider, u.status, u.status_reason, u.status_until, u.role
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP`
  ).bind(sessionId).first<Record<string, unknown>>();

  if (!user) {
    return json({ user: null }, {
      headers: {
        'set-cookie': clearSessionCookie(request)
      }
    });
  }

  return json({ user: user ? userDto(user) : null });
}

async function logout(request: Request, env: Env) {
  const sessionId = getCookie(request, SESSION_COOKIE);
  if (sessionId) {
    await env.DB.prepare('DELETE FROM auth_sessions WHERE id = ?').bind(sessionId).run();
  }

  return json({ ok: true }, {
    headers: {
      'set-cookie': clearSessionCookie(request)
    }
  });
}

async function uploadProfilePhoto(request: Request, env: Env, userId: string) {
  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) AS count FROM profile_photos WHERE user_id = ?'
  ).bind(userId).first<{ count: number }>();
  if (Number(countRow?.count || 0) >= MAX_PROFILE_PHOTOS) {
    return json({ error: `You can upload up to ${MAX_PROFILE_PHOTOS} profile photos` }, { status: 409 });
  }

  const form = await request.formData();
  const file = form.get('photo');
  if (!(file instanceof File)) return json({ error: 'Photo file is required' }, { status: 400 });
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return json({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed' }, { status: 415 });
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return json({ error: 'Image must be between 1 byte and 8 MB' }, { status: 413 });
  }

  const photoId = id('photo');
  const extension = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
  const r2Key = `profiles/${userId}/${photoId}.${extension}`;
  await env.PROFILE_IMAGES.put(r2Key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { userId, photoId }
  });

  const position = Number(countRow?.count || 0);
  const isPrimary = position === 0 ? 1 : 0;
  const url = `/api/profile/photo/${photoId}`;
  await env.DB.prepare(
    `INSERT INTO profile_photos (id, user_id, r2_key, url, content_type, size_bytes, position, is_primary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(photoId, userId, r2Key, url, file.type, file.size, position, isPrimary).run();

  return json({ photo: { id: photoId, url }, profile: await getProfile(env.DB, userId) }, { status: 201 });
}

async function deleteProfilePhoto(env: Env, userId: string, photoId: string) {
  const photo = await env.DB.prepare(
    'SELECT id, r2_key, is_primary FROM profile_photos WHERE id = ? AND user_id = ?'
  ).bind(photoId, userId).first<Record<string, unknown>>();
  if (!photo) return json({ error: 'Photo not found' }, { status: 404 });

  await env.PROFILE_IMAGES.delete(photo.r2_key as string);
  await env.DB.prepare('DELETE FROM profile_photos WHERE id = ? AND user_id = ?').bind(photoId, userId).run();

  const { results: remaining } = await env.DB.prepare(
    'SELECT id FROM profile_photos WHERE user_id = ? ORDER BY position ASC, created_at ASC'
  ).bind(userId).all<Record<string, unknown>>();

  for (const [index, row] of remaining.entries()) {
    await env.DB.prepare(
      'UPDATE profile_photos SET position = ?, is_primary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    ).bind(index, index === 0 ? 1 : 0, row.id, userId).run();
  }

  return json({ profile: await getProfile(env.DB, userId) });
}

async function serveProfilePhoto(request: Request, env: Env, userId: string, photoId: string) {
  const photo = await env.DB.prepare(
    'SELECT r2_key, content_type FROM profile_photos WHERE id = ? AND user_id = ?'
  ).bind(photoId, userId).first<Record<string, unknown>>();
  if (!photo) return json({ error: 'Photo not found' }, { status: 404 });

  const object = await env.PROFILE_IMAGES.get(photo.r2_key as string);
  if (!object) return json({ error: 'Photo object not found' }, { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('content-type', (photo.content_type as string) || 'application/octet-stream');
  headers.set('cache-control', 'private, max-age=300');
  headers.set('etag', object.httpEtag);
  return new Response(object.body, { headers });
}

async function uploadChatAttachment(request: Request, env: Env, userId: string, slug: string) {
  const check = await assertCanSend(env.DB, userId, slug);
  if (!check.ok) return json({ error: check.error }, { status: check.status });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return json({ error: 'Image file is required' }, { status: 400 });

  const ALLOWED_CHAT_ATTACHMENT_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'application/octet-stream'
  ]);
  if (!ALLOWED_CHAT_ATTACHMENT_TYPES.has(file.type)) {
    return json({ error: 'Unsupported file type. Only standard images and audio notes are allowed.' }, { status: 415 });
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return json({ error: 'Image must be between 1 byte and 8 MB' }, { status: 413 });
  }

  const attachmentId = id('msg-attachment');
  const extension = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
  const r2Key = `chats/${check.chatId}/${attachmentId}.${extension}`;
  await env.PROFILE_IMAGES.put(r2Key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { userId, chat_id: check.chatId || '' }
  });

  const isAudioFile = file.type.startsWith('audio/') || file.name.endsWith('.webm');
  const messageBody = isAudioFile ? '[Voice Note]' : '[Image]';

  const msgId = `msg-${crypto.randomUUID()}`;
  const url = `/api/chats/${slug}/attachments/${attachmentId}`;
  await env.DB.prepare(
    'INSERT INTO chat_messages (id, chat_id, sender_user_id, sender_role, body, attachment_url) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(msgId, check.chatId, userId, 'you', messageBody, url).run();

  // Send real-time broadcast via Durable Object room stub if anyone is connected
  try {
    const chatDoId = env.CHAT_ROOM.idFromName(check.chatId || '');
    const stub = env.CHAT_ROOM.get(chatDoId);
    
    // We send a POST to the DO's /broadcast route
    await stub.fetch(new Request('http://localhost/broadcast', {
      method: 'POST',
      body: JSON.stringify({
        type: "message",
        id: msgId,
        senderId: userId,
        message: messageBody,
        attachmentUrl: url,
        createdAt: new Date().toISOString()
      })
    }));
  } catch (err) {
    console.error("Failed to broadcast chat attachment real-time:", err);
  }

  return json({ ok: true, attachmentUrl: url, state: await getState(env.DB, userId) }, { status: 201 });
}

async function serveChatAttachment(request: Request, env: Env, userId: string, slug: string, attachmentId: string) {
  const chat = await env.DB.prepare('SELECT id, participant_a_user_id, participant_b_user_id FROM chats WHERE slug = ?').bind(slug).first<{ id: string; participant_a_user_id: string; participant_b_user_id: string }>();
  if (!chat) return json({ error: 'Chat not found' }, { status: 404 });
  if (userId !== chat.participant_a_user_id && userId !== chat.participant_b_user_id) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const listResult = await env.PROFILE_IMAGES.list({
    prefix: `chats/${chat.id}/${attachmentId}.`,
    limit: 1
  });
  
  if (listResult.objects.length === 0) {
    return json({ error: 'Attachment not found' }, { status: 404 });
  }
  
  const objectKey = listResult.objects[0].key;
  const object = await env.PROFILE_IMAGES.get(objectKey);
  if (!object) return json({ error: 'Attachment file not found' }, { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('content-type', object.httpMetadata?.contentType || 'image/jpeg');
  headers.set('cache-control', 'private, max-age=3600');
  headers.set('etag', object.httpEtag);
  return new Response(object.body, { headers });
}

async function routeApi(request: Request, env: Env) {
  const url = new URL(request.url);

  if (url.pathname === '/api/auth/google/start' && request.method === 'GET') {
    const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const limitResult = await checkRateLimit(env.DB, `auth_ip:${ip}`, 5, 60);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);
    return startGoogleLogin(request, env);
  }

  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const limitResult = await checkRateLimit(env.DB, `auth_ip:${ip}`, 5, 60);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);
    return tokenLogin(request, env);
  }

  if (url.pathname === '/api/auth/google/url' && request.method === 'GET') {
    return googleLoginUrl(request, env);
  }

  if (url.pathname === '/api/auth/google/callback' && request.method === 'GET') {
    return handleGoogleCallback(request, env);
  }

  // --- PHONE OTP (Sprint 2 Task 1) — public, mint sessions ---
  if (url.pathname === '/api/auth/otp/start' && request.method === 'POST') {
    const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const limitResult = await checkRateLimit(env.DB, `auth_ip:${ip}`, 5, 60);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    const body = await readJson<{ phone?: string; countryCode?: string }>(request);
    const phone = normalizePhone(body.phone || '', body.countryCode || '+91');
    if (!phone) return json({ error: 'invalid_phone' }, { status: 400 });
    const result = await startOtp(env, phone, ip);
    if (!result.ok) {
      const status = result.error === 'invalid_phone' ? 400 : 429;
      return json({ error: result.error, retryAfterSec: result.retryAfterSec }, { status });
    }
    await logEvent(env.DB, { user_id: null, event_name: 'otp_requested', entity_type: 'phone', entity_id: null });
    // devCode is only present with the console provider (dev); harmless in prod.
    return json({ ok: true, devCode: result.devCode });
  }

  if (url.pathname === '/api/auth/otp/verify' && request.method === 'POST') {
    const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const limitResult = await checkRateLimit(env.DB, `auth_ip:${ip}`, 5, 60);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    const body = await readJson<{ phone?: string; countryCode?: string; code?: string }>(request);
    const phone = normalizePhone(body.phone || '', body.countryCode || '+91');
    const code = (body.code || '').replace(/\D/g, '');
    if (!phone || code.length !== 6) return json({ error: 'invalid_input' }, { status: 400 });
    const result = await verifyOtp(env, request, phone, code);
    if (!result.ok) {
      const status = result.error === 'invalid_code' ? 401 : 400;
      return json({ error: result.error, attemptsLeft: result.attemptsLeft }, { status });
    }
    await logEvent(env.DB, {
      user_id: result.userId || null, event_name: 'otp_verified', entity_type: 'user', entity_id: result.userId || null
    });
    const user = await env.DB.prepare(
      'SELECT id, email, full_name, avatar_url, auth_provider, status, status_reason, status_until, role FROM users WHERE id = ?'
    ).bind(result.userId).first<Record<string, unknown>>();
    return json({ user: user ? userDto(user) : null }, { headers: { 'set-cookie': result.setCookie! } });
  }

  // --- EMAIL MAGIC LINK (Sprint 2 Task 2) ---
  if (url.pathname === '/api/auth/magic/start' && request.method === 'POST') {
    const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const limitResult = await checkRateLimit(env.DB, `auth_ip:${ip}`, 5, 60);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    const body = await readJson<{ email?: string }>(request);
    const email = body.email || '';
    const result = await startMagicLink(env, email, request.url);
    if (!result.ok) {
      return json({ error: result.error }, { status: 400 });
    }
    return json({ ok: true, devLink: result.devLink });
  }

  if (url.pathname === '/api/auth/magic/callback' && request.method === 'GET') {
    const token = url.searchParams.get('token') || '';
    const result = await verifyMagicLink(env, request, token);
    if (!result.ok) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': `/login?error=${result.error || 'invalid_magic_link'}` }
      });
    }
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/profile',
        'Set-Cookie': result.setCookie!
      }
    });
  }

  if (url.pathname === '/api/auth/me' && request.method === 'GET') {
    return currentAuth(request, env);
  }

  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    return logout(request, env);
  }

  // --- ACCOUNT LIFECYCLE pre-gate routes (Task 8) ---
  // Export + reactivate must work for a deactivated account (in deletion grace),
  // which the requireAuthedActive gate below 403s. Resolve the principal directly
  // and require only a real, non-banned user.
  if (url.pathname === '/api/account/export' && request.method === 'GET') {
    const p = await resolvePrincipal(request, env);
    if (p.kind !== 'user' || !p.userId) return json({ error: 'Authentication required' }, { status: 401 });
    if (p.status === 'banned') return json({ error: 'account_banned' }, { status: 403 });
    const bundle = await exportAccountData(env.DB, p.userId);
    return json(bundle, {
      headers: { 'content-disposition': `attachment; filename="instadate-export-${p.userId}.json"` }
    });
  }

  if (url.pathname === '/api/account/reactivate' && request.method === 'POST') {
    const p = await resolvePrincipal(request, env);
    if (p.kind !== 'user' || !p.userId) return json({ error: 'Authentication required' }, { status: 401 });
    const result = await reactivateAccount(env.DB, p.userId);
    if (!result.ok) return json({ error: result.error }, { status: 400 });
    return json({ ok: true, status: result.status });
  }


  const principal = await resolvePrincipal(request, env);
  const gate = requireAuthedActive(principal, request);
  if (!gate.ok) return gate.response;
  const userId = gate.userId;
  const sessionId = principal.sessionId;

  // Asynchronously update last_active_at for the user to track active presence / last seen
  env.DB.prepare('UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?').bind(userId).run().catch(() => {});

  if (url.pathname === '/api/state' && request.method === 'GET') {
    return json({ state: await getState(env.DB, userId) });
  }

  if (url.pathname === '/api/profile' && request.method === 'GET') {
    return json({ profile: await getProfile(env.DB, userId) });
  }

  if (url.pathname === '/api/profile' && request.method === 'PATCH') {
    const body = await readJson<{ profile?: Record<string, unknown> }>(request);
    await saveProfile(env.DB, userId, body.profile || body || {});
    await recomputeTrustMetrics(env.DB, userId);
    
    // Calculate exact weighted, mandatory-aware Profile Completion Model (Phase 4 / Sprint 2 Task 4)
    const db = env.DB;
    const profileRow = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(userId).first<Record<string, any>>();
    const nameOk = typeof profileRow?.full_name === 'string' && profileRow.full_name.trim().length > 0;
    const ageInt = parseInt(profileRow?.age || '', 10);
    const ageOk = !isNaN(ageInt) && ageInt >= 18;
    const genderOk = typeof profileRow?.gender === 'string' && profileRow.gender.trim().length > 0;
    const intentOk = typeof profileRow?.intent === 'string' && profileRow.intent.trim().length > 0;
    const cityOk = typeof profileRow?.city === 'string' && profileRow.city.trim().length > 0;
    
    const photoCountRow = await db.prepare('SELECT COUNT(*) AS count FROM profile_photos WHERE user_id = ?').bind(userId).first<{ count: number }>();
    const photoCount = photoCountRow?.count ?? 0;
    const hasPhoto = photoCount >= 1;

    let mandatoryCompleted = 0;
    if (nameOk) mandatoryCompleted += 1;
    if (ageOk) mandatoryCompleted += 1;
    if (genderOk) mandatoryCompleted += 1;
    if (hasPhoto) mandatoryCompleted += 1;
    if (cityOk) mandatoryCompleted += 1;
    if (intentOk) mandatoryCompleted += 1;

    const isAllMandatoryDone = (mandatoryCompleted === 6);

    let percent = mandatoryCompleted * 10;
    if (isAllMandatoryDone) {
      let qualityScore = 0;
      if (photoCount >= 3) qualityScore += 10;
      if (typeof profileRow?.bio === 'string' && profileRow.bio.trim().length >= 40) qualityScore += 8;
      
      const interestsCountRow = await db.prepare('SELECT COUNT(*) AS count FROM user_interests WHERE user_id = ?').bind(userId).first<{ count: number }>();
      if ((interestsCountRow?.count ?? 0) >= 3) qualityScore += 7;
      
      if (Number(profileRow?.phone_verified ?? 0) === 1) qualityScore += 8;
      if (Number(profileRow?.instagram_verified ?? 0) === 1) qualityScore += 7;
      
      percent += qualityScore;
    }

    const completionPercent = Math.min(100, Math.max(0, Math.round(percent)));

    return json({
      profile: await getProfile(env.DB, userId),
      state: await getState(env.DB, userId),
      completionPercent
    });
  }

  if (url.pathname === '/api/profile/photo' && request.method === 'POST') {
    return uploadProfilePhoto(request, env, userId);
  }

  const profilePhotoMatch = url.pathname.match(/^\/api\/profile\/photo\/([^/]+)$/);
  if (profilePhotoMatch && request.method === 'GET') {
    return serveProfilePhoto(request, env, userId, profilePhotoMatch[1]);
  }

  if (profilePhotoMatch && request.method === 'DELETE') {
    return deleteProfilePhoto(env, userId, profilePhotoMatch[1]);
  }

  if (url.pathname === '/api/users/me' && request.method === 'PUT') {
    const body = await readJson<{ profile?: Record<string, unknown> }>(request);
    await saveProfile(env.DB, userId, body.profile || {});
    await recomputeTrustMetrics(env.DB, userId);
    return json({ state: await getState(env.DB, userId) });
  }

  if (url.pathname === '/api/events' && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    // Beta: event hosting does NOT require identity verification (no verify flow live).
    const body = await readJson<{ event?: Record<string, unknown> }>(request);
    const eventId = await createEvent(env.DB, userId, body.event || {});
    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: 'event_created',
      entity_type: 'event',
      entity_id: eventId,
      metadata: { title: body.event?.title }
    });
    return json({ state: await getState(env.DB, userId) }, { status: 201 });
  }

  const eventJoinMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/attendees\/me$/);
  if (eventJoinMatch && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const limitResult = await checkRateLimit(env.DB, `evt:${userId}`, 10, 60); // 10 RSVPs per minute
    if (!limitResult.allowed) return rateLimitResponse(limitResult);
    const error = await joinEvent(env.DB, userId, eventJoinMatch[1]);
    if (error) return error;
    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: 'event_rsvp',
      entity_type: 'event',
      entity_id: eventJoinMatch[1]
    });
    return json({ state: await getState(env.DB, userId) });
  }

  if (eventJoinMatch && request.method === 'DELETE') {
    await env.DB.prepare(
      `UPDATE event_attendees SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE event_id = ? AND user_id = ?`
    ).bind(eventJoinMatch[1], userId).run();
    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: 'event_cancelled',
      entity_type: 'event',
      entity_id: eventJoinMatch[1]
    });
    return json({ state: await getState(env.DB, userId) });
  }

  // Admin Event Approval
  const attendeeApproveMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/attendees\/([^/]+)\/approve$/);
  if (attendeeApproveMatch && request.method === 'PATCH') {
    const eventId = attendeeApproveMatch[1];
    const attendeeUserId = attendeeApproveMatch[2];
    
    const event = await env.DB.prepare('SELECT host_user_id, title FROM events WHERE id = ?').bind(eventId).first<{ host_user_id: string; title: string }>();
    if (!event) return json({ error: 'Event not found' }, { status: 404 });
    if (event.host_user_id !== userId) return json({ error: 'Only the host can approve attendees' }, { status: 403 });

    await env.DB.prepare(
      `UPDATE event_attendees SET status = 'joined', updated_at = CURRENT_TIMESTAMP
       WHERE event_id = ? AND user_id = ?`
    ).bind(eventId, attendeeUserId).run();

    // Trigger attendee approved notification
    const hostProfile = await env.DB.prepare('SELECT full_name FROM profiles WHERE user_id = ?').bind(event.host_user_id).first<{ full_name: string }>();
    const hostName = hostProfile?.full_name || 'The host';
    await createNotification(env.DB, attendeeUserId, 'event_approved', {
      message: `${hostName} approved your request to join "${event.title}"!`,
      senderId: event.host_user_id,
      senderName: hostName,
      eventId: eventId,
      eventTitle: event.title
    });

    await logEvent(env.DB, {
      user_id: attendeeUserId,
      event_name: 'event_approved',
      entity_type: 'event',
      entity_id: eventId,
      metadata: { approved_by: userId }
    });

    return json({ state: await getState(env.DB, userId) });
  }

  // Admin Event Attendance Marking
  const attendeeAttendMatch = url.pathname.match(/^\/api\/events\/([^/]+)\/attendees\/([^/]+)\/attend$/);
  if (attendeeAttendMatch && request.method === 'PATCH') {
    const eventId = attendeeAttendMatch[1];
    const attendeeUserId = attendeeAttendMatch[2];
    const body = await readJson<{ showedUp: boolean }>(request);
    const showedUp = body.showedUp !== false;

    const event = await env.DB.prepare('SELECT host_user_id FROM events WHERE id = ?').bind(eventId).first<{ host_user_id: string }>();
    if (!event) return json({ error: 'Event not found' }, { status: 404 });
    if (event.host_user_id !== userId) return json({ error: 'Only the host can mark attendance' }, { status: 403 });

    if (showedUp) {
      await env.DB.prepare(`
        UPDATE trust_metrics 
        SET attended_count = attended_count + 1,
            attendance_score = MIN(100.0, attendance_score + 5.0),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(attendeeUserId).run();

      await logEvent(env.DB, {
        user_id: attendeeUserId,
        event_name: 'event_attended',
        entity_type: 'event',
        entity_id: eventId
      });
    } else {
      const noShowId = `ns-${crypto.randomUUID()}`;
      await env.DB.prepare(`
        INSERT INTO no_show_logs (id, user_id, event_id, reported_by_user_id, reason)
        VALUES (?, ?, ?, ?, 'No-show at hosted event')
      `).bind(noShowId, attendeeUserId, eventId, userId).run();

      await env.DB.prepare(`
        UPDATE trust_metrics 
        SET no_show_count = no_show_count + 1,
            attendance_score = MAX(0, attendance_score - 15.0),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(attendeeUserId).run();

      await logEvent(env.DB, {
        user_id: attendeeUserId,
        event_name: 'no_show_reported',
        entity_type: 'event',
        entity_id: eventId,
        metadata: { reported_by: userId }
      });
    }

    return json({ state: await getState(env.DB, userId) });
  }

  if (url.pathname === '/api/matches' && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const body = await readJson<{ memberId?: string; memberName?: string; note?: string; source?: string }>(request);
    await ensureUser(env.DB, userId);
    await env.DB.prepare(
      `INSERT INTO matches (id, requester_user_id, target_member_id, target_member_name, note)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO NOTHING`
    ).bind(id('match'), userId, body.memberId || '', body.memberName || '', body.note || '').run();

    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: 'match_request_sent',
      entity_type: 'user',
      entity_id: body.memberId || null,
      metadata: { note: body.note, source: body.source }
    });

    await logEvent(env.DB, {
      user_id: body.memberId || null,
      event_name: 'match_request_received',
      entity_type: 'user',
      entity_id: userId,
      metadata: { note: body.note, source: body.source }
    });

    return json({ state: await getState(env.DB, userId) }, { status: 201 });
  }

  // --- NOTIFICATIONS SYSTEM ---
  if (url.pathname === '/api/notifications' && request.method === 'GET') {
    const notifications = await getNotifications(env.DB, userId);
    return json({ notifications });
  }

  if (url.pathname === '/api/notifications/read' && request.method === 'POST') {
    const body = await readJson<{ notificationId?: string }>(request).catch(() => ({} as { notificationId?: string }));
    await markNotificationsRead(env.DB, userId, body.notificationId);
    return json({ ok: true, state: await getState(env.DB, userId) });
  }

  // --- DELTA UPDATES SYSTEM ---
  if (url.pathname === '/api/updates' && request.method === 'GET') {
    const since = url.searchParams.get('since') || new Date(0).toISOString();
    // D1 mixes SQLite-format timestamps (CURRENT_TIMESTAMP → '2026-06-01 12:00:00',
    // no 'Z') with JS ISO strings (with 'T'/'Z'). A raw string '>' across the two
    // formats is unsafe, so every comparison is canonicalised through datetime().

    // 1. Notification Updates
    const newNotificationsRow = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = ? AND datetime(created_at) > datetime(?) AND read_at IS NULL`
    ).bind(userId, since).first<{ count: number }>();
    const notificationsUpdate = (newNotificationsRow?.count ?? 0) > 0;

    // 2. Connection Updates
    const newRequestsRow = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM connection_requests
       WHERE to_user_id = ? AND datetime(created_at) > datetime(?)`
    ).bind(userId, since).first<{ count: number }>();

    const newConnectionsRow = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM connections
       WHERE (user_a_id = ? OR user_b_id = ?) AND datetime(created_at) > datetime(?)`
    ).bind(userId, userId, since).first<{ count: number }>();
    const connectionsUpdate = (newRequestsRow?.count ?? 0) > 0 || (newConnectionsRow?.count ?? 0) > 0;

    // 3. Event Updates
    const newAttendeeActivityRow = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM event_attendees
       WHERE (user_id = ?1 OR event_id IN (SELECT id FROM events WHERE host_user_id = ?1))
         AND datetime(updated_at) > datetime(?2)`
    ).bind(userId, since).first<{ count: number }>();

    const newEventDetailsRow = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM events
       WHERE (datetime(created_at) > datetime(?) OR datetime(updated_at) > datetime(?))`
    ).bind(since, since).first<{ count: number }>();
    const eventsUpdate = (newAttendeeActivityRow?.count ?? 0) > 0 || (newEventDetailsRow?.count ?? 0) > 0;

    // Get current unread/pending counters
    const unreadNotificationsRow = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL`
    ).bind(userId).first<{ count: number }>();

    const pendingRequestsRow = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM connection_requests 
       WHERE to_user_id = ? AND status = 'pending' 
         AND (expires_at IS NULL OR datetime(expires_at) > datetime(CURRENT_TIMESTAMP))`
    ).bind(userId).first<{ count: number }>();

    return json({
      cursor: new Date().toISOString(),
      updates: {
        notifications: notificationsUpdate,
        connections: connectionsUpdate,
        events: eventsUpdate
      },
      unreadNotificationsCount: unreadNotificationsRow?.count ?? 0,
      pendingRequestsCount: pendingRequestsRow?.count ?? 0
    });
  }

  // --- SETTINGS SYSTEM ---
  if (url.pathname === '/api/settings' && request.method === 'GET') {
    const settings = await getSettings(env.DB, userId);
    return json({ settings });
  }

  if (url.pathname === '/api/settings' && request.method === 'PATCH') {
    const body = await readJson<{ updates?: any }>(request).catch(() => ({} as { updates?: any }));
    await updateSettings(env.DB, userId, body.updates || {});
    return json({ ok: true, state: await getState(env.DB, userId) });
  }

  if (url.pathname === '/api/settings/verify' && request.method === 'POST') {
    const body = await readJson<{ type?: 'phone' | 'instagram' | 'selfie' }>(request).catch(() => ({} as { type?: 'phone' | 'instagram' | 'selfie' }));
    if (body.type) {
      await verifyAction(env.DB, userId, body.type);
    }
    return json({ ok: true, state: await getState(env.DB, userId) });
  }

  if (url.pathname === '/api/settings/sessions' && request.method === 'GET') {
    const currentSessionId = getCookie(request, SESSION_COOKIE);
    const { results } = await env.DB.prepare(
      `SELECT id, created_at, expires_at FROM auth_sessions 
       WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP 
       ORDER BY created_at DESC`
    ).bind(userId).all<{ id: string; created_at: string; expires_at: string }>();

    const sessions = results.map(s => ({
      id: s.id,
      createdAt: s.created_at,
      expiresAt: s.expires_at,
      isCurrent: s.id === currentSessionId
    }));
    return json({ sessions });
  }

  const sessionRevokeMatch = url.pathname.match(/^\/api\/settings\/sessions\/([^/]+)$/);
  if (sessionRevokeMatch && request.method === 'DELETE') {
    const sessionIdToRevoke = sessionRevokeMatch[1];
    await env.DB.prepare('DELETE FROM auth_sessions WHERE user_id = ? AND id = ?').bind(userId, sessionIdToRevoke).run();
    
    const currentSessionId = getCookie(request, SESSION_COOKIE);
    if (sessionIdToRevoke === currentSessionId) {
      return json({ ok: true, loggedOut: true }, {
        headers: {
          'set-cookie': clearSessionCookie(request)
        }
      });
    }
    return json({ ok: true });
  }

  // --- CONNECTION SYSTEM (mutual consent) ---
  if (url.pathname === '/api/connections/request' && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const limitResult = await checkRateLimit(env.DB, `conn:${userId}`, 10, 3600); // 10 connection requests per hour
    if (!limitResult.allowed) return rateLimitResponse(limitResult);
    const body = await readJson<{ toUserId?: string; note?: string }>(request);
    const result = await sendConnectionRequest(env.DB, userId, body.toUserId || '', body.note || '');
    if (!result.ok) return json({ error: result.error }, { status: 400 });
    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: result.status === 'connected' ? 'connection_accepted' : 'connection_requested',
      entity_type: 'user',
      entity_id: body.toUserId || null
    });
    return json({ status: result.status, chatId: result.chatId, state: await getState(env.DB, userId) }, { status: 201 });
  }

  if (url.pathname === '/api/connections/requests' && request.method === 'GET') {
    return json({ requests: await getIncomingRequests(env.DB, userId) });
  }

  if (url.pathname === '/api/connections' && request.method === 'GET') {
    return json({ connections: await getConnections(env.DB, userId) });
  }

  const connAcceptMatch = url.pathname.match(/^\/api\/connections\/([^/]+)\/accept$/);
  if (connAcceptMatch && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const result = await acceptConnectionRequest(env.DB, userId, connAcceptMatch[1]);
    if (!result.ok) return json({ error: result.error }, { status: result.error === 'forbidden' ? 403 : 400 });
    await logEvent(env.DB, {
      user_id: userId, session_id: sessionId,
      event_name: 'connection_accepted', entity_type: 'connection', entity_id: connAcceptMatch[1]
    });
    return json({ status: 'connected', chatId: result.chatId, state: await getState(env.DB, userId) });
  }

  const connRejectMatch = url.pathname.match(/^\/api\/connections\/([^/]+)\/reject$/);
  if (connRejectMatch && request.method === 'POST') {
    const result = await rejectConnectionRequest(env.DB, userId, connRejectMatch[1]);
    if (!result.ok) return json({ error: result.error }, { status: result.error === 'forbidden' ? 403 : 400 });
    return json({ ok: true, state: await getState(env.DB, userId) });
  }

  const chatVerifyMatch = url.pathname.match(/^\/api\/chats\/([^/]+)\/verification$/);
  if (chatVerifyMatch && request.method === 'PATCH') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const slug = chatVerifyMatch[1];
    const chat = await env.DB.prepare('SELECT id, participant_a_user_id, participant_b_user_id, verified_by_user_ids_json FROM chats WHERE slug = ?').bind(slug).first<Record<string, unknown>>();
    if (!chat) return json({ error: 'Chat not found' }, { status: 404 });
    if (userId !== chat.participant_a_user_id && userId !== chat.participant_b_user_id) {
      return json({ error: 'not_a_participant' }, { status: 403 });
    }
    const verified = new Set(parseJson<string[]>(chat.verified_by_user_ids_json as string, []));
    verified.add(userId);
    await env.DB.prepare('UPDATE chats SET verified_by_user_ids_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(JSON.stringify([...verified]), chat.id).run();
    return json({ state: await getState(env.DB, userId) });
  }

  const chatWsMatch = url.pathname.match(/^\/api\/chats\/([^/]+)\/ws$/);
  if (chatWsMatch && request.method === 'GET') {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const slug = chatWsMatch[1];
    
    // Check if the chat exists and user is a participant
    const chat = await env.DB.prepare('SELECT id, participant_a_user_id, participant_b_user_id FROM chats WHERE slug = ?').bind(slug).first<{ id: string; participant_a_user_id: string; participant_b_user_id: string }>();
    if (!chat) return json({ error: 'Chat not found' }, { status: 404 });
    if (userId !== chat.participant_a_user_id && userId !== chat.participant_b_user_id) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const id = env.CHAT_ROOM.idFromName(chat.id);
    const stub = env.CHAT_ROOM.get(id);

    const wsUrl = new URL(request.url);
    wsUrl.pathname = "/ws";
    wsUrl.searchParams.set("userId", userId);
    wsUrl.searchParams.set("chatId", chat.id);
    wsUrl.searchParams.set("chatSlug", slug);
    
    return stub.fetch(new Request(wsUrl.toString(), {
      headers: request.headers
    }));
  }

  const chatReadMatch = url.pathname.match(/^\/api\/chats\/([^/]+)\/read$/);
  if (chatReadMatch && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const slug = chatReadMatch[1];
    
    const chat = await env.DB.prepare('SELECT id, participant_a_user_id, participant_b_user_id FROM chats WHERE slug = ?').bind(slug).first<{ id: string; participant_a_user_id: string; participant_b_user_id: string }>();
    if (!chat) return json({ error: 'Chat not found' }, { status: 404 });
    if (userId !== chat.participant_a_user_id && userId !== chat.participant_b_user_id) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    // Insert read receipts for all messages in this chat not sent by current user
    await env.DB.prepare(`
      INSERT OR IGNORE INTO message_reads (chat_id, user_id, message_id)
      SELECT chat_id, ?1, id FROM chat_messages
      WHERE chat_id = ?2 AND sender_user_id != ?1
    `).bind(userId, chat.id).run();

    return json({ ok: true });
  }

  const chatAttachmentMatch = url.pathname.match(/^\/api\/chats\/([^/]+)\/attachments$/);
  if (chatAttachmentMatch && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    // Throttle uploads: each is an 8 MB R2 write, so far cheaper to abuse than text.
    const limitResult = await checkRateLimit(env.DB, `att:${userId}`, 20, 60); // 20 uploads/min
    if (!limitResult.allowed) return rateLimitResponse(limitResult);
    return uploadChatAttachment(request, env, userId, chatAttachmentMatch[1]);
  }

  const serveAttachmentMatch = url.pathname.match(/^\/api\/chats\/([^/]+)\/attachments\/([^/]+)$/);
  if (serveAttachmentMatch && request.method === 'GET') {
    return serveChatAttachment(request, env, userId, serveAttachmentMatch[1], serveAttachmentMatch[2]);
  }

  const chatMessageMatch = url.pathname.match(/^\/api\/chats\/([^/]+)\/messages$/);
  if (chatMessageMatch && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const limitResult = await checkRateLimit(env.DB, `msg:${userId}`, 60, 60); // 60 messages per minute
    if (!limitResult.allowed) return rateLimitResponse(limitResult);
    const slug = chatMessageMatch[1];
    const body = await readJson<{ text?: string; clientMsgId?: string }>(request);
    const text = (body.text || '').trim();
    if (!text) return json({ error: 'Message text is required' }, { status: 400 });
    if (text.length > 4000) return json({ error: 'Message too long' }, { status: 400 });
    const check = await assertCanSend(env.DB, userId, slug);
    if (!check.ok) return json({ error: check.error }, { status: check.status });

    // Idempotency: collapse offline resends / double-taps to a single row.
    const clientMsgId = typeof body.clientMsgId === 'string' ? body.clientMsgId.slice(0, 80) : null;
    if (clientMsgId) {
      const dupe = await env.DB.prepare(
        'SELECT id FROM chat_messages WHERE chat_id = ? AND client_msg_id = ?'
      ).bind(check.chatId, clientMsgId).first<{ id: string }>();
      if (dupe) return json({ state: await getState(env.DB, userId), deduped: true }, { status: 200 });
    }

    await env.DB.prepare(
      'INSERT INTO chat_messages (id, chat_id, sender_user_id, sender_role, body, client_msg_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id('msg'), check.chatId, userId, 'you', text, clientMsgId).run();

    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: 'message_sent',
      entity_type: 'chat',
      entity_id: check.chatId,
      metadata: { bodyLength: text.length }
    });

    return json({ state: await getState(env.DB, userId) }, { status: 201 });
  }

  // Reliability: catch-up fetch for a WebSocket reconnect gap. Returns messages
  // created after `cursor` (a message id or ISO time) so the client can reconcile
  // without falling back to the full-state poll. Excludes soft-deleted rows.
  const chatSinceMatch = url.pathname.match(/^\/api\/chats\/([^/]+)\/since$/);
  if (chatSinceMatch && request.method === 'GET') {
    const slug = chatSinceMatch[1];
    const chat = await env.DB.prepare(
      'SELECT id, participant_a_user_id, participant_b_user_id FROM chats WHERE slug = ?'
    ).bind(slug).first<{ id: string; participant_a_user_id: string; participant_b_user_id: string }>();
    if (!chat) return json({ error: 'Chat not found' }, { status: 404 });
    if (userId !== chat.participant_a_user_id && userId !== chat.participant_b_user_id) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const cursor = url.searchParams.get('cursor') || '';
    // Resolve the cursor to a created_at lower bound. A message id is preferred
    // (stable ordering); fall back to treating the cursor as an ISO timestamp.
    let sinceTs = '';
    if (cursor) {
      const cursorRow = await env.DB.prepare(
        'SELECT created_at FROM chat_messages WHERE id = ? AND chat_id = ?'
      ).bind(cursor, chat.id).first<{ created_at: string }>();
      sinceTs = cursorRow?.created_at || cursor;
    }

    const { results } = await env.DB.prepare(
      `SELECT id, sender_user_id, sender_role, body, attachment_url, created_at
         FROM chat_messages
        WHERE chat_id = ?1
          AND deleted_at IS NULL
          AND (?2 = '' OR created_at > ?2)
        ORDER BY created_at ASC
        LIMIT 200`
    ).bind(chat.id, sinceTs).all<Record<string, unknown>>();

    const messages = results.map(m => ({
      id: m.id as string,
      role: m.sender_user_id === userId ? 'you' : 'match',
      body: m.body as string,
      attachmentUrl: (m.attachment_url as string) || '',
      createdAt: m.created_at as string
    }));
    return json({ messages, cursor: messages.length ? messages[messages.length - 1].createdAt : cursor });
  }

  // Soft-delete a message the caller authored. Renders as "message deleted"
  // client-side; the row is retained for audit and a later purge job.
  const messageDeleteMatch = url.pathname.match(/^\/api\/messages\/([^/]+)$/);
  if (messageDeleteMatch && request.method === 'DELETE') {
    const messageId = messageDeleteMatch[1];
    const msg = await env.DB.prepare(
      'SELECT id, sender_user_id, chat_id FROM chat_messages WHERE id = ?'
    ).bind(messageId).first<{ id: string; sender_user_id: string; chat_id: string }>();
    if (!msg) return json({ error: 'Message not found' }, { status: 404 });
    if (msg.sender_user_id !== userId) return json({ error: 'Forbidden' }, { status: 403 });

    await env.DB.prepare(
      "UPDATE chat_messages SET deleted_at = CURRENT_TIMESTAMP, body = '[message deleted]', attachment_url = NULL WHERE id = ?"
    ).bind(messageId).run();

    // Fan out the deletion so open clients update in realtime.
    try {
      const doId = env.CHAT_ROOM.idFromName(msg.chat_id);
      const stub = env.CHAT_ROOM.get(doId);
      await stub.fetch(new Request('http://localhost/broadcast', {
        method: 'POST',
        body: JSON.stringify({ type: 'deleted', id: messageId })
      }));
    } catch (err) {
      console.error('Failed to broadcast message deletion:', err);
    }

    return json({ ok: true, state: await getState(env.DB, userId) });
  }

  // --- MATCHMAKING & INTEL LAYER ENDPOINTS ---

  // 1. Interests Engine
  if (url.pathname === '/api/interests' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT interest, weight FROM user_interests WHERE user_id = ?').bind(userId).all();
    return json({ interests: results });
  }

  if (url.pathname === '/api/interests' && request.method === 'POST') {
    const body = await readJson<{ interests: Array<{ interest: string; weight: number }> }>(request);
    await env.DB.prepare('DELETE FROM user_interests WHERE user_id = ?').bind(userId).run();
    for (const item of body.interests || []) {
      await env.DB.prepare(
        'INSERT INTO user_interests (user_id, interest, weight) VALUES (?, ?, ?)'
      ).bind(userId, item.interest, Number(item.weight)).run();
    }
    return json({ state: await getState(env.DB, userId) });
  }

  // 2. Intent Engine
  if (url.pathname === '/api/intents' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT intent FROM user_intents WHERE user_id = ?').bind(userId).all();
    return json({ intents: results.map(r => r.intent) });
  }

  if (url.pathname === '/api/intents' && request.method === 'POST') {
    const body = await readJson<{ intents: string[] }>(request);
    await env.DB.prepare('DELETE FROM user_intents WHERE user_id = ?').bind(userId).run();
    for (const intentVal of body.intents || []) {
      await env.DB.prepare('INSERT INTO user_intents (user_id, intent) VALUES (?, ?)').bind(userId, intentVal).run();
    }
    return json({ state: await getState(env.DB, userId) });
  }

  // Intent Compatibility Matrix
  if (url.pathname === '/api/intent-compatibility' && request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM intent_compatibility').all();
    return json({ matrix: results });
  }

  // 3. Recommendation Engine
  if (url.pathname === '/api/recommendations' && request.method === 'GET') {
    const recommendations = await getRecommendationsWithProfilesV2(env.DB, userId);
    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: 'recommendations_viewed'
    });
    return json({ recommendations });
  }

  // Preferences Routes
  if (url.pathname === '/api/preferences' && request.method === 'GET') {
    const preferences = await getOrInitializePreferences(env.DB, userId);
    return json({ preferences });
  }

  if (url.pathname === '/api/preferences' && request.method === 'POST') {
    const body = await readJson<any>(request);
    await savePreferences(env.DB, userId, body.preferences || body || {});
    return json({ state: await getState(env.DB, userId) });
  }

  // Match Outcomes Routes
  if (url.pathname === '/api/match-outcomes' && request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT * FROM match_outcomes WHERE user_id_a = ?1 OR user_id_b = ?1 ORDER BY updated_at DESC'
    ).bind(userId).all();
    return json({ outcomes: results });
  }

  if (url.pathname === '/api/match-outcomes' && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const body = await readJson<any>(request);
    const outcomeId = body.matchOutcomeId || body.id || id('mo');
    const { userIdB, status } = body;
    
    // Get previous status to detect transitions (e.g. planned to cancelled)
    const prevOutcome = await env.DB.prepare('SELECT status FROM match_outcomes WHERE id = ?').bind(outcomeId).first<{ status: string }>();

    await env.DB.prepare(`
      INSERT INTO match_outcomes (id, user_id_a, user_id_b, status, updated_at)
      VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id_a, user_id_b) DO UPDATE SET status = ?4, updated_at = CURRENT_TIMESTAMP
    `).bind(outcomeId, userId, userIdB, status).run();

    // Event hooks based on status
    if (status === 'accepted') {
      await logEvent(env.DB, {
        user_id: userId,
        session_id: sessionId,
        event_name: 'match_request_accepted',
        entity_type: 'match_outcome',
        entity_id: outcomeId,
        metadata: { target_id: userIdB }
      });
      await logEvent(env.DB, {
        user_id: userIdB,
        event_name: 'match_request_accepted',
        entity_type: 'match_outcome',
        entity_id: outcomeId,
        metadata: { target_id: userId }
      });
    } else if (status === 'chat_started') {
      await logEvent(env.DB, {
        user_id: userId,
        session_id: sessionId,
        event_name: 'chat_started',
        entity_type: 'match_outcome',
        entity_id: outcomeId
      });
    } else if (status === 'meetup_planned') {
      await logEvent(env.DB, {
        user_id: userId,
        session_id: sessionId,
        event_name: 'meetup_planned',
        entity_type: 'match_outcome',
        entity_id: outcomeId
      });
      await logEvent(env.DB, {
        user_id: userId,
        session_id: sessionId,
        event_name: 'meetup_confirmed',
        entity_type: 'match_outcome',
        entity_id: outcomeId
      });
    }

    if (prevOutcome?.status === 'meetup_planned' && status !== 'meetup_planned' && status !== 'meetup_completed') {
      await logEvent(env.DB, {
        user_id: userId,
        session_id: sessionId,
        event_name: 'meetup_cancelled',
        entity_type: 'match_outcome',
        entity_id: outcomeId
      });
    }

    return json({ state: await getState(env.DB, userId) });
  }

  // Meetup Feedback Route
  if (url.pathname === '/api/meetup-feedback' && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const body = await readJson<any>(request);
    const { matchOutcomeId, targetUserId, meetupHappened, showedUp, ratingStars, meetAgain, textFeedback } = body;
    const isHappened = meetupHappened === 1 || meetupHappened === true;
    const isShowedUp = showedUp === 1 || showedUp === true;
    const stars = ratingStars ? Number(ratingStars) : null;
    const isMeetAgain = meetAgain === 1 || meetAgain === true;

    await recordMeetupOutcome(
      env.DB,
      userId,
      targetUserId,
      isHappened,
      isShowedUp,
      stars,
      isMeetAgain,
      textFeedback || null,
      matchOutcomeId
    );

    if (isHappened && isShowedUp) {
      await logEvent(env.DB, {
        user_id: userId,
        session_id: sessionId,
        event_name: 'meetup_completed',
        entity_type: 'match_outcome',
        entity_id: matchOutcomeId,
        metadata: { target_user_id: targetUserId }
      });
    } else if (isHappened && !isShowedUp) {
      await logEvent(env.DB, {
        user_id: targetUserId,
        event_name: 'no_show_reported',
        entity_type: 'match_outcome',
        entity_id: matchOutcomeId,
        metadata: { reported_by: userId }
      });
    }

    return json({ state: await getState(env.DB, userId) });
  }

  // Blocks & Rejections
  if (url.pathname === '/api/blocks' && request.method === 'POST') {
    const body = await readJson<{ targetId: string }>(request);
    if (!body.targetId) return json({ error: 'targetId is required' }, { status: 400 });
    await blockUser(env.DB, userId, body.targetId);
    return json({ state: await getState(env.DB, userId) });
  }

  if (url.pathname === '/api/rejections' && request.method === 'POST') {
    const body = await readJson<{ targetId: string }>(request);
    if (!body.targetId) return json({ error: 'targetId is required' }, { status: 400 });
    await rejectUser(env.DB, userId, body.targetId);
    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: 'match_request_rejected',
      entity_type: 'user',
      entity_id: body.targetId
    });
    return json({ state: await getState(env.DB, userId) });
  }

  // Block list (settings) + unblock
  if (url.pathname === '/api/blocks' && request.method === 'GET') {
    const { results } = await env.DB.prepare(`
      SELECT b.blocked_user_id AS id, u.full_name AS name
      FROM user_blocks b LEFT JOIN users u ON u.id = b.blocked_user_id
      WHERE b.user_id = ? ORDER BY b.created_at DESC
    `).bind(userId).all<{ id: string; name: string }>();
    return json({ blocks: results });
  }

  const unblockMatch = url.pathname.match(/^\/api\/blocks\/([^/]+)$/);
  if (unblockMatch && request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM user_blocks WHERE user_id = ? AND blocked_user_id = ?')
      .bind(userId, unblockMatch[1]).run();
    return json({ state: await getState(env.DB, userId) });
  }

  // Abuse reports
  if (url.pathname === '/api/reports' && request.method === 'POST') {
    const limitResult = await checkRateLimit(env.DB, `rep:${userId}`, 5, 3600); // 5 reports per hour
    if (!limitResult.allowed) return rateLimitResponse(limitResult);
    const body = await readJson<{ targetType?: string; targetId?: string; reason?: string; details?: string }>(request);
    const result = await createReport(env.DB, userId, body.targetType || '', body.targetId || '', body.reason || '', body.details);
    if (!result.ok) return json({ error: result.error }, { status: 400 });
    await logEvent(env.DB, {
      user_id: userId, session_id: sessionId,
      event_name: 'report_created', entity_type: body.targetType, entity_id: body.targetId || null,
      metadata: { reason: body.reason }
    });
    return json({ ok: true, reportId: result.reportId }, { status: 201 });
  }

  // --- ACCOUNT LIFECYCLE (authed) ---
  // Reversible pause: hide everywhere, data retained.
  if (url.pathname === '/api/account/deactivate' && request.method === 'POST') {
    const result = await deactivateAccount(env.DB, userId);
    if (!result.ok) return json({ error: result.error }, { status: 400 });
    await logEvent(env.DB, {
      user_id: userId, session_id: sessionId,
      event_name: 'account_deactivated', entity_type: 'user', entity_id: userId
    });
    return json({ ok: true, status: result.status });
  }

  // Irreversible deletion request: deactivate now, schedule hard purge after grace.
  if (url.pathname === '/api/account' && request.method === 'DELETE') {
    const result = await requestDeletion(env.DB, userId);
    if (!result.ok) return json({ error: result.error }, { status: 400 });
    await logEvent(env.DB, {
      user_id: userId, session_id: sessionId,
      event_name: 'account_deletion_requested', entity_type: 'user', entity_id: userId,
      metadata: { purge_at: result.purgeAt }
    });
    return json({ ok: true, status: result.status, purgeAt: result.purgeAt });
  }


  // 4. Member Discovery
  if (url.pathname === '/api/discovery' && request.method === 'GET') {
    const discovery = await getDiscoveryMembers(env.DB, userId);
    return json({ discovery });
  }

  // 4b. All Members list (database-backed)
  if (url.pathname === '/api/members' && request.method === 'GET') {
    const { results: profiles } = await env.DB.prepare(`
      SELECT p.*, u.full_name, u.avatar_url
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.completed = 1
        AND u.status = 'active'
        AND u.id != ?1
        AND u.id NOT IN (SELECT blocked_user_id FROM user_blocks WHERE user_id = ?1)
        AND u.id NOT IN (SELECT user_id FROM user_blocks WHERE blocked_user_id = ?1)
        AND u.id NOT IN (SELECT rejected_user_id FROM user_rejections WHERE user_id = ?1)
      ORDER BY p.updated_at DESC
    `).bind(userId).all<any>();

    const resolvedMembers = [];
    for (const p of profiles) {
      const trust = await getOrInitializeTrustMetrics(env.DB, p.user_id, true);
      const { results: photos } = await env.DB.prepare(
        'SELECT url FROM profile_photos WHERE user_id = ? ORDER BY position ASC'
      ).bind(p.user_id).all<{ url: string }>();
      const photoUrls = photos.map(ph => ph.url);

      resolvedMembers.push({
        id: p.user_id,
        name: p.full_name,
        age: Number(p.age),
        city: p.city,
        vibe: p.vibe,
        score: '94%', // Default compatibility vibe score
        prompt: 'Opening Note',
        answer: p.weekend_status || p.bio || '',
        gradient: 'pink',
        avatar: (p.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        photos: photoUrls.length > 0 ? photoUrls : [p.avatar_url || ''],
        weekendStatus: p.weekend_status || '',
        currentWeekendStatus: (() => {
          const status = (p.weekend_status || '').toLowerCase();
          if (status.includes('movie') || status.includes('film')) return 'Movie';
          if (status.includes('coffee') || status.includes('cafe') || status.includes('tea')) return 'Coffee';
          if (status.includes('walk') || status.includes('trek') || status.includes('travel')) return 'Walk';
          if (status.includes('pickleball') || status.includes('play') || status.includes('court')) return 'Pickleball';
          // Fallback based on vibe
          const vibe = (p.vibe || '').toLowerCase();
          if (vibe.includes('cafe')) return 'Coffee';
          if (vibe.includes('travel') || vibe.includes('art')) return 'Walk';
          if (vibe.includes('concert')) return 'Movie';
          return 'Coffee';
        })(),
        weekendStatusUpdatedAt: p.updated_at || new Date().toISOString(),
        trustMetrics: trust,
        trustScore: trust.trust_score,
        isVerified: trust.is_verified,
        phone_verified: p.phone_verified,
        instagram_verified: p.instagram_verified,
        profile_verified: p.profile_verified,
        verification_level: p.verification_level
      });
    }
    return json({ members: resolvedMembers });
  }

  // 5. Event Intelligence Recommendations
  if (url.pathname === '/api/events/recommended' && request.method === 'GET') {
    const events = await getRecommendedEvents(env.DB, userId);
    return json({ events });
  }

  // 6. Instant Plans
  if (url.pathname === '/api/instant-plans' && request.method === 'GET') {
    const plans = await getInstantPlans(env.DB, userId);
    return json({ plans });
  }

  if (url.pathname === '/api/instant-plans' && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const body = await readJson<{ plan: Record<string, any> }>(request);
    const planId = await createInstantPlan(env.DB, userId, body.plan || body || {});
    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: 'instant_plan_created',
      entity_type: 'instant_plan',
      entity_id: planId,
      metadata: { title: body.plan?.title }
    });
    return json({ planId, state: await getState(env.DB, userId) }, { status: 201 });
  }

  const joinPlanMatch = url.pathname.match(/^\/api\/instant-plans\/([^/]+)\/join$/);
  if (joinPlanMatch && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const err = await joinInstantPlan(env.DB, userId, joinPlanMatch[1]);
    if (err) return json({ error: err.error }, { status: err.status });
    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: 'instant_plan_joined',
      entity_type: 'instant_plan',
      entity_id: joinPlanMatch[1]
    });
    return json({ state: await getState(env.DB, userId) });
  }

  if (joinPlanMatch && request.method === 'DELETE') {
    await leaveInstantPlan(env.DB, userId, joinPlanMatch[1]);
    return json({ state: await getState(env.DB, userId) });
  }

  const completePlanMatch = url.pathname.match(/^\/api\/instant-plans\/([^/]+)\/complete$/);
  if (completePlanMatch && request.method === 'POST') {
    const planId = completePlanMatch[1];
    const plan = await env.DB.prepare('SELECT creator_user_id FROM instant_plans WHERE id = ?').bind(planId).first<{ creator_user_id: string }>();
    if (!plan) return json({ error: 'Plan not found' }, { status: 404 });
    if (plan.creator_user_id !== userId) return json({ error: 'Only the creator can complete the plan' }, { status: 403 });

    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: 'instant_plan_completed',
      entity_type: 'instant_plan',
      entity_id: planId
    });

    return json({ state: await getState(env.DB, userId) });
  }

  // --- ANALYTICS SYSTEM ENDPOINTS ---

  // Reusable Event logging API (for frontend actions)
  if (url.pathname === '/api/analytics/event' && request.method === 'POST') {
    const body = await readJson<{ event_name: string; entity_type?: string; entity_id?: string; metadata?: any }>(request);
    if (!body.event_name) return json({ error: 'event_name is required' }, { status: 400 });
    const eventId = await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: body.event_name,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      metadata: body.metadata
    });
    return json({ ok: true, eventId }, { status: 201 });
  }

  // === ADMIN & MODERATION CONTROLS (Sprint 4 Task 3) =======================
  // Role is resolved from the DB users.role column, with the ADMIN_USER_IDS env
  // allowlist as a break-glass super-admin. Moderators get the review queue +
  // user/event moderation; admins additionally manage roles.
  if (url.pathname.startsWith('/api/admin/')) {
    const me = await resolveRole(env.DB, userId, env.ADMIN_USER_IDS);

    // Who am I (drives the admin console + nav gating on the client).
    if (url.pathname === '/api/admin/me' && request.method === 'GET') {
      return json({ role: me.role, isModerator: isModerator(me.role), isAdmin: isAdmin(me.role) });
    }

    // Everything below requires at least moderator.
    if (!isModerator(me.role)) return json({ error: 'forbidden' }, { status: 403 });

    // --- User moderation: set account status (suspend / ban / reinstate) ---
    const adminStatusMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/status$/);
    if (adminStatusMatch && request.method === 'POST') {
      const targetId = adminStatusMatch[1];
      if (targetId === userId) return json({ error: 'cannot_moderate_self' }, { status: 400 });
      const body = await readJson<{ status?: string; reason?: string; until?: string }>(request);
      const result = await setAccountStatus(env.DB, targetId, body.status || '', body.reason, body.until);
      if (!result.ok) return json({ error: result.error }, { status: 400 });
      await recordAudit(env.DB, {
        actorUserId: userId,
        action: `user_${body.status}`,
        targetType: 'user',
        targetId,
        reason: body.reason ?? null,
        metadata: { status: body.status, until: body.until ?? null }
      });
      await logEvent(env.DB, {
        user_id: userId,
        event_name: 'account_status_changed',
        entity_type: 'user',
        entity_id: targetId,
        metadata: { status: body.status, reason: body.reason }
      });
      return json({ ok: true });
    }

    // --- User moderation: list / search users ---
    if (url.pathname === '/api/admin/users' && request.method === 'GET') {
      const users = await listUsersForModeration(env.DB, {
        status: url.searchParams.get('status') || undefined,
        search: url.searchParams.get('search') || undefined
      });
      return json({ users });
    }

    // --- Role management (admin only) ---
    const adminRoleMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/role$/);
    if (adminRoleMatch && request.method === 'POST') {
      if (!isAdmin(me.role)) return json({ error: 'forbidden' }, { status: 403 });
      const targetId = adminRoleMatch[1];
      if (targetId === userId) return json({ error: 'cannot_change_own_role' }, { status: 400 });
      const body = await readJson<{ role?: string }>(request);
      const result = await setUserRole(env.DB, targetId, body.role || '');
      if (!result.ok) return json({ error: result.error }, { status: 400 });
      await recordAudit(env.DB, {
        actorUserId: userId,
        action: 'role_changed',
        targetType: 'role',
        targetId,
        metadata: { role: body.role }
      });
      return json({ ok: true });
    }

    // --- Moderation queue: list reports ---
    if (url.pathname === '/api/admin/reports' && request.method === 'GET') {
      const status = url.searchParams.get('status') || undefined;
      return json({ reports: await listReports(env.DB, status) });
    }

    // --- Moderation queue: resolve a report ---
    const reportResolveMatch = url.pathname.match(/^\/api\/admin\/reports\/([^/]+)$/);
    if (reportResolveMatch && request.method === 'POST') {
      const body = await readJson<{ status?: string }>(request);
      const result = await resolveReport(env.DB, userId, reportResolveMatch[1], body.status || '');
      if (!result.ok) return json({ error: result.error }, { status: 400 });
      await recordAudit(env.DB, {
        actorUserId: userId,
        action: 'report_resolved',
        targetType: 'report',
        targetId: reportResolveMatch[1],
        metadata: { status: body.status }
      });
      return json({ ok: true });
    }

    // --- Event moderation: list events ---
    if (url.pathname === '/api/admin/events' && request.method === 'GET') {
      const events = await listEventsForModeration(env.DB, {
        moderationStatus: url.searchParams.get('status') || undefined
      });
      return json({ events });
    }

    // --- Event moderation: hide / remove / restore ---
    const eventModMatch = url.pathname.match(/^\/api\/admin\/events\/([^/]+)\/moderation$/);
    if (eventModMatch && request.method === 'POST') {
      const eventId = eventModMatch[1];
      const body = await readJson<{ status?: string; reason?: string }>(request);
      const result = await setEventModeration(env.DB, userId, eventId, body.status || '', body.reason);
      if (!result.ok) return json({ error: result.error }, { status: 400 });
      await recordAudit(env.DB, {
        actorUserId: userId,
        action: `event_${body.status}`,
        targetType: 'event',
        targetId: eventId,
        reason: body.reason ?? null
      });
      await logEvent(env.DB, {
        user_id: userId,
        event_name: 'event_moderated',
        entity_type: 'event',
        entity_id: eventId,
        metadata: { status: body.status, reason: body.reason }
      });
      return json({ ok: true });
    }

    // --- Audit trail ---
    if (url.pathname === '/api/admin/audit' && request.method === 'GET') {
      const logs = await listAuditLogs(env.DB, {
        action: url.searchParams.get('action') || undefined,
        targetType: url.searchParams.get('targetType') || undefined
      });
      return json({ logs });
    }
  }

  if (url.pathname === '/api/admin/analytics' && request.method === 'GET') {
    const dashboard = await getDashboardAnalytics(env.DB);
    const cohorts = await getCohortAnalytics(env.DB);
    const funnels = await getFunnelMetrics(env.DB);
    const recentActivity = await getRecentActivityFeed(env.DB, 50);

    // Calculate dynamic admin alerts
    const alerts: Array<{ type: 'warning' | 'info'; message: string }> = [];
    if (funnels.rates.profileCompletionRate < 50) {
      alerts.push({ type: 'warning', message: `Critical: Profile Completion Rate is extremely low at ${funnels.rates.profileCompletionRate}% (Target: >50%)` });
    }
    if (funnels.rates.acceptanceRate < 20) {
      alerts.push({ type: 'warning', message: `Critical: Match Acceptance Rate is low at ${funnels.rates.acceptanceRate}% (Target: >20%)` });
    }
    if (funnels.rates.meetupCompletionRate < 40) {
      alerts.push({ type: 'warning', message: `Critical: Meetup Completion Rate is poor at ${funnels.rates.meetupCompletionRate}% (Target: >40%)` });
    }
    if (dashboard.northStar.eventAttendanceRate < 50) {
      alerts.push({ type: 'warning', message: `Critical: Event Attendance Rate is underperforming at ${dashboard.northStar.eventAttendanceRate}% (Target: >50%)` });
    }
    if (dashboard.northStar.noShowRate > 20) {
      alerts.push({ type: 'warning', message: `Warning: No Show Rate is dangerously high at ${dashboard.northStar.noShowRate}% (Target: <20%)` });
    }

    return json({
      dashboard,
      cohorts,
      funnels,
      recentActivity,
      alerts
    });
  }

  // Dedicated Admin Health Dashboard API
  if (url.pathname === '/api/admin/health' && request.method === 'GET') {
    const healthMetrics = await getCompanyHealthMetrics(env.DB);
    return json(healthMetrics);
  }

  // Submit Event/Host Rating & Review API
  if (url.pathname.startsWith('/api/events/') && url.pathname.endsWith('/review') && request.method === 'POST') {
    const pub = await requirePublished(env, userId); if (pub) return pub;
    const parts = url.pathname.split('/');
    const eventId = parts[3];
    const body = await readJson<any>(request);
    const { eventRating, hostRating, wouldAttendAgain, feedback } = body;

    if (!eventRating || !hostRating) {
      return json({ error: 'eventRating and hostRating are required' }, { status: 400 });
    }

    await env.DB.prepare(`
      INSERT INTO event_feedback (id, event_id, user_id, rating, host_rating, would_attend_again, feedback)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(event_id, user_id) DO UPDATE SET
        rating = excluded.rating,
        host_rating = excluded.host_rating,
        would_attend_again = excluded.would_attend_again,
        feedback = excluded.feedback,
        created_at = CURRENT_TIMESTAMP
    `).bind(
      `fb-${crypto.randomUUID()}`,
      eventId,
      userId,
      Number(eventRating),
      Number(hostRating),
      wouldAttendAgain ? 1 : 0,
      feedback || null
    ).run();

    await logEvent(env.DB, {
      user_id: userId,
      session_id: sessionId,
      event_name: 'event_attended',
      entity_type: 'event',
      entity_id: eventId,
      metadata: { event_rating: eventRating, host_rating: hostRating, would_attend_again: wouldAttendAgain, feedback }
    });

    return json({ ok: true });
  }

  return json({ error: 'Not found' }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return withCors(new Response(null, { status: 204 }));
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        await seedDatabaseIfEmpty(env.DB, env);
        return withCors(await routeApi(request, env));
      } catch (error) {
        console.error(error);
        return withCors(json({ error: 'Internal server error' }, { status: 500 }));
      }
    }

    return env.ASSETS.fetch(request);
  },
  async scheduled(controller: any, env: Env, ctx: any) {
    ctx.waitUntil(runCronMatchmaking(env.DB));
    // Sweep expired rate-limit buckets (moved off the per-request hot path).
    ctx.waitUntil(
      pruneRateLimits(env.DB).catch(err => console.error('[prune] rate_limits failed', err))
    );
    // Hard-delete accounts whose 30-day deletion grace has elapsed (Task 8 purge job).
    ctx.waitUntil(
      runScheduledPurge(env.DB, env.PROFILE_IMAGES)
        .then(r => { if (r.purged) console.log(`[purge] removed ${r.purged} account(s):`, r.ids); })
        .catch(err => console.error('[purge] failed', err))
    );
  }
};

export class ChatRoom {
  state: any;
  env: Env;
  sessions: Map<string, WebSocket[]>;

  constructor(state: any, env: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === "/broadcast") {
      try {
        const data = await request.json<any>();
        this.broadcast(data);
        return new Response("ok", { status: 200 });
      } catch (err) {
        return new Response("Invalid request", { status: 400 });
      }
    }
    
    if (url.pathname === "/ws") {
      const userId = url.searchParams.get("userId");
      const chatId = url.searchParams.get("chatId");
      const chatSlug = url.searchParams.get("chatSlug");
      if (!userId) return new Response("Missing userId", { status: 400 });
      if (!chatId) return new Response("Missing chatId", { status: 400 });
      if (!chatSlug) return new Response("Missing chatSlug", { status: 400 });

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleSession(server, userId, chatId, chatSlug);

      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response("Not Found", { status: 404 });
  }

  async handleSession(ws: WebSocket, userId: string, chatId: string, chatSlug: string) {
    ws.accept();

    let userSessions = this.sessions.get(userId);
    if (!userSessions) {
      userSessions = [];
      this.sessions.set(userId, userSessions);
    }
    userSessions.push(ws);

    // Notify the newly connected session about other online users
    for (const [otherUserId, otherSessions] of this.sessions.entries()) {
      if (otherUserId !== userId && otherSessions.length > 0) {
        try {
          ws.send(JSON.stringify({ type: "presence", userId: otherUserId, status: "online" }));
        } catch (e) {
          // ignore
        }
      }
    }

    // Broadcast our presence to other participants
    this.broadcast({ type: "presence", userId, status: "online" });

    // Mark existing messages as read upon connecting
    this.env.DB.prepare(`
      INSERT OR IGNORE INTO message_reads (chat_id, user_id, message_id)
      SELECT chat_id, ?1, id FROM chat_messages
      WHERE chat_id = ?2 AND sender_user_id != ?1
    `).bind(userId, chatId).run()
      .then(() => {
        this.broadcast({ type: "read_all", userId });
      })
      .catch(err => console.error("Failed to mark messages as read on connect:", err));

    ws.addEventListener("message", async (msg) => {
      try {
        const data = JSON.parse(msg.data as string);
        if (data.type === "typing") {
          this.broadcast({ type: "typing", userId, isTyping: data.isTyping }, userId);
        } else if (data.type === "read") {
          // Persist read receipt to database
          await this.env.DB.prepare(
            'INSERT OR IGNORE INTO message_reads (chat_id, user_id, message_id) VALUES (?, ?, ?)'
          ).bind(chatId, userId, data.messageId).run();
          
          // Broadcast read status
          this.broadcast({ type: "read", userId, messageId: data.messageId });
        } else if (data.type === "message") {
          // 1. Validate payload (reject empty / oversized).
          const text = typeof data.message === 'string' ? data.message.trim() : '';
          if (!text) {
            ws.send(JSON.stringify({ type: "error", error: "empty_message" }));
            return;
          }
          if (text.length > 4000) {
            ws.send(JSON.stringify({ type: "error", error: "message_too_long" }));
            return;
          }

          // 2. Rate-limit the realtime path too (the HTTP send route is limited
          //    to 60/min; without this the WS path would bypass the throttle).
          const limit = await checkRateLimit(this.env.DB, `msg:${userId}`, 60, 60);
          if (!limit.allowed) {
            ws.send(JSON.stringify({ type: "error", error: "too_many_requests" }));
            return;
          }

          // 3. Authorize sender using assertCanSend by chat slug
          const check = await assertCanSend(this.env.DB, userId, chatSlug);
          if (!check.ok) {
            ws.send(JSON.stringify({ type: "error", error: check.error }));
            return;
          }

          // 4. Idempotency: a client-supplied id lets offline resends collapse to
          //    one row. Echo it back so the optimistic bubble can reconcile.
          const clientMsgId = typeof data.clientMsgId === 'string' ? data.clientMsgId.slice(0, 80) : null;
          if (clientMsgId) {
            const dupe = await this.env.DB.prepare(
              'SELECT id FROM chat_messages WHERE chat_id = ? AND client_msg_id = ?'
            ).bind(chatId, clientMsgId).first<{ id: string }>();
            if (dupe) {
              ws.send(JSON.stringify({ type: "ack", id: dupe.id, clientMsgId }));
              return;
            }
          }

          // 5. Persist message to D1 database
          const msgId = `msg-${crypto.randomUUID()}`;
          await this.env.DB.prepare(
            'INSERT INTO chat_messages (id, chat_id, sender_user_id, sender_role, body, client_msg_id) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(msgId, chatId, userId, 'you', text, clientMsgId).run();

          // 6. Broadcast message to all participants in this chat room
          this.broadcast({
            type: "message",
            id: msgId,
            senderId: userId,
            message: text,
            clientMsgId,
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error("Durable Object message handling failed:", e);
      }
    });

    ws.addEventListener("close", () => {
      this.removeSession(userId, ws);
      this.broadcast({ type: "presence", userId, status: "offline" });
    });

    ws.addEventListener("error", () => {
      this.removeSession(userId, ws);
      this.broadcast({ type: "presence", userId, status: "offline" });
    });
  }

  removeSession(userId: string, ws: WebSocket) {
    const userSessions = this.sessions.get(userId);
    if (userSessions) {
      const idx = userSessions.indexOf(ws);
      if (idx !== -1) {
        userSessions.splice(idx, 1);
      }
      if (userSessions.length === 0) {
        this.sessions.delete(userId);
      }
    }
  }

  broadcast(message: any, excludeUserId?: string) {
    const payload = JSON.stringify(message);
    for (const [userId, userSessions] of this.sessions.entries()) {
      if (userId === excludeUserId) continue;
      for (const ws of userSessions) {
        try {
          ws.send(payload);
        } catch (e) {
          // ignore
        }
      }
    }
  }
}
