import { D1Database } from '@cloudflare/workers-types';
import { getOrGenerateRecommendationsV2 } from './recommendations';
import { visibleUserIds } from '../visibility';
import { extractWeekendTags } from './compatibility';

export async function getDiscoveryMembersV2(db: D1Database, userId: string) {
  // 1. Fetch master recommendations list
  const recs = await getOrGenerateRecommendationsV2(db, userId);
  
  // 2. Visibility guard: drop blocked, rejected, self, and non-active accounts
  const visible = await visibleUserIds(db, userId, recs.map(r => r.recommended_user_id));

  // Filter visible candidates
  const visibleRecs = recs.filter(r => visible.has(r.recommended_user_id));
  const candidateIds = visibleRecs.map(r => r.recommended_user_id);

  const enrichedCandidates: any[] = [];
  const myProfile = await db.prepare('SELECT * FROM profiles WHERE user_id = ?').bind(userId).first<any>();

  if (candidateIds.length > 0) {
    const placeholders = candidateIds.map(() => '?').join(',');

    // 3. Batched Enrichment: Query profiles, users, photos, interests, and trust in parallel
    const [profilesRes, usersRes, photosRes, interestsRes, trustRes] = await Promise.all([
      db.prepare(`SELECT * FROM profiles WHERE user_id IN (${placeholders})`).bind(...candidateIds).all<any>(),
      db.prepare(`SELECT id, email, avatar_url, full_name FROM users WHERE id IN (${placeholders})`).bind(...candidateIds).all<any>(),
      db.prepare(`SELECT user_id, url, position FROM profile_photos WHERE user_id IN (${placeholders}) ORDER BY position ASC`).bind(...candidateIds).all<any>(),
      db.prepare(`SELECT user_id, interest, weight FROM user_interests WHERE user_id IN (${placeholders})`).bind(...candidateIds).all<any>(),
      db.prepare(`SELECT * FROM trust_metrics WHERE user_id IN (${placeholders})`).bind(...candidateIds).all<any>()
    ]);

    // 4. Map results into dictionaries for O(1) in-memory lookup
    const profilesMap = new Map(profilesRes.results.map(p => [p.user_id, p]));
    const usersMap = new Map(usersRes.results.map(u => [u.id, u]));
    const trustMap = new Map(trustRes.results.map(t => [t.user_id, t]));

    const photosMap = new Map<string, string[]>();
    for (const photo of photosRes.results) {
      if (!photosMap.has(photo.user_id)) {
        photosMap.set(photo.user_id, []);
      }
      photosMap.get(photo.user_id)!.push(photo.url);
    }

    const interestsMap = new Map<string, Array<{ interest: string; weight: number }>>();
    for (const item of interestsRes.results) {
      if (!interestsMap.has(item.user_id)) {
        interestsMap.set(item.user_id, []);
      }
      interestsMap.get(item.user_id)!.push({ interest: item.interest, weight: item.weight });
    }

    // 5. Assemble candidates with O(1) lookups
    for (const r of visibleRecs) {
      const cId = r.recommended_user_id;
      const profile = profilesMap.get(cId);
      if (!profile) continue;

      const user = usersMap.get(cId);
      const photoUrls = photosMap.get(cId) || [];
      const interests = interestsMap.get(cId) || [];
      
      const trust = trustMap.get(cId) || {
        trust_score: 90.0,
        is_verified: profile.verification_level !== 'none' ? 1 : 0,
        attended_count: 0,
        no_show_count: 0,
        response_rate: 100.0
      };

      enrichedCandidates.push({
        id: cId,
        score: r.score,
        explanation: JSON.parse(r.explanation || '[]'),
        trustScore: trust.trust_score,
        isVerified: Number(trust.is_verified) === 1,
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
          trustMetrics: trust,
          phone_verified: profile.phone_verified,
          instagram_verified: profile.instagram_verified,
          profile_verified: profile.profile_verified,
          verification_level: profile.verification_level,
          weekendStatus: profile.weekend_status || '',
          weekendTags: extractWeekendTags(profile.weekend_status)
        }
      });
    }
  }

  // Fetch users who recently RSVP'd to events
  const { results: recentRSVPs } = await db.prepare(`
    SELECT DISTINCT user_id 
    FROM event_attendees 
    WHERE status = 'joined' 
    ORDER BY updated_at DESC
    LIMIT 20
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
  const assignedIds = new Set<string>();

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

  // 1. Top Matches Feed — the highest-scoring available candidates.
  // (Recommendations are already floored at score >= 40 upstream, so every
  // candidate here is a reasonable match. An absolute >= 90 gate left this feed —
  // the default "Top Matches" tab — almost always empty, since reaching 90 needs
  // near-perfect alignment across all engines simultaneously.)
  const highlyCompatible = extractFeed(
    c => true,
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
    c => true,
    (a, b) => (trendingMap.get(b.id) ?? 0) - (trendingMap.get(a.id) ?? 0)
  );

  return {
    highlyCompatible,
    mostReliable,
    recentlyAttended,
    verifiedMembers,
    nearYou,
    trendingMembers,
    // Frontend compatibility mapping
    topMatches: highlyCompatible,
    similarVibes: mostReliable,
    activeMembers: recentlyAttended,
    newMembers: verifiedMembers
  };
}
