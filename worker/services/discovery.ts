import { D1Database } from '@cloudflare/workers-types';
import { getOrGenerateRecommendationsV2 } from './recommendations';
import { calculateLocationScore } from './location';
import { getOrInitializeTrustMetrics } from './trust';

export async function getDiscoveryMembersV2(db: D1Database, userId: string) {
  // Fetch master recommendations list
  const recs = await getOrGenerateRecommendationsV2(db, userId);
  
  // Resolve full profiles, trust, and metadata
  const enrichedCandidates: any[] = [];
  const myProfile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(userId).first<any>();
  
  for (const r of recs) {
    const profile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(r.recommended_user_id).first<any>();
    if (!profile) continue;

    const user = await db.prepare('SELECT email, avatar_url, full_name FROM users WHERE id = ?').bind(r.recommended_user_id).first<any>();
    const trust = await getOrInitializeTrustMetrics(db, r.recommended_user_id, Boolean(profile.completed));
    
    // Parse photos and details
    const { results: photos } = await db.prepare(
      'SELECT url FROM profile_photos WHERE user_id = ? ORDER BY position ASC'
    ).bind(r.recommended_user_id).all<{ url: string }>();
    const photoUrls = photos.map(p => p.url);

    const { results: interests } = await db.prepare(
      'SELECT interest, weight FROM user_interests WHERE user_id = ?'
    ).bind(r.recommended_user_id).all<{ interest: string; weight: number }>();

    enrichedCandidates.push({
      id: r.recommended_user_id,
      score: r.score,
      explanation: JSON.parse(r.explanation || '[]'),
      trustScore: trust.trust_score,
      isVerified: trust.is_verified,
      updatedAt: profile.updated_at || new Date().toISOString(),
      profile: {
        fullName: profile.full_name || user?.full_name || '',
        age: profile.age || '',
        city: profile.city || '',
        gender: profile.gender || '',
        profession: profile.profession || '',
        college: profile.college || '',
        bio: profile.bio || '',
        vibe: profile.vibe || '',
        photo: photoUrls[0] || user?.avatar_url || '',
        photos: photoUrls,
        interests,
        trustMetrics: trust
      }
    });
  }

  // Fetch users who recently RSVP'd to events
  const { results: recentRSVPs } = await db.prepare(`
    SELECT DISTINCT user_id 
    FROM event_attendees 
    WHERE status = 'joined' 
    ORDER BY updated_at DESC
  `).all<{ user_id: string }>();
  const recentRSVPUserIds = new Set(recentRSVPs.map(r => r.user_id));

  // Fetch match demand for trending calculations
  const matchCounts = await db.prepare(`
    SELECT target_member_id, COUNT(*) as req_count 
    FROM matches 
    GROUP BY target_member_id
  `).all<{ target_member_id: string; req_count: number }>();
  const trendingMap = new Map(matchCounts.results.map(r => [r.target_member_id, r.req_count]));

  // --- Feed Diversity Logic ---
  // A set of assigned IDs to prevent duplication across feeds
  const assignedIds = new Set<string>();

  // Helper to filter and limit candidates
  const extractFeed = (
    filterFn: (cand: any) => boolean,
    sortFn?: (a: any, b: any) => number,
    limit = 8
  ): any[] => {
    let list = enrichedCandidates.filter(c => !assignedIds.has(c.id) && filterFn(c));
    if (sortFn) {
      list = [...list].sort(sortFn);
    }
    const result = list.slice(0, limit);
    for (const item of result) {
      assignedIds.add(item.id);
    }
    return result;
  };

  // 1. Highly Compatible Feed (Compatibility > 90)
  const highlyCompatible = extractFeed(
    c => c.score >= 90,
    (a, b) => b.score - a.score
  );

  // 2. Most Reliable Members (Highest trust score >= 80)
  const mostReliable = extractFeed(
    c => c.trustScore >= 80,
    (a, b) => b.trustScore - a.trustScore
  );

  // 3. Recently Attended Events Feed (Joined recent RSVPs)
  const recentlyAttended = extractFeed(
    c => recentRSVPUserIds.has(c.id)
  );

  // 4. Verified Members Feed (Trust verification)
  const verifiedMembers = extractFeed(
    c => c.isVerified === true
  );

  // 5. Near You Feed (Same city or close range score)
  const nearYou = extractFeed(
    c => c.profile.city && myProfile?.city && c.profile.city.trim().toLowerCase() === myProfile.city.trim().toLowerCase()
  );

  // 6. Trending Members Feed (High match requests)
  const trendingMembers = extractFeed(
    c => true, // default match-all for sorting
    (a, b) => (trendingMap.get(b.id) ?? 0) - (trendingMap.get(a.id) ?? 0)
  );

  return {
    highlyCompatible,
    mostReliable,
    recentlyAttended,
    verifiedMembers,
    nearYou,
    trendingMembers
  };
}
