import { D1Database } from '@cloudflare/workers-types';
import { calculateLocationScore } from './location';
import { getOrInitializeTrustMetrics } from './trust';

// Profession Categories mapping and Complementary matrix
export type ProfessionCategory =
  | 'Technology'
  | 'Marketing'
  | 'Finance'
  | 'Healthcare'
  | 'Education'
  | 'Design'
  | 'Media'
  | 'Business'
  | 'Legal'
  | 'Government'
  | 'Hospitality'
  | 'Student'
  | 'Entrepreneur'
  | 'Other';

const KEYWORD_MAPS: Record<Exclude<ProfessionCategory, 'Other'>, string[]> = {
  Technology: ['developer', 'engineer', 'programmer', 'tech', 'software', 'coder', 'it', 'data', 'web', 'computer', 'sysadmin', 'cloud'],
  Marketing: ['marketing', 'pr', 'brand', 'ads', 'advertising', 'growth', 'seo', 'sales', 'copywriter'],
  Finance: ['finance', 'banker', 'accountant', 'trading', 'investor', 'banking', 'audit', 'broker', 'tax'],
  Healthcare: ['doctor', 'nurse', 'medical', 'physician', 'dentist', 'pharma', 'health', 'clinic', 'surgeon', 'therapist'],
  Education: ['teacher', 'professor', 'tutor', 'coach', 'academic', 'school', 'faculty', 'instructor'],
  Design: ['designer', 'artist', 'illustrator', 'ui/ux', 'architect', 'creative', 'animator', 'fashion'],
  Media: ['writer', 'journalist', 'editor', 'video', 'audio', 'photographer', 'content', 'media', 'news', 'podcast'],
  Business: ['manager', 'consultant', 'analyst', 'corporate', 'operations', 'hr', 'executive', 'director', 'admin'],
  Legal: ['lawyer', 'attorney', 'legal', 'paralegal', 'judge', 'law', 'counsel'],
  Government: ['civil', 'military', 'public', 'government', 'officer', 'police', 'navy', 'ias'],
  Hospitality: ['chef', 'waiter', 'hotel', 'travel', 'tourism', 'food', 'cafe', 'service', 'bartender'],
  Student: ['student', 'college', 'university', 'studying', 'undergrad', 'grad'],
  Entrepreneur: ['founder', 'cofounder', 'entrepreneur', 'startup', 'ceo', 'owner', 'builder']
};

export function getProfessionCategory(professionText: string | null | undefined): ProfessionCategory {
  if (!professionText) return 'Other';
  const text = professionText.trim().toLowerCase();
  
  for (const [category, keywords] of Object.entries(KEYWORD_MAPS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category as ProfessionCategory;
      }
    }
  }
  return 'Other';
}

export function scoreProfessionSimilarity(catA: ProfessionCategory, catB: ProfessionCategory): number {
  if (catA === 'Other' || catB === 'Other') return 40;
  if (catA === catB) return 100;

  const pairs = [
    ['Technology', 'Design', 85],
    ['Technology', 'Entrepreneur', 90],
    ['Marketing', 'Business', 80],
    ['Finance', 'Entrepreneur', 85],
    ['Business', 'Entrepreneur', 85],
    ['Media', 'Marketing', 85],
    ['Student', 'Education', 60]
  ];

  for (const [a, b, score] of pairs) {
    if ((catA === a && catB === b) || (catA === b && catB === a)) {
      return score as number;
    }
  }

  return 40; // Default baseline similarity
}

export async function getIntentCompatibilityMatrix(db: D1Database): Promise<Map<string, number>> {
  const { results } = await db.prepare('SELECT * FROM intent_compatibility').all<{ intent_a: string; intent_b: string; score: number }>();
  const map = new Map<string, number>();
  for (const r of results) {
    map.set(`${r.intent_a.toLowerCase()}:${r.intent_b.toLowerCase()}`, r.score);
  }
  return map;
}

/**
 * Computes Weighted Average Intent Compatibility Score across multiple intentions.
 */
export function calculateWeightedIntentScore(
  intentsA: string[],
  intentsB: string[],
  compatibilityMap: Map<string, number>
): { score: number; explanations: string[] } {
  if (intentsA.length === 0 || intentsB.length === 0) {
    return { score: 0, explanations: [] };
  }

  let totalScore = 0;
  let count = 0;
  
  const matches: Array<{ a: string; b: string; score: number }> = [];

  for (const a of intentsA) {
    for (const b of intentsB) {
      const key1 = `${a.toLowerCase()}:${b.toLowerCase()}`;
      const key2 = `${b.toLowerCase()}:${a.toLowerCase()}`;
      const score = compatibilityMap.get(key1) ?? compatibilityMap.get(key2) ?? 10;
      totalScore += score;
      count++;
      if (score >= 80) {
        matches.push({ a, b, score });
      }
    }
  }

  const finalScore = count > 0 ? Math.round(totalScore / count) : 0;
  const explanations: string[] = [];

  if (finalScore >= 85) {
    explanations.push('Highly aligned relationship goals');
  } else if (finalScore >= 60) {
    explanations.push('Complementary dating objectives');
  } else if (finalScore >= 40) {
    explanations.push('Partially matching vibes');
  }

  return { score: finalScore, explanations };
}

/**
 * Version 2 Matchmaking Compatibility Engine
 */
