import { D1Database } from '@cloudflare/workers-types';
import { calculateCompatibilityV2, getIntentCompatibilityMatrix } from './compatibility';
import { getProfileCoords, getHaversineDistance } from './location';

export interface UserPreferences {
  user_id: string;
  preferred_gender: string | null; // 'Male', 'Female', 'All'
  min_age: number;
  max_age: number;
  preferred_distance_km: number;
}

export async function getOrInitializePreferences(db: D1Database, userId: string): Promise<UserPreferences> {
  let pref = await db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').bind(userId).first<any>();
  if (!pref) {
    await db.prepare(`
      INSERT INTO user_preferences (user_id, preferred_gender, min_age, max_age, preferred_distance_km)
      VALUES (?, 'All', 18, 99, 100.0)
    `).bind(userId).run();
    pref = await db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').bind(userId).first<any>();
  }
  return {
    user_id: userId,
    preferred_gender: pref.preferred_gender || 'All',
    min_age: Number(pref.min_age ?? 18),
    max_age: Number(pref.max_age ?? 99),
    preferred_distance_km: Number(pref.preferred_distance_km ?? 100.0)
  };
}

export async function savePreferences(
  db: D1Database,
  userId: string,
  prefs: Partial<UserPreferences>
): Promise<void> {
  const current = await getOrInitializePreferences(db, userId);
  const preferredGender = prefs.preferred_gender !== undefined ? prefs.preferred_gender : current.preferred_gender;
  const minAge = prefs.min_age !== undefined ? Number(prefs.min_age) : current.min_age;
  const maxAge = prefs.max_age !== undefined ? Number(prefs.max_age) : current.max_age;
  const preferredDistanceKm = prefs.preferred_distance_km !== undefined ? Number(prefs.preferred_distance_km) : current.preferred_distance_km;

  await db.prepare(`
    INSERT INTO user_preferences (user_id, preferred_gender, min_age, max_age, preferred_distance_km, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      preferred_gender = ?2,
      min_age = ?3,
      max_age = ?4,
      preferred_distance_km = ?5,
      updated_at = CURRENT_TIMESTAMP
  `).bind(userId, preferredGender, minAge, maxAge, preferredDistanceKm).run();
}

/**
 * High-performance candidate pre-filtering to prevent wasting CPU cycles.
 */
export function matchesPreferences(
  userPref: UserPreferences,
  userCoords: any,
  candidateProfile: {
    gender: string;
    age: string;
    city?: string;
    profile_latitude?: number | null;
    profile_longitude?: number | null;
  }
): boolean {
  // 1. Gender Filter
  if (userPref.preferred_gender && userPref.preferred_gender !== 'All') {
    const candidateGender = (candidateProfile.gender || '').trim().toLowerCase();
    const targetGender = userPref.preferred_gender.trim().toLowerCase();
    if (candidateGender !== targetGender) {
      return false;
    }
  }

  // 2. Age Filter
  const age = parseInt(candidateProfile.age) || 24;
  if (age < userPref.min_age || age > userPref.max_age) {
    return false;
  }

  // 3. Distance Filter
  const candCoords = getProfileCoords(candidateProfile);
  if (userCoords && candCoords) {
    const dist = getHaversineDistance(userCoords.lat, userCoords.lon, candCoords.lat, candCoords.lon);
    if (dist > userPref.preferred_distance_km) {
      return false;
    }
  }

  return true;
}

/**
 * Core dynamic recommendations engine with preference filtering and 1-hour cache logic.
 */
