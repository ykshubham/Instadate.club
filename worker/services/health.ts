import { D1Database } from '@cloudflare/workers-types';

export interface HealthFunnelStep {
  name: string;
  count: number;
  conversion: number; // % of registered
  dropoff: number;    // % dropoff from previous step
}

export interface RecommendationSourceMetrics {
  source: string;
  impressions: number;
  clicks: number;
  views: number;
  requests: number;
  accepts: number;
  meetups: number;
  ctr: number;        // Click-through rate %
  requestRate: number;// Request rate %
  acceptRate: number; // Acceptance rate %
  meetupRate: number; // Meetup rate %
}

export async function getCompanyHealthMetrics(db: D1Database): Promise<any> {
  // -------------------------------------------------------------
  // FUNNEL CALCULATION
  // -------------------------------------------------------------
  const totalUsersRow = await db.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>();
  const totalUsers = totalUsersRow?.count ?? 0;

  const profilesCompletedRow = await db.prepare("SELECT COUNT(*) as count FROM profiles WHERE completed = 1").first<{ count: number }>();
  const profilesCompleted = profilesCompletedRow?.count ?? 0;

  const recsViewedRow = await db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_name = 'recommendations_viewed' OR event_name = 'recommendation_impression'").first<{ count: number }>();
  const recsViewed = recsViewedRow?.count ?? 0;

  const profileViewsRow = await db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_name = 'member_profile_viewed'").first<{ count: number }>();
  const profileViews = profileViewsRow?.count ?? 0;

  const requestsSentRow = await db.prepare("SELECT COUNT(*) as count FROM matches").first<{ count: number }>();
  const requestsSent = requestsSentRow?.count ?? 0;

  const requestsAcceptedRow = await db.prepare("SELECT COUNT(*) as count FROM match_outcomes WHERE status IN ('accepted', 'chat_started', 'meetup_planned', 'meetup_completed')").first<{ count: number }>();
  const requestsAccepted = requestsAcceptedRow?.count ?? 0;

  const chatsStartedRow = await db.prepare("SELECT COUNT(*) as count FROM chats").first<{ count: number }>();
  const chatsStarted = chatsStartedRow?.count ?? 0;

  const meetupsPlannedRow = await db.prepare("SELECT COUNT(*) as count FROM match_outcomes WHERE status IN ('meetup_planned', 'meetup_completed')").first<{ count: number }>();
  const meetupsPlanned = meetupsPlannedRow?.count ?? 0;

  const meetupsCompletedRow = await db.prepare("SELECT COUNT(*) as count FROM meetup_feedback WHERE showed_up = 1").first<{ count: number }>();
  const meetupsCompleted = meetupsCompletedRow?.count ?? 0;

  const funnelSteps: HealthFunnelStep[] = [
    { name: 'Users Registered', count: totalUsers, conversion: 100, dropoff: 0 },
    {
      name: 'Profiles Completed',
      count: profilesCompleted,
      conversion: totalUsers > 0 ? Math.round((profilesCompleted / totalUsers) * 1000) / 10 : 0,
      dropoff: totalUsers > 0 ? Math.round((1 - profilesCompleted / totalUsers) * 1000) / 10 : 0
    },
    {
      name: 'Recommendations Viewed',
      count: recsViewed,
      conversion: totalUsers > 0 ? Math.round((recsViewed / totalUsers) * 1000) / 10 : 0,
      dropoff: profilesCompleted > 0 ? Math.round(Math.max(0, 1 - recsViewed / profilesCompleted) * 1000) / 10 : 0
    },
    {
      name: 'Profile Views',
      count: profileViews,
      conversion: totalUsers > 0 ? Math.round((profileViews / totalUsers) * 1000) / 10 : 0,
      dropoff: recsViewed > 0 ? Math.round(Math.max(0, 1 - profileViews / recsViewed) * 1000) / 10 : 0
    },
    {
      name: 'Match Requests Sent',
      count: requestsSent,
      conversion: totalUsers > 0 ? Math.round((requestsSent / totalUsers) * 1000) / 10 : 0,
      dropoff: profileViews > 0 ? Math.round(Math.max(0, 1 - requestsSent / profileViews) * 1000) / 10 : 0
    },
    {
      name: 'Match Requests Accepted',
      count: requestsAccepted,
      conversion: totalUsers > 0 ? Math.round((requestsAccepted / totalUsers) * 1000) / 10 : 0,
      dropoff: requestsSent > 0 ? Math.round(Math.max(0, 1 - requestsAccepted / requestsSent) * 1000) / 10 : 0
    },
    {
      name: 'Chats Started',
      count: chatsStarted,
      conversion: totalUsers > 0 ? Math.round((chatsStarted / totalUsers) * 1000) / 10 : 0,
      dropoff: requestsAccepted > 0 ? Math.round(Math.max(0, 1 - chatsStarted / requestsAccepted) * 1000) / 10 : 0
    },
    {
      name: 'Meetups Planned',
      count: meetupsPlanned,
      conversion: totalUsers > 0 ? Math.round((meetupsPlanned / totalUsers) * 1000) / 10 : 0,
      dropoff: chatsStarted > 0 ? Math.round(Math.max(0, 1 - meetupsPlanned / chatsStarted) * 1000) / 10 : 0
    },
    {
      name: 'Meetups Completed',
      count: meetupsCompleted,
      conversion: totalUsers > 0 ? Math.round((meetupsCompleted / totalUsers) * 1000) / 10 : 0,
      dropoff: meetupsPlanned > 0 ? Math.round(Math.max(0, 1 - meetupsCompleted / meetupsPlanned) * 1000) / 10 : 0
    }
  ];

  // -------------------------------------------------------------
  // SECTION 1: USER ACQUISITION
  // -------------------------------------------------------------
  const signupsTodayRow = await db.prepare("SELECT COUNT(*) as count FROM users WHERE date(created_at) = date('now')").first<{ count: number }>();
  const signupsToday = signupsTodayRow?.count ?? 0;

  const signupsYesterdayRow = await db.prepare("SELECT COUNT(*) as count FROM users WHERE date(created_at) = date('now', '-1 day')").first<{ count: number }>();
  const signupsYesterday = signupsYesterdayRow?.count ?? 0;

  const signupsThisWeekRow = await db.prepare("SELECT COUNT(*) as count FROM users WHERE date(created_at) >= date('now', '-7 days')").first<{ count: number }>();
  const signupsThisWeek = signupsThisWeekRow?.count ?? 0;

  const signupsPriorWeekRow = await db.prepare("SELECT COUNT(*) as count FROM users WHERE date(created_at) >= date('now', '-14 days') AND date(created_at) < date('now', '-7 days')").first<{ count: number }>();
  const signupsPriorWeek = signupsPriorWeekRow?.count ?? 0;

  const signupsThisMonthRow = await db.prepare("SELECT COUNT(*) as count FROM users WHERE date(created_at) >= date('now', '-30 days')").first<{ count: number }>();
  const signupsThisMonth = signupsThisMonthRow?.count ?? 0;

  const signupsPriorMonthRow = await db.prepare("SELECT COUNT(*) as count FROM users WHERE date(created_at) >= date('now', '-60 days') AND date(created_at) < date('now', '-30 days')").first<{ count: number }>();
  const signupsPriorMonth = signupsPriorMonthRow?.count ?? 0;

  const dailyGrowth = signupsYesterday > 0 ? Math.round(((signupsToday - signupsYesterday) / signupsYesterday) * 100) : 0;
  const weeklyGrowth = signupsPriorWeek > 0 ? Math.round(((signupsThisWeek - signupsPriorWeek) / signupsPriorWeek) * 100) : 0;
  const monthlyGrowth = signupsPriorMonth > 0 ? Math.round(((signupsThisMonth - signupsPriorMonth) / signupsPriorMonth) * 100) : 0;

  // -------------------------------------------------------------
  // SECTION 2: PROFILE ACTIVATION
  // -------------------------------------------------------------
  const profilesStartedRow = await db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_name = 'profile_started'").first<{ count: number }>();
  const profilesStarted = profilesStartedRow?.count ?? 0;

  const avgCompletionTimeRow = await db.prepare(`
    SELECT AVG(strftime('%s', comp.created_at) - strftime('%s', start.created_at)) AS avg_seconds
    FROM analytics_events start
    JOIN analytics_events comp ON start.user_id = comp.user_id
    WHERE start.event_name = 'profile_started' AND comp.event_name = 'profile_completed'
  `).first<{ avg_seconds: number }>();
  
  const avgCompletionSeconds = avgCompletionTimeRow?.avg_seconds ?? 0;
  let completionTimeText = 'N/A';
  if (avgCompletionSeconds > 0) {
    const mins = Math.floor(avgCompletionSeconds / 60);
    if (mins < 60) {
      completionTimeText = `${mins}m`;
    } else {
      const hrs = Math.round((mins / 60) * 10) / 10;
      completionTimeText = `${hrs}h`;
    }
  }

  // -------------------------------------------------------------
  // SECTION 4: NORTH STAR & connection trends
  // -------------------------------------------------------------
  // Formulas: Meetups Completed / Registered Users * 100
  // Trends: Daily, Weekly, Monthly, All Time
  
  // A. All-time
  const northStarAllTime = totalUsers > 0 ? Math.round((meetupsCompleted / totalUsers) * 100 * 100) / 100 : 0;
  
  const usersPrior30dRow = await db.prepare("SELECT COUNT(*) as count FROM users WHERE datetime(created_at) < datetime('now', '-30 days')").first<{ count: number }>();
  const usersPrior30d = usersPrior30dRow?.count ?? 0;
  const meetupsPrior30dRow = await db.prepare("SELECT COUNT(*) as count FROM meetup_feedback WHERE showed_up = 1 AND datetime(created_at) < datetime('now', '-30 days')").first<{ count: number }>();
  const meetupsPrior30d = meetupsPrior30dRow?.count ?? 0;
  const northStarPriorAllTime = usersPrior30d > 0 ? Math.round((meetupsPrior30d / usersPrior30d) * 100 * 100) / 100 : 0;
  const allTimeNsGrowth = northStarPriorAllTime > 0 ? Math.round(((northStarAllTime - northStarPriorAllTime) / northStarPriorAllTime) * 100) : 0;

  // B. Monthly (past 30 days vs prior 30 days)
  const meetupsMonthlyRow = await db.prepare("SELECT COUNT(*) as count FROM meetup_feedback WHERE showed_up = 1 AND datetime(created_at) >= datetime('now', '-30 days')").first<{ count: number }>();
  const meetupsMonthly = meetupsMonthlyRow?.count ?? 0;
  const northStarMonthly = totalUsers > 0 ? Math.round((meetupsMonthly / totalUsers) * 100 * 100) / 100 : 0;

  const meetupsPriorMonthlyRow = await db.prepare("SELECT COUNT(*) as count FROM meetup_feedback WHERE showed_up = 1 AND datetime(created_at) >= datetime('now', '-60 days') AND datetime(created_at) < datetime('now', '-30 days')").first<{ count: number }>();
  const meetupsPriorMonthly = meetupsPriorMonthlyRow?.count ?? 0;
  const northStarPriorMonthly = usersPrior30d > 0 ? Math.round((meetupsPriorMonthly / usersPrior30d) * 100 * 100) / 100 : 0;
  const monthlyNsGrowth = northStarPriorMonthly > 0 ? Math.round(((northStarMonthly - northStarPriorMonthly) / northStarPriorMonthly) * 100) : 0;

  // C. Weekly (past 7 days vs prior 7 days)
  const meetupsWeeklyRow = await db.prepare("SELECT COUNT(*) as count FROM meetup_feedback WHERE showed_up = 1 AND datetime(created_at) >= datetime('now', '-7 days')").first<{ count: number }>();
  const meetupsWeekly = meetupsWeeklyRow?.count ?? 0;
  const northStarWeekly = totalUsers > 0 ? Math.round((meetupsWeekly / totalUsers) * 100 * 100) / 100 : 0;

  const meetupsPriorWeeklyRow = await db.prepare("SELECT COUNT(*) as count FROM meetup_feedback WHERE showed_up = 1 AND datetime(created_at) >= datetime('now', '-14 days') AND datetime(created_at) < datetime('now', '-7 days')").first<{ count: number }>();
  const meetupsPriorWeekly = meetupsPriorWeeklyRow?.count ?? 0;
  const usersPrior7dRow = await db.prepare("SELECT COUNT(*) as count FROM users WHERE datetime(created_at) < datetime('now', '-7 days')").first<{ count: number }>();
  const usersPrior7d = usersPrior7dRow?.count ?? 0;
  const northStarPriorWeekly = usersPrior7d > 0 ? Math.round((meetupsPriorWeekly / usersPrior7d) * 100 * 100) / 100 : 0;
  const weeklyNsGrowth = northStarPriorWeekly > 0 ? Math.round(((northStarWeekly - northStarPriorWeekly) / northStarPriorWeekly) * 100) : 0;

  // D. Daily (today vs yesterday)
  const meetupsDailyRow = await db.prepare("SELECT COUNT(*) as count FROM meetup_feedback WHERE showed_up = 1 AND datetime(created_at) >= datetime('now', '-1 day')").first<{ count: number }>();
  const meetupsDaily = meetupsDailyRow?.count ?? 0;
  const northStarDaily = totalUsers > 0 ? Math.round((meetupsDaily / totalUsers) * 100 * 100) / 100 : 0;

  const meetupsPriorDailyRow = await db.prepare("SELECT COUNT(*) as count FROM meetup_feedback WHERE showed_up = 1 AND datetime(created_at) >= datetime('now', '-2 days') AND datetime(created_at) < datetime('now', '-1 day')").first<{ count: number }>();
  const meetupsPriorDaily = meetupsPriorDailyRow?.count ?? 0;
  const usersPrior1dRow = await db.prepare("SELECT COUNT(*) as count FROM users WHERE datetime(created_at) < datetime('now', '-1 day')").first<{ count: number }>();
  const usersPrior1d = usersPrior1dRow?.count ?? 0;
  const northStarPriorDaily = usersPrior1d > 0 ? Math.round((meetupsPriorDaily / usersPrior1d) * 100 * 100) / 100 : 0;
  const dailyNsGrowth = northStarPriorDaily > 0 ? Math.round(((northStarDaily - northStarPriorDaily) / northStarPriorDaily) * 100) : 0;

  // -------------------------------------------------------------
  // SECTION 5: TRUST HEALTH
  // -------------------------------------------------------------
  const verifiedCountRow = await db.prepare("SELECT COUNT(*) as count FROM trust_metrics WHERE is_verified = 1").first<{ count: number }>();
  const verifiedCount = verifiedCountRow?.count ?? 0;

  const trustStatsRow = await db.prepare(`
    SELECT AVG(attendance_score) as avg_attendance,
           AVG(trust_score) as avg_trust,
           SUM(attended_count) as total_attended,
           SUM(no_show_count) as total_noshows
    FROM trust_metrics
  `).first<{ avg_attendance: number; avg_trust: number; total_attended: number; total_noshows: number }>();

  const avgAttendance = trustStatsRow?.avg_attendance ?? 100;
  const avgTrustScore = trustStatsRow?.avg_trust ?? 75;
  const totalAttended = trustStatsRow?.total_attended ?? 0;
  const totalNoshows = trustStatsRow?.total_noshows ?? 0;
  const noShowRate = totalAttended + totalNoshows > 0 ? (totalNoshows / (totalAttended + totalNoshows)) * 100 : 0;

  const topReliable = (await db.prepare(`
    SELECT tm.trust_score, tm.attended_count, u.full_name, u.avatar_url
    FROM trust_metrics tm
    JOIN users u ON tm.user_id = u.id
    ORDER BY tm.trust_score DESC, tm.attended_count DESC
    LIMIT 5
  `).all<any>()).results;

  const lowestReliable = (await db.prepare(`
    SELECT tm.trust_score, tm.no_show_count, u.full_name, u.avatar_url
    FROM trust_metrics tm
    JOIN users u ON tm.user_id = u.id
    ORDER BY tm.trust_score ASC, tm.no_show_count DESC
    LIMIT 5
  `).all<any>()).results;

  // -------------------------------------------------------------
  // SECTION 6: EVENT HEALTH & HOST RELIABILITY (EXACT FORMULAS)
  // -------------------------------------------------------------
  const eventsCreatedRow = await db.prepare("SELECT COUNT(*) as count FROM events WHERE deleted_at IS NULL").first<{ count: number }>();
  const eventsCreated = eventsCreatedRow?.count ?? 0;

  const eventViewsRow = await db.prepare("SELECT COUNT(*) as count FROM analytics_events WHERE event_name = 'event_viewed'").first<{ count: number }>();
  const eventViews = eventViewsRow?.count ?? 0;

  const eventRSVPsRow = await db.prepare("SELECT COUNT(*) as count FROM event_attendees WHERE status = 'joined'").first<{ count: number }>();
  const eventRSVPs = eventRSVPsRow?.count ?? 0;

  const eventNoShowsRow = await db.prepare("SELECT COUNT(*) as count FROM no_show_logs WHERE event_id IS NOT NULL").first<{ count: number }>();
  const eventNoShows = eventNoShowsRow?.count ?? 0;
  const eventAttendance = Math.max(0, eventRSVPs - eventNoShows);
  const eventAttendanceRate = eventRSVPs > 0 ? (eventAttendance / eventRSVPs) * 100 : 100;

  // Aggregate feedback details using event_feedback exactly
  const eventRatingStats = await db.prepare(`
    SELECT AVG(rating) as avg_event, AVG(host_rating) as avg_host, AVG(would_attend_again) as avg_would_attend 
    FROM event_feedback
  `).first<{ avg_event: number | null; avg_host: number | null; avg_would_attend: number | null }>();
  
  const avgEventRating = eventRatingStats?.avg_event ?? 5.0;
  const avgHostRating = eventRatingStats?.avg_host ?? 5.0;
  const avgWouldAttendAgain = (eventRatingStats?.avg_would_attend ?? 1.0) * 100;

  // Calculate detailed parameters per event
  const { results: rawEventsList } = await db.prepare(`
    SELECT e.id, e.title, u.full_name as host_name, e.host_user_id
    FROM events e
    JOIN users u ON e.host_user_id = u.id
    WHERE e.deleted_at IS NULL
  `).all<{ id: string; title: string; host_name: string; host_user_id: string }>();

  const eventQualityMetricsList = [];
  for (const e of rawEventsList) {
    const feedback = await db.prepare(`
      SELECT 
        AVG(rating) as avg_rating,
        AVG(host_rating) as avg_host_rating,
        AVG(would_attend_again) as avg_would_attend
      FROM event_feedback
      WHERE event_id = ?
    `).bind(e.id).first<{ avg_rating: number | null; avg_host_rating: number | null; avg_would_attend: number | null }>();

    const rsvpsRow = await db.prepare("SELECT COUNT(*) as count FROM event_attendees WHERE event_id = ? AND status = 'joined'").bind(e.id).first<{ count: number }>();
    const noShowsRow = await db.prepare("SELECT COUNT(*) as count FROM no_show_logs WHERE event_id = ?").bind(e.id).first<{ count: number }>();
    
    const rsvps = rsvpsRow?.count ?? 0;
    const noShows = noShowsRow?.count ?? 0;
    const attendance = Math.max(0, rsvps - noShows);
    const attendanceRate = rsvps > 0 ? (attendance / rsvps) * 100 : 100.0;
    const noShowRate = rsvps > 0 ? (noShows / rsvps) * 100 : 0.0;

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

    eventQualityMetricsList.push({
      id: e.id,
      title: e.title,
      hostName: e.host_name,
      hostUserId: e.host_user_id,
      rsvps,
      attendance,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      noShowRate: Math.round(noShowRate * 10) / 10,
      rating: Math.round(eventRating * 10) / 10,
      hostRating: Math.round(hostRating * 10) / 10,
      wouldAttendAgainPct: Math.round(wouldAttendAgainPct * 10) / 10,
      qualityScore
    });
  }

  // Sort best and worst events
  const topRatedEvents = [...eventQualityMetricsList]
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, 5);

  const worstRatedEvents = [...eventQualityMetricsList]
    .sort((a, b) => a.qualityScore - b.qualityScore)
    .slice(0, 5);

  // Calculate Host Reliability Score per host
  const { results: rawHostsList } = await db.prepare(`
    SELECT DISTINCT e.host_user_id as id, u.full_name as name
    FROM events e
    JOIN users u ON e.host_user_id = u.id
  `).all<{ id: string; name: string }>();

  const hostReliabilityList = [];
  for (const h of rawHostsList) {
    const eventsHostedRow = await db.prepare("SELECT COUNT(*) as count FROM events WHERE host_user_id = ? AND deleted_at IS NULL").bind(h.id).first<{ count: number }>();
    const eventsHosted = eventsHostedRow?.count ?? 0;

    const feedbackRow = await db.prepare(`
      SELECT AVG(host_rating) as avg_rating 
      FROM event_feedback ef
      JOIN events e ON ef.event_id = e.id
      WHERE e.host_user_id = ?
    `).bind(h.id).first<{ avg_rating: number | null }>();
    const hostRating = feedbackRow?.avg_rating ?? 5.0;

    // Attendance Rate
    const rsvpsRow = await db.prepare(`
      SELECT COUNT(*) as count FROM event_attendees ea 
      JOIN events e ON ea.event_id = e.id 
      WHERE e.host_user_id = ? AND ea.status = 'joined'
    `).bind(h.id).first<{ count: number }>();
    const rsvps = rsvpsRow?.count ?? 0;

    const noShowsRow = await db.prepare(`
      SELECT COUNT(*) as count FROM no_show_logs ns 
      JOIN events e ON ns.event_id = e.id 
      WHERE e.host_user_id = ?
    `).bind(h.id).first<{ count: number }>();
    const noShows = noShowsRow?.count ?? 0;

    const attendance = Math.max(0, rsvps - noShows);
    const attendanceRate = rsvps > 0 ? (attendance / rsvps) * 100 : 100.0;

    // Cancellation & Completion rate
    const totalEventsRow = await db.prepare("SELECT COUNT(*) as count FROM events WHERE host_user_id = ?").bind(h.id).first<{ count: number }>();
    const totalEvents = totalEventsRow?.count ?? 0;
    
    const cancelledEventsRow = await db.prepare("SELECT COUNT(*) as count FROM events WHERE host_user_id = ? AND deleted_at IS NOT NULL").bind(h.id).first<{ count: number }>();
    const cancelledEvents = cancelledEventsRow?.count ?? 0;

    const cancellationRate = totalEvents > 0 ? (cancelledEvents / totalEvents) * 100 : 0.0;
    const completionRate = 100 - cancellationRate;

    // Host Reliability Score = 0.40 * Host Rating (scaled to 100) + 0.40 * Attendance Rate + 0.20 * Completion Rate
    const hostReliabilityScore = Math.round(
      0.40 * (hostRating / 5 * 100) +
      0.40 * attendanceRate +
      0.20 * completionRate
    );

    hostReliabilityList.push({
      id: h.id,
      name: h.name,
      eventsHosted,
      avgHostRating: Math.round(hostRating * 10) / 10,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      hostReliabilityScore
    });
  }

  // Sort best and worst hosts
  const topRatedHosts = [...hostReliabilityList]
    .sort((a, b) => b.hostReliabilityScore - a.hostReliabilityScore)
    .slice(0, 5);

  const worstRatedHosts = [...hostReliabilityList]
    .sort((a, b) => a.hostReliabilityScore - b.hostReliabilityScore)
    .slice(0, 5);

  // Top Rated Members (highest meetup feedback ratings)
  const topRatedMembers = (await db.prepare(`
    SELECT u.full_name, u.avatar_url, AVG(rating) as avg_rating, COUNT(*) as feedback_count 
    FROM meetup_feedback mf 
    JOIN users u ON mf.target_user_id = u.id 
    GROUP BY mf.target_user_id 
    ORDER BY avg_rating DESC, feedback_count DESC 
    LIMIT 5
  `).all<any>()).results;

  // -------------------------------------------------------------
  // SECTION 7: RECOMMENDATION PERFORMANCE BY SOURCE
  // -------------------------------------------------------------
  const sources = [
    'Top Matches',
    'Near You',
    'Similar Vibes',
    'Trending',
    'Reliable Members',
    'Verified Members'
  ];

  const sourcePerformance: RecommendationSourceMetrics[] = [];

  for (const src of sources) {
    const impRow = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM analytics_events 
      WHERE event_name = 'recommendation_impression' AND json_extract(metadata_json, '$.source') = ?
    `).bind(src).first<{ count: number }>();
    const impressions = impRow?.count ?? 0;

    const clkRow = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM analytics_events 
      WHERE event_name = 'recommendation_clicked' AND json_extract(metadata_json, '$.source') = ?
    `).bind(src).first<{ count: number }>();
    const clicks = clkRow?.count ?? 0;

    const viewRow = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM analytics_events 
      WHERE event_name = 'member_profile_viewed' AND json_extract(metadata_json, '$.source') = ?
    `).bind(src).first<{ count: number }>();
    const views = viewRow?.count ?? 0;

    const reqRow = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM analytics_events 
      WHERE event_name = 'match_request_sent' AND json_extract(metadata_json, '$.source') = ?
    `).bind(src).first<{ count: number }>();
    const requests = reqRow?.count ?? 0;

    const accRow = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM analytics_events 
      WHERE event_name = 'match_request_accepted' AND json_extract(metadata_json, '$.source') = ?
    `).bind(src).first<{ count: number }>();
    const accepts = accRow?.count ?? 0;

    const meetRow = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM analytics_events 
      WHERE event_name = 'meetup_completed' AND json_extract(metadata_json, '$.source') = ?
    `).bind(src).first<{ count: number }>();
    const meetups = meetRow?.count ?? 0;

    sourcePerformance.push({
      source: src,
      impressions,
      clicks,
      views,
      requests,
      accepts,
      meetups,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 100 * 10) / 10 : 0,
      requestRate: clicks > 0 ? Math.round((requests / clicks) * 100 * 10) / 10 : 0,
      acceptRate: requests > 0 ? Math.round((accepts / requests) * 100 * 10) / 10 : 0,
      meetupRate: accepts > 0 ? Math.round((meetups / accepts) * 100 * 10) / 10 : 0
    });
  }

  // -------------------------------------------------------------
  // SECTION 8: AUTOMATIC ALERTS
  // -------------------------------------------------------------
  const alerts: Array<{ type: 'danger' | 'warning' | 'success'; message: string }> = [];

  const profileCompRate = totalUsers > 0 ? (profilesCompleted / totalUsers) * 100 : 0;
  if (profileCompRate < 60) {
    alerts.push({ type: 'danger', message: `Profile Completion Rate is extremely low at ${Math.round(profileCompRate)}% (Target: >60%)` });
  }

  const acceptanceRate = requestsSent > 0 ? (requestsAccepted / requestsSent) * 100 : 0;
  if (acceptanceRate < 20) {
    alerts.push({ type: 'danger', message: `Match Acceptance Rate is lagging at ${Math.round(acceptanceRate)}% (Target: >20%)` });
  }

  const meetupCompRate = meetupsPlanned > 0 ? (meetupsCompleted / meetupsPlanned) * 100 : 0;
  if (meetupCompRate < 40) {
    alerts.push({ type: 'danger', message: `Meetup Completion Rate is critical at ${Math.round(meetupCompRate)}% (Target: >40%)` });
  }

  if (eventAttendanceRate < 60) {
    alerts.push({ type: 'warning', message: `Event Attendance Rate is low at ${Math.round(eventAttendanceRate)}% (Target: >60%)` });
  }

  if (noShowRate > 20) {
    alerts.push({ type: 'danger', message: `No Show Rate is dangerously high at ${Math.round(noShowRate)}% (Target: <20%)` });
  }

  // North Star Trend Alert
  if (weeklyNsGrowth < 0) {
    alerts.push({ type: 'danger', message: `North Star KPI is declining: Weekly growth is ${weeklyNsGrowth}%` });
  } else if (weeklyNsGrowth > 0) {
    alerts.push({ type: 'success', message: `North Star KPI is improving: Weekly growth is +${weeklyNsGrowth}%` });
  }

  // Would Meet Again Platform Wide
  const totalFeedbackCountRow = await db.prepare("SELECT COUNT(*) as count FROM meetup_feedback").first<{ count: number }>();
  const totalFeedbackCount = totalFeedbackCountRow?.count ?? 0;
  const positiveMeetAgainRow = await db.prepare("SELECT COUNT(*) as count FROM meetup_feedback WHERE would_meet_again = 1 OR meet_again = 1").first<{ count: number }>();
  const positiveMeetAgain = positiveMeetAgainRow?.count ?? 0;
  const platformWouldMeetAgainRate = totalFeedbackCount > 0 ? Math.round((positiveMeetAgain / totalFeedbackCount) * 100 * 10) / 10 : 100;

  // Dynamic Would Meet Again rankings
  const { results: wouldMeetAgainRankings } = await db.prepare(`
    SELECT tm.trust_score, tm.attended_count, u.full_name, u.avatar_url,
           (SELECT COUNT(*) FROM meetup_feedback WHERE target_user_id = tm.user_id) as total_feedback,
           (SELECT SUM(CASE WHEN would_meet_again = 1 OR meet_again = 1 THEN 1 ELSE 0 END) FROM meetup_feedback WHERE target_user_id = tm.user_id) as positive_feedback
    FROM trust_metrics tm
    JOIN users u ON tm.user_id = u.id
    ORDER BY (CAST(positive_feedback AS REAL) / COALESCE(NULLIF(total_feedback, 0), 1) * 100) DESC
    LIMIT 5
  `).all<any>();

  const wouldMeetAgainRankingsEnriched = wouldMeetAgainRankings.map(r => {
    const total = Number(r.total_feedback ?? 0);
    const positive = Number(r.positive_feedback ?? 0);
    return {
      fullName: r.full_name,
      avatarUrl: r.avatar_url,
      wouldMeetAgainPct: total > 0 ? Math.round((positive / total) * 100) : 100
    };
  });

  return {
    funnel: funnelSteps,
    acquisition: {
      today: signupsToday,
      thisWeek: signupsThisWeek,
      thisMonth: signupsThisMonth,
      dailyGrowth,
      weeklyGrowth,
      monthlyGrowth
    },
    activation: {
      started: profilesStarted,
      completed: profilesCompleted,
      rate: Math.round(profileCompRate * 10) / 10,
      avgTime: completionTimeText
    },
    matchFunnel: {
      recsViewed,
      profileViews,
      requestsSent,
      requestsAccepted,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
      chatsStarted
    },
    connections: {
      planned: meetupsPlanned,
      completed: meetupsCompleted,
      rate: Math.round(meetupCompRate * 10) / 10,
      wouldMeetAgain: platformWouldMeetAgainRate,
      kpi: {
        allTime: { value: northStarAllTime, growth: allTimeNsGrowth },
        monthly: { value: northStarMonthly, growth: monthlyNsGrowth },
        weekly: { value: northStarWeekly, growth: weeklyNsGrowth },
        daily: { value: northStarDaily, growth: dailyNsGrowth }
      }
    },
    trust: {
      attendanceRate: Math.round(avgAttendance * 10) / 10,
      noShowRate: Math.round(noShowRate * 10) / 10,
      avgReliability: Math.round(avgTrustScore * 10) / 10,
      verifiedRate: totalUsers > 0 ? Math.round((verifiedCount / totalUsers) * 100 * 10) / 10 : 0,
      topReliable,
      lowestReliable,
      wouldMeetAgainRankings: wouldMeetAgainRankingsEnriched,
      topRatedMembers
    },
    events: {
      created: eventsCreated,
      views: eventViews,
      rsvps: eventRSVPs,
      attendance: eventAttendance,
      rate: Math.round(eventAttendanceRate * 10) / 10,
      avgEventRating: Math.round(avgEventRating * 10) / 10,
      avgHostRating: Math.round(avgHostRating * 10) / 10,
      topEvents: topRatedEvents,
      topHosts: topRatedHosts,
      worstEvents: worstRatedEvents,
      worstHosts: worstRatedHosts
    },
    recommendationPerformance: sourcePerformance,
    alerts
  };
}