export async function calculateCompatibilityV2(
  db: D1Database,
  userIdA: string,
  userIdB: string,
  intentMatrixCache?: Map<string, number>
): Promise<{ score: number; explanations: string[] }> {
  // Fetch Profiles
  const profileA = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(userIdA).first<any>();
  const profileB = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(userIdB).first<any>();

  if (!profileA || !profileB) {
    return { score: 0, explanations: ['Profile not found'] };
  }

  const explanations: string[] = [];

  // 1. Intent Engine V2 (25%)
  const matrix = intentMatrixCache || await getIntentCompatibilityMatrix(db);
  const intentsA = (await db.prepare('SELECT intent FROM user_intents WHERE user_id = ?').bind(userIdA).all<{ intent: string }>()).results.map(i => i.intent);
  const intentsB = (await db.prepare('SELECT intent FROM user_intents WHERE user_id = ?').bind(userIdB).all<{ intent: string }>()).results.map(i => i.intent);
  const { score: intentScore, explanations: intentExplanations } = calculateWeightedIntentScore(intentsA, intentsB, matrix);
  explanations.push(...intentExplanations);

  // 2. Interests Engine (20%)
  const A_ints = (await db.prepare('SELECT interest, weight FROM user_interests WHERE user_id = ?').bind(userIdA).all<{ interest: string; weight: number }>()).results;
  const B_ints = (await db.prepare('SELECT interest, weight FROM user_interests WHERE user_id = ?').bind(userIdB).all<{ interest: string; weight: number }>()).results;

  const mapA = new Map(A_ints.map(r => [r.interest, r.weight]));
  const mapB = new Map(B_ints.map(r => [r.interest, r.weight]));

  let sharedCount = 0;
  let scoreSum = 0;
  const sharedNames: string[] = [];

  for (const [interest, wA] of mapA) {
    if (mapB.has(interest)) {
      sharedCount++;
      const wB = mapB.get(interest)!;
      const diff = Math.abs(wA - wB);
      scoreSum += (100 - diff * 10);
      if (wA >= 3 && wB >= 3) {
        sharedNames.push(interest);
      }
    }
  }

  let interestScore = 0;
  const unionSize = new Set([...mapA.keys(), ...mapB.keys()]).size;
  if (unionSize > 0 && sharedCount > 0) {
    const similarity = scoreSum / sharedCount;
    const coverage = sharedCount / unionSize;
    interestScore = similarity * coverage;
  }

  if (sharedNames.length > 0) {
    explanations.push(`Shared interest in ${sharedNames.slice(0, 3).join(', ')}`);
  }

  // 3. Location Engine V2 (15%)
  const { score: locationScore, explanation: locationExpl } = calculateLocationScore(profileA, profileB);
  explanations.push(locationExpl);

  // 4. Age Engine (10%)
  const ageA = parseInt(profileA.age) || 24;
  const ageB = parseInt(profileB.age) || 24;
  const ageDiff = Math.abs(ageA - ageB);
  let ageScore = 20;

  if (ageDiff <= 2) {
    ageScore = 100;
    explanations.push('Similar age');
  } else if (ageDiff <= 5) {
    ageScore = 80;
    explanations.push('Close age group');
  } else if (ageDiff <= 8) {
    ageScore = 50;
  }

  // 5. Lifestyle Engine (10%) - Upgraded with Profession Intelligence
  const vibeA = (profileA.vibe || '').toLowerCase().replace(/\s+/g, '');
  const vibeB = (profileB.vibe || '').toLowerCase().replace(/\s+/g, '');
  let lifestyleScore = 0;

  if (vibeA && vibeB && vibeA === vibeB) {
    lifestyleScore += 50;
  }

  const categoryA = getProfessionCategory(profileA.profession);
  const categoryB = getProfessionCategory(profileB.profession);
  const profScore = scoreProfessionSimilarity(categoryA, categoryB);
  lifestyleScore += (profScore * 0.5);

  if (lifestyleScore >= 50) {
    explanations.push('Similar vibes and professional backgrounds');
  } else {
    lifestyleScore = Math.max(30, lifestyleScore);
  }

  // 6. Activity Engine (10%)
  let activityScore = 30;
  const commonEvents = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM event_attendees ea1
    JOIN event_attendees ea2 ON ea1.event_id = ea2.event_id
    WHERE ea1.user_id = ?1 AND ea2.user_id = ?2 AND ea1.status = 'joined' AND ea2.status = 'joined'
  `).bind(userIdA, userIdB).first<{ count: number }>();

  if (commonEvents && commonEvents.count > 0) {
    activityScore = 100;
    explanations.push('Attending same social events');
  } else {
    const overlapLoved = [...mapA.entries()].filter(([interest, weight]) => weight === 5 && mapB.get(interest) === 5);
    if (overlapLoved.length > 0) {
      activityScore = 80;
      explanations.push(`Shared passion for ${overlapLoved[0][0]}`);
    }
  }

  // 7. Trust Integration (10%)
  const partnerTrust = await getOrInitializeTrustMetrics(db, userIdB, Boolean(profileB.completed));
  const trustScore = partnerTrust.trust_score;

  if (trustScore >= 85) {
    explanations.push('Highly reliable match');
  } else if (partnerTrust.is_verified) {
    explanations.push('Verified partner');
  }

  // Final Compatibility Score V2
  const totalScore = Math.round(
    0.25 * intentScore +
    0.20 * interestScore +
    0.15 * locationScore +
    0.10 * ageScore +
    0.10 * lifestyleScore +
    0.10 * activityScore +
    0.10 * trustScore
  );

  return {
    score: totalScore,
    explanations: explanations.length > 0 ? explanations : ['General compatibility']
  };
}
