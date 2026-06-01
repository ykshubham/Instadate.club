import { D1Database } from '@cloudflare/workers-types';
import { getProfileCoords, getCoordinatesForCity, getHaversineDistance } from './location';

export interface EventRecommendation {
  id: string;
  title: string;
  type: string;
  date: string;
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
  category: string;
  activityType: string;
  approvalRequired: boolean;
  genderRatioPreference: string;
  visibility: string;
  eventQualityScore: number;
  score: number;
  explanations: string[];
}

/**
 * Calculates a dynamic Event Quality Score based on hosting trust, capacity filled, and no-shows.
 */
export async function calculateEventQualityScore(
  db: D1Database,
  event: { id: string; host_user_id: string; capacity: number; attendee_count: number }
): Promise<number> {
  let score = 70; // Baseline score

  // 1. Host Trust Score Contribution
  const hostTrust = await db.prepare('SELECT trust_score FROM trust_metrics WHERE user_id = ?')
    .bind(event.host_user_id).first<{ trust_score: number }>();
  if (hostTrust) {
    const trustVal = Number(hostTrust.trust_score);
    // Add/subtract based on host reliability
    score += (trustVal - 75) * 0.4;
  }

  // 2. Attendance Fill Rate Reward (up to 20 pts)
  const fillRate = event.capacity > 0 ? (event.attendee_count / event.capacity) : 0;
  if (fillRate >= 0.8) {
    score += 20;
  } else if (fillRate >= 0.5) {
    score += 12;
  } else if (fillRate >= 0.2) {
    score += 5;
  }

  // 3. No Show History Penalities (from feedback)
  const noShows = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM meetup_feedback 
    WHERE match_outcome_id IN (SELECT id FROM match_outcomes WHERE user_id_a = ?1 OR user_id_b = ?1)
      AND showed_up = 0
  `).bind(event.host_user_id).first<{ count: number }>();

  if (noShows && noShows.count > 0) {
    score -= Math.min(30, noShows.count * 6); // Subtract up to 30 pts for past host event no-shows
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Dynamic event recommendation search ranking for a specific user.
 */
export async function getRecommendedEventsV2(db: D1Database, userId: string): Promise<EventRecommendation[]> {
  const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(userId).first<any>();
  if (!profile) return [];

  const myInterests = (await db.prepare('SELECT interest, weight FROM user_interests WHERE user_id = ?').bind(userId).all<{ interest: string; weight: number }>()).results;
  const myIntents = (await db.prepare('SELECT intent FROM user_intents WHERE user_id = ?').bind(userId).all<{ intent: string }>()).results.map(i => i.intent);
  const userCoords = getProfileCoords(profile);

  // Fetch all open events
  const { results: events } = await db.prepare(`
    SELECT e.*, u.full_name AS host_name,
      COUNT(CASE WHEN ea.status = 'joined' THEN 1 END) AS attendee_count
    FROM events e
    LEFT JOIN users u ON u.id = e.host_user_id
    LEFT JOIN event_attendees ea ON ea.event_id = e.id
    WHERE e.deleted_at IS NULL AND e.is_closed = 0 AND e.moderation_status = 'active'
    GROUP BY e.id
  `).all<any>();

  const scoredEvents: EventRecommendation[] = [];

  for (const row of events) {
    const attendeeCount = Number(row.attendee_count || 0);
    const capacity = Number(row.capacity || 10);

    // Compute base event quality
    const eventQualityScore = await calculateEventQualityScore(db, {
      id: row.id,
      host_user_id: row.host_user_id,
      capacity,
      attendee_count: attendeeCount
    });

    const category = (row.category || '').toLowerCase();
    const title = (row.title || '').toLowerCase();
    const desc = (row.description || '').toLowerCase();
    const location = (row.location || '').toLowerCase();
    const type = (row.type || '').toLowerCase();

    let score = 0;
    const explanations: string[] = [];

    // 1. Proximity Scoring (up to 30 pts)
    let proximityScore = 10;
    if (profile.city && location.includes(profile.city.toLowerCase())) {
      proximityScore = 30;
      explanations.push('Happening in your city');
    } else {
      const eventCoords = getCoordinatesForCity(row.location);
      if (userCoords && eventCoords) {
        const dist = getHaversineDistance(userCoords.lat, userCoords.lon, eventCoords.lat, eventCoords.lon);
        if (dist <= 50) {
          proximityScore = 30;
          explanations.push('Close by (under 50 km)');
        } else if (dist <= 150) {
          proximityScore = 20;
          explanations.push('Within 150 km');
        }
      }
    }
    score += proximityScore;

    // 2. User Interests Alignment (up to 30 pts)
    let interestBoost = 0;
    for (const item of myInterests) {
      const term = item.interest.toLowerCase();
      if (category.includes(term) || title.includes(term) || desc.includes(term)) {
        interestBoost = Math.max(interestBoost, item.weight * 6);
      }
    }
    if (interestBoost > 0) {
      score += interestBoost;
      explanations.push('Matches your interests');
    }

    // 3. User Intents Alignment (up to 15 pts)
    let intentMatch = false;
    for (const intent of myIntents) {
      const intentLower = intent.toLowerCase();
      if (intentLower.includes('networking') && (type.includes('networking') || title.includes('networking') || title.includes('mixer'))) {
        intentMatch = true;
      }
      if (intentLower.includes('friend') && (type.includes('friends') || desc.includes('friends') || desc.includes('casual'))) {
        intentMatch = true;
      }
      if (intentLower.includes('relationship') && (type.includes('date') || type.includes('romantic') || desc.includes('romance'))) {
        intentMatch = true;
      }
    }
    if (intentMatch) {
      score += 15;
      explanations.push('Fits your relationship intent');
    }

    // 4. Quality Contribution (25% weight of Event Quality Score)
    const qualityBoost = Math.round(eventQualityScore * 0.25);
    score += qualityBoost;

    if (eventQualityScore >= 80) {
      explanations.push('Highly rated event');
    }

    scoredEvents.push({
      id: row.id,
      title: row.title,
      type: row.type || 'Social',
      date: row.display_date || '',
      time: row.display_time || '',
      place: row.location || '',
      image: row.image || '',
      status: row.status || 'open',
      description: row.description || '',
      capacity,
      entry: row.entry_type || 'Free',
      price: row.price || '',
      approval: row.approval_type || 'Instant',
      hostName: row.host_name || 'Club host',
      createdAt: row.created_at || '',
      source: row.source || 'system',
      attendeeCount,
      category: row.category || 'Social',
      activityType: row.activity_type || 'Social Outing',
      approvalRequired: Boolean(row.approval_required),
      genderRatioPreference: row.gender_ratio_preference || 'None',
      visibility: row.visibility || 'Public',
      eventQualityScore,
      score: Math.min(100, score),
      explanations
    });
  }

  // Sort by final score descending
  return scoredEvents.sort((a, b) => b.score - a.score);
}