export async function getOrGenerateRecommendationsV2(db: D1Database, userId: string) {
  // Try 1-hour cache hit
  const existing = await db.prepare(
    "SELECT * FROM recommended_users WHERE user_id = ? AND datetime(generated_at) > datetime(CURRENT_TIMESTAMP, '-1 hour') ORDER BY score DESC"
  ).bind(userId).all<{ recommended_user_id: string; score: number; explanation: string }>();

  if (existing.results.length > 0) {
    return existing.results;
  }

  // Generate recommendations
  const userPref = await getOrInitializePreferences(db, userId);
  const myProfile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(userId).first<any>();
  const userCoords = myProfile ? getProfileCoords(myProfile) : null;

  // Query eligible candidates (excluding blocked/rejected users)
  const candidates = await db.prepare(`
    SELECT u.id, p.gender, p.age, p.city, p.profile_latitude, p.profile_longitude, p.completed
    FROM users u
    JOIN profiles p ON p.user_id = u.id
    WHERE u.id != ?1 AND p.completed = 1
      AND u.id NOT IN (SELECT blocked_user_id FROM user_blocks WHERE user_id = ?1)
      AND u.id NOT IN (SELECT user_id FROM user_blocks WHERE blocked_user_id = ?1)
      AND u.id NOT IN (SELECT rejected_user_id FROM user_rejections WHERE user_id = ?1)
  `).bind(userId).all<any>();

  const scored: Array<{ recommended_user_id: string; score: number; explanation: string }> = [];
  const matrix = await getIntentCompatibilityMatrix(db);

  for (const cand of candidates.results) {
    // Phase 2 Pre-filtering
    if (!matchesPreferences(userPref, userCoords, cand)) {
      continue;
    }

    const { score, explanations } = await calculateCompatibilityV2(db, userId, cand.id, matrix);
    
    // Feature 3: Query "Would Meet Again %" trust signal
    const feedbackStats = await db.prepare(
      "SELECT COUNT(*) as total, SUM(CASE WHEN meet_again = 1 THEN 1 ELSE 0 END) as positive FROM meetup_feedback WHERE target_user_id = ?"
    ).bind(cand.id).first<{ total: number; positive: number }>();

    let finalScore = score;
    const finalExplanations = [...explanations];

    if (feedbackStats && feedbackStats.total > 0) {
      const wmaPct = Math.round((feedbackStats.positive / feedbackStats.total) * 100);
      if (wmaPct >= 80) {
        const boost = wmaPct >= 90 ? 10 : 5;
        finalScore = Math.min(100, finalScore + boost);
        finalExplanations.push(`High Repeat Interest: ${wmaPct}% would meet again`);
      }
    }

    // Include all reasonably compatible matches
    if (finalScore >= 40) {
      scored.push({
        recommended_user_id: cand.id,
        score: finalScore,
        explanation: JSON.stringify(finalExplanations)
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  // D1 Batch Write cache update
  const statements = [
    db.prepare('DELETE FROM recommended_users WHERE user_id = ?').bind(userId)
  ];
  for (const item of scored) {
    statements.push(
      db.prepare('INSERT INTO recommended_users (user_id, recommended_user_id, score, explanation) VALUES (?, ?, ?, ?)')
        .bind(userId, item.recommended_user_id, item.score, item.explanation)
    );
  }
  
  if (statements.length > 1) {
    await db.batch(statements);
  } else {
    await statements[0].run();
  }

  return scored;
}

/**
 * Cloudflare Scheduled Cron precomputing incremental matchmaking task.
 * Refreshes recommendations for users who changed profiles or logged in recently.
 */
export async function runCronMatchmaking(db: D1Database): Promise<{ processedCount: number }> {
  // Select batch of users needing update:
  // e.g. users whose recommendations cache is missing, expired (> 24 hours),
  // or whose profiles were updated since recommendations were last generated.
  const usersNeedUpdate = await db.prepare(`
    SELECT DISTINCT p.user_id 
    FROM profiles p
    LEFT JOIN recommended_users ru ON ru.user_id = p.user_id
    WHERE p.completed = 1
      AND (
        ru.user_id IS NULL 
        OR datetime(ru.generated_at) < datetime(CURRENT_TIMESTAMP, '-24 hours')
        OR datetime(p.updated_at) > datetime(ru.generated_at)
      )
    LIMIT 20
  `).all<{ user_id: string }>();

  let count = 0;
  
  for (const r of usersNeedUpdate.results) {
    const userId = r.user_id;
    try {
      // Re-generate recommendations using V2 rules
      await getOrGenerateRecommendationsV2(db, userId);
      count++;
    } catch (err) {
      console.error(`Failed to precompute matches for user ${userId}:`, err);
    }
  }

  return { processedCount: count };
}
