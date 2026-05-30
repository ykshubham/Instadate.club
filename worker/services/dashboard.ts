import { D1Database } from '@cloudflare/workers-types';

export interface NorthStarMetrics {
  usersRegisteredToday: number;
  usersRegisteredThisWeek: number;
  usersRegisteredThisMonth: number;
  profilesCompleted: number;
  profileCompletionRate: number;
  recommendationsViewed: number;
  matchRequestsSent: number;
  matchRequestsAccepted: number;
  matchAcceptanceRate: number;
  chatsStarted: number;
  messagesSent: number;
  meetupsPlanned: number;
  meetupsCompleted: number;
  meetupCompletionRate: number;
  noShows: number;
  noShowRate: number;
  eventRSVPs: number;
  eventAttendance: number;
  eventAttendanceRate: number;
  instantPlansCreated: number;
  instantPlansJoined: number;
}

export interface MatchQualityMetrics {
  recommendationsGenerated: number;
  recommendationsViewed: number;
  profileViews: number;
  matchRequestsSent: number;
  matchRequestsAccepted: number;
  chatsStarted: number;
  meetupsPlanned: number;
  meetupsCompleted: number;
  recommendationToMeetupRate: number;
  matchToMeetupRate: number;
  recommendationToChatRate: number;
  acceptanceRate: number;
  completionRate: number;
}

export interface EventQualityMetrics {
  id: string;
  title: string;
  type: string;
  hostName: string;
  views: number;
  rsvps: number;
  attendance: number;
  attendanceRate: number;
  noShows: number;
  hostTrustScore: number;
  averageAttendeeTrustScore: number;
  eventQualityScore: number;
}

export interface TrustMetricsSummary {
  attendanceRate: number;
  noShowRate: number;
  averageResponseRate: number;
  meetupCompletionRate: number;
  verifiedUsersRate: number;
  trustScoreDistribution: {
    excellent: number; // 90-100
    good: number;      // 70-89
    fair: number;      // 50-69
    poor: number;      // <50
  };
  topReliableMembers: any[];
  lowestReliabilityMembers: any[];
  highestAttendanceMembers: any[];
  mostSuccessfulHosts: any[];
}

export interface RealWorldSuccessMetrics {
  connectionsCreated: number;
  meetupsPlanned: number;
  meetupsCompleted: number;
  meetupCompletionRate: number;
  wouldMeetAgainRate: number;
  attendanceRate: number;
  noShowRate: number;
  averageReliabilityScore: number;
  averageTrustScore: number;
}

