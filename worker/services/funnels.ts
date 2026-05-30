import { D1Database } from '@cloudflare/workers-types';

export interface FunnelData {
  steps: {
    visitors: number;
    registered: number;
    profilesStarted: number;
    profilesCompleted: number;
    recommendationsViewed: number;
    matchRequestsSent: number;
    matchRequestsAccepted: number;
    chatsStarted: number;
    meetupsPlanned: number;
    meetupsCompleted: number;
  };
  rates: {
    profileCompletionRate: number;
    matchRequestRate: number;
    acceptanceRate: number;
    meetupCompletionRate: number;
  };
}

export async function getFunnelMetrics(db: D1Database): Promise<FunnelData> {
  // 1. Visitors (Distinct session_id in analytics_events)
  const visitorsResult = await db.prepare(
    "SELECT COUNT(DISTINCT session_id) as count FROM analytics_events"
  ).first<{ count: number }>();
  const visitors = visitorsResult?.count ?? 0;

  // 2. Users Registered (Total users)
  const usersResult = await db.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>();
  const registered = usersResult?.count ?? 0;

  // 3. Profiles Started (Total profiles created)
  const profilesStartedResult = await db.prepare(
    "SELECT COUNT(*) as count FROM profiles"
  ).first<{ count: number }>();
  const profilesStarted = profilesStartedResult?.count ?? 0;

  // 4. Profiles Completed (profiles where completed = 1)
  const profilesCompletedResult = await db.prepare(
    "SELECT COUNT(*) as count FROM profiles WHERE completed = 1"
  ).first<{ count: number }>();
  const profilesCompleted = profilesCompletedResult?.count ?? 0;

  // 5. Recommendations Viewed (Count of 'recommendations_viewed' events)
  const recsViewedResult = await db.prepare(
    "SELECT COUNT(*) as count FROM analytics_events WHERE event_name = 'recommendations_viewed'"
  ).first<{ count: number }>();
  const recommendationsViewed = recsViewedResult?.count ?? 0;

  // 6. Match Requests Sent (Total rows in matches)
  const matchesSentResult = await db.prepare("SELECT COUNT(*) as count FROM matches").first<{ count: number }>();
  const matchRequestsSent = matchesSentResult?.count ?? 0;

  // 7. Match Requests Accepted (Matches that reached 'accepted' or beyond)
  const matchesAcceptedResult = await db.prepare(
    "SELECT COUNT(*) as count FROM match_outcomes WHERE status IN ('accepted', 'chat_started', 'meetup_planned', 'meetup_completed')"
  ).first<{ count: number }>();
  const matchRequestsAccepted = matchesAcceptedResult?.count ?? 0;

  // 8. Chats Started (Total rows in chats)
  const chatsResult = await db.prepare("SELECT COUNT(*) as count FROM chats").first<{ count: number }>();
  const chatsStarted = chatsResult?.count ?? 0;

  // 9. Meetups Planned (Match outcomes with status 'meetup_planned' or 'meetup_completed')
  const meetupsPlannedResult = await db.prepare(
    "SELECT COUNT(*) as count FROM match_outcomes WHERE status IN ('meetup_planned', 'meetup_completed')"
  ).first<{ count: number }>();
  const meetupsPlanned = meetupsPlannedResult?.count ?? 0;

  // 10. Meetups Completed (Meetup feedbacks where showed_up = 1)
  const meetupsCompletedResult = await db.prepare(
    "SELECT COUNT(*) as count FROM meetup_feedback WHERE showed_up = 1"
  ).first<{ count: number }>();
  const meetupsCompleted = meetupsCompletedResult?.count ?? 0;

  // Rates calculations
  const profileCompletionRate = registered > 0 ? (profilesCompleted / registered) * 100 : 0;
  const matchRequestRate = profilesCompleted > 0 ? (matchRequestsSent / profilesCompleted) * 100 : 0;
  const acceptanceRate = matchRequestsSent > 0 ? (matchRequestsAccepted / matchRequestsSent) * 100 : 0;
  const meetupCompletionRate = meetupsPlanned > 0 ? (meetupsCompleted / meetupsPlanned) * 100 : 0;

  return {
    steps: {
      visitors,
      registered,
      profilesStarted,
      profilesCompleted,
      recommendationsViewed,
      matchRequestsSent,
      matchRequestsAccepted,
      chatsStarted,
      meetupsPlanned,
      meetupsCompleted
    },
    rates: {
      profileCompletionRate: Math.round(profileCompletionRate * 10) / 10,
      matchRequestRate: Math.round(matchRequestRate * 10) / 10,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      meetupCompletionRate: Math.round(meetupCompletionRate * 10) / 10
    }
  };
}