export async function getDashboardAnalytics(db: D1Database): Promise<{
  northStar: NorthStarMetrics;
  matchQuality: MatchQualityMetrics;
  eventQuality: { best: EventQualityMetrics[]; worst: EventQualityMetrics[] };
  trustAnalytics: TrustMetricsSummary;
  realWorldSuccess: RealWorldSuccessMetrics;
}> {
  // --- North Star Dashboard ---
  const usersToday = await db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE date(created_at) = date('now')"
  ).first<{ count: number }>();
  
  const usersWeek = await db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE date(created_at) >= date('now', 'weekday 0', '-6 days')"
  ).first<{ count: number }>();
  
  const usersMonth = await db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')"
  ).first<{ count: number }>();
  
  const totalUsers = await db.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>();
  const regCount = totalUsers?.count ?? 0;

  const profilesComp = await db.prepare("SELECT COUNT(*) as count FROM profiles WHERE completed = 1").first<{ count: number }>();
  const compCount = profilesComp?.count ?? 0;

  const recsViewed = await db.prepare(
    "SELECT COUNT(*) as count FROM analytics_events WHERE event_name = 'recommendations_viewed'"
  ).first<{ count: number }>();

  const matchesSent = await db.prepare("SELECT COUNT(*) as count FROM matches").first<{ count: number }>();
  const sentMatches = matchesSent?.count ?? 0;

  const matchesAccepted = await db.prepare(
    "SELECT COUNT(*) as count FROM match_outcomes WHERE status IN ('accepted', 'chat_started', 'meetup_planned', 'meetup_completed')"
  ).first<{ count: number }>();
  const acceptedMatches = matchesAccepted?.count ?? 0;

  const chatsStarted = await db.prepare("SELECT COUNT(*) as count FROM chats").first<{ count: number }>();

  const messagesSent = await db.prepare("SELECT COUNT(*) as count FROM chat_messages WHERE sender_role = 'you'").first<{ count: number }>();

  const meetupsPlanned = await db.prepare(
    "SELECT COUNT(*) as count FROM match_outcomes WHERE status IN ('meetup_planned', 'meetup_completed')"
  ).first<{ count: number }>();
  const plannedMeetups = meetupsPlanned?.count ?? 0;

  const meetupsCompleted = await db.prepare(
    "SELECT COUNT(*) as count FROM meetup_feedback WHERE showed_up = 1"
  ).first<{ count: number }>();
  const completedMeetups = meetupsCompleted?.count ?? 0;

  const noShowsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM no_show_logs"
  ).first<{ count: number }>();
  const noShows = noShowsResult?.count ?? 0;

  const eventRSVPsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM event_attendees WHERE status = 'joined'"
  ).first<{ count: number }>();
  const eventRSVPs = eventRSVPsResult?.count ?? 0;

  const eventNoShowsResult = await db.prepare(
    "SELECT COUNT(*) as count FROM no_show_logs WHERE event_id IS NOT NULL"
  ).first<{ count: number }>();
  const eventNoShows = eventNoShowsResult?.count ?? 0;
  const eventAttendance = Math.max(0, eventRSVPs - eventNoShows);

  const instantPlansCreatedResult = await db.prepare("SELECT COUNT(*) as count FROM instant_plans").first<{ count: number }>();
  const instantPlansJoinedResult = await db.prepare("SELECT COUNT(*) as count FROM instant_plan_members").first<{ count: number }>();

  // Helper rates
  const profileCompletionRate = regCount > 0 ? (compCount / regCount) * 100 : 0;
  const matchAcceptanceRate = sentMatches > 0 ? (acceptedMatches / sentMatches) * 100 : 0;
  const meetupCompletionRate = plannedMeetups > 0 ? (completedMeetups / plannedMeetups) * 100 : 0;
  
  const totalMeetupFeedbacks = await db.prepare("SELECT COUNT(*) as count FROM meetup_feedback").first<{ count: number }>();
  const feedbackCount = totalMeetupFeedbacks?.count ?? 0;
  const noShowRate = feedbackCount > 0 ? (noShows / feedbackCount) * 100 : 0;
  const eventAttendanceRate = eventRSVPs > 0 ? (eventAttendance / eventRSVPs) * 100 : 0;

  const northStar: NorthStarMetrics = {
    usersRegisteredToday: usersToday?.count ?? 0,
    usersRegisteredThisWeek: usersWeek?.count ?? 0,
    usersRegisteredThisMonth: usersMonth?.count ?? 0,
    profilesCompleted: compCount,
    profileCompletionRate: Math.round(profileCompletionRate * 10) / 10,
    recommendationsViewed: recsViewed?.count ?? 0,
    matchRequestsSent: sentMatches,
    matchRequestsAccepted: acceptedMatches,
    matchAcceptanceRate: Math.round(matchAcceptanceRate * 10) / 10,
    chatsStarted: chatsStarted?.count ?? 0,
    messagesSent: messagesSent?.count ?? 0,
    meetupsPlanned: plannedMeetups,
    meetupsCompleted: completedMeetups,
    meetupCompletionRate: Math.round(meetupCompletionRate * 10) / 10,
    noShows,
    noShowRate: Math.round(noShowRate * 10) / 10,
    eventRSVPs,
    eventAttendance,
    eventAttendanceRate: Math.round(eventAttendanceRate * 10) / 10,
    instantPlansCreated: instantPlansCreatedResult?.count ?? 0,
    instantPlansJoined: instantPlansJoinedResult?.count ?? 0
  };

  // --- Match Quality Dashboard ---
  const recsGenerated = await db.prepare("SELECT COUNT(*) as count FROM recommended_users").first<{ count: number }>();
  const profileViews = await db.prepare(
    "SELECT COUNT(*) as count FROM analytics_events WHERE event_name = 'member_profile_viewed'"
  ).first<{ count: number }>();

  const matchQuality: MatchQualityMetrics = {
    recommendationsGenerated: recsGenerated?.count ?? 0,
    recommendationsViewed: recsViewed?.count ?? 0,
    profileViews: profileViews?.count ?? 0,
    matchRequestsSent: sentMatches,
    matchRequestsAccepted: acceptedMatches,
    chatsStarted: chatsStarted?.count ?? 0,
    meetupsPlanned: plannedMeetups,
    meetupsCompleted: completedMeetups,
    recommendationToMeetupRate: recsGenerated?.count && recsGenerated.count > 0 ? Math.round((completedMeetups / recsGenerated.count) * 1000) / 10 : 0,
    matchToMeetupRate: sentMatches > 0 ? Math.round((completedMeetups / sentMatches) * 1000) / 10 : 0,
    recommendationToChatRate: recsGenerated?.count && recsGenerated.count > 0 ? Math.round(((chatsStarted?.count ?? 0) / recsGenerated.count) * 1000) / 10 : 0,
    acceptanceRate: Math.round(matchAcceptanceRate * 10) / 10,
    completionRate: Math.round(meetupCompletionRate * 10) / 10
  };

  // --- Event Quality Dashboard ---
  const { results: rawEvents } = await db.prepare(`
    SELECT e.id, e.title, e.type, u.full_name AS host_name, e.host_user_id
    FROM events e
    JOIN users u ON e.host_user_id = u.id
    WHERE e.deleted_at IS NULL
  `).all();

  const eventsMetrics: EventQualityMetrics[] = [];
  for (const e of rawEvents) {
    const views = await db.prepare(
      "SELECT COUNT(*) as count FROM analytics_events WHERE event_name = 'event_viewed' AND entity_id = ?"
    ).bind(e.id).first<{ count: number }>();

    const rsvps = await db.prepare(
      "SELECT COUNT(*) as count FROM event_attendees WHERE event_id = ? AND status = 'joined'"
    ).bind(e.id).first<{ count: number }>();

    const noShows = await db.prepare(
      "SELECT COUNT(*) as count FROM no_show_logs WHERE event_id = ?"
    ).bind(e.id).first<{ count: number }>();

    const hostTrust = await db.prepare(
      "SELECT trust_score FROM trust_metrics WHERE user_id = ?"
    ).bind(e.host_user_id).first<{ trust_score: number }>();

    const attendeesTrust = await db.prepare(`
      SELECT AVG(tm.trust_score) as avg_score 
      FROM event_attendees ea
      JOIN trust_metrics tm ON ea.user_id = tm.user_id
      WHERE ea.event_id = ? AND ea.status = 'joined'
    `).bind(e.id).first<{ avg_score: number }>();

    const rsvpVal = rsvps?.count ?? 0;
    const noShowVal = noShows?.count ?? 0;
    const viewVal = views?.count ?? 0;
    const attendVal = Math.max(0, rsvpVal - noShowVal);
    const attRate = rsvpVal > 0 ? (attendVal / rsvpVal) * 100 : 100;

    // Quality Score Formula: Views (10%) + RSVPs (40%) + Attendance Rate (50%)
    const popularity = Math.min(100, viewVal * 5 + rsvpVal * 15);
    const qualityScore = Math.round((popularity * 0.4 + attRate * 0.6) * 10) / 10;

    eventsMetrics.push({
      id: e.id as string,
      title: e.title as string,
      type: e.type as string,
      hostName: e.host_name as string,
      views: viewVal,
      rsvps: rsvpVal,
      attendance: attendVal,
      attendanceRate: Math.round(attRate * 10) / 10,
      noShows: noShowVal,
      hostTrustScore: Math.round(Number(hostTrust?.trust_score ?? 75) * 10) / 10,
      averageAttendeeTrustScore: Math.round(Number(attendeesTrust?.avg_score ?? 75) * 10) / 10,
      eventQualityScore: qualityScore
    });
  }

  // Sort best and worst
  const sortedEvents = [...eventsMetrics].sort((a, b) => b.eventQualityScore - a.eventQualityScore);
  const bestEvents = sortedEvents.slice(0, 10);
  const worstEvents = [...sortedEvents].reverse().slice(0, 10);

  // --- Trust Analytics ---
  const trustMetrics = await db.prepare("SELECT * FROM trust_metrics").all<any>();
  const totalTrustRows = trustMetrics.results.length;

  let totalAttendanceScore = 0;
  let totalNoShowCount = 0;
  let totalAttendedCount = 0;
  let totalResponseRate = 0;
  let verifiedCount = 0;

  const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };

  for (const row of trustMetrics.results) {
    totalAttendanceScore += Number(row.attendance_score ?? 100);
    totalNoShowCount += Number(row.no_show_count ?? 0);
    totalAttendedCount += Number(row.attended_count ?? 0);
    totalResponseRate += Number(row.response_rate ?? 100);
    if (row.is_verified === 1) verifiedCount++;

    const score = Number(row.trust_score ?? 75);
    if (score >= 90) distribution.excellent++;
    else if (score >= 70) distribution.good++;
    else if (score >= 50) distribution.fair++;
    else distribution.poor++;
  }

  const avgAttendance = totalTrustRows > 0 ? totalAttendanceScore / totalTrustRows : 100;
  const avgNoShow = totalAttendedCount + totalNoShowCount > 0 
    ? (totalNoShowCount / (totalAttendedCount + totalNoShowCount)) * 100 
    : 0;
  const avgResponse = totalTrustRows > 0 ? totalResponseRate / totalTrustRows : 100;
  const verifiedRate = totalUsers?.count && totalUsers.count > 0 ? (verifiedCount / totalUsers.count) * 100 : 0;

  // Top Members
  const { results: topReliable } = await db.prepare(`
    SELECT tm.*, u.full_name, u.avatar_url 
    FROM trust_metrics tm
    JOIN users u ON tm.user_id = u.id
    ORDER BY tm.trust_score DESC, tm.attended_count DESC
    LIMIT 5
  `).all<any>();

  const { results: lowestReliable } = await db.prepare(`
    SELECT tm.*, u.full_name, u.avatar_url 
    FROM trust_metrics tm
    JOIN users u ON tm.user_id = u.id
    ORDER BY tm.trust_score ASC, tm.no_show_count DESC
    LIMIT 5
  `).all<any>();

  const { results: highestAttendance } = await db.prepare(`
    SELECT tm.*, u.full_name, u.avatar_url 
    FROM trust_metrics tm
    JOIN users u ON tm.user_id = u.id
    ORDER BY tm.attended_count DESC
    LIMIT 5
  `).all<any>();

  const { results: mostSuccessfulHosts } = await db.prepare(`
    SELECT tm.*, u.full_name, u.avatar_url, COUNT(e.id) as events_hosted
    FROM trust_metrics tm
    JOIN users u ON tm.user_id = u.id
    JOIN events e ON e.host_user_id = u.id
    WHERE e.deleted_at IS NULL
    GROUP BY tm.user_id
    ORDER BY tm.trust_score DESC, events_hosted DESC
    LIMIT 5
  `).all<any>();

  const trustAnalytics: TrustMetricsSummary = {
    attendanceRate: Math.round(avgAttendance * 10) / 10,
    noShowRate: Math.round(avgNoShow * 10) / 10,
    averageResponseRate: Math.round(avgResponse * 10) / 10,
    meetupCompletionRate: Math.round(meetupCompletionRate * 10) / 10,
    verifiedUsersRate: Math.round(verifiedRate * 10) / 10,
    trustScoreDistribution: distribution,
    topReliableMembers: topReliable,
    lowestReliabilityMembers: lowestReliable,
    highestAttendanceMembers: highestAttendance,
    mostSuccessfulHosts: mostSuccessfulHosts
  };

  // --- Real-World Success Metrics ---
  const wouldMeetAgainCount = await db.prepare(
    "SELECT COUNT(*) as count FROM meetup_feedback WHERE meet_again = 1"
  ).first<{ count: number }>();
  
  const avgTrustScoreResult = await db.prepare(
    "SELECT AVG(trust_score) as avg_score FROM trust_metrics"
  ).first<{ avg_score: number }>();
  
  const avgReliabilityResult = await db.prepare(
    "SELECT AVG(attendance_score) as avg_score FROM trust_metrics"
  ).first<{ avg_score: number }>();

  const realWorldSuccess: RealWorldSuccessMetrics = {
    connectionsCreated: acceptedMatches,
    meetupsPlanned: plannedMeetups,
    meetupsCompleted: completedMeetups,
    meetupCompletionRate: Math.round(meetupCompletionRate * 10) / 10,
    wouldMeetAgainRate: completedMeetups > 0 ? Math.round(((wouldMeetAgainCount?.count ?? 0) / completedMeetups) * 1000) / 10 : 0,
    attendanceRate: Math.round(avgAttendance * 10) / 10,
    noShowRate: Math.round(avgNoShow * 10) / 10,
    averageReliabilityScore: Math.round(Number(avgReliabilityResult?.avg_score ?? 100) * 10) / 10,
    averageTrustScore: Math.round(Number(avgTrustScoreResult?.avg_score ?? 75) * 10) / 10
  };

  return {
    northStar,
    matchQuality,
    eventQuality: { best: bestEvents, worst: worstEvents },
    trustAnalytics,
    realWorldSuccess
  };
}
