import { D1Database } from '@cloudflare/workers-types';

export interface CohortMetrics {
  cohortWeek: string;
  cohortSize: number;
  profileCompletionCount: number;
  profileCompletionRate: number;
  matchRequestsCount: number;
  meetupsCount: number;
  day1Retained: number;
  day1RetentionRate: number;
  day7Retained: number;
  day7RetentionRate: number;
  day30Retained: number;
  day30RetentionRate: number;
}

export async function getCohortAnalytics(db: D1Database): Promise<CohortMetrics[]> {
  const query = `
    SELECT 
      COALESCE(date(u.created_at, 'weekday 0', '-6 days'), 'Unknown') AS cohort_week,
      COUNT(u.id) AS cohort_size,
      SUM(CASE WHEN p.completed = 1 THEN 1 ELSE 0 END) AS profile_completed_count,
      
      -- Match requests sent by users in this cohort
      SUM((
        SELECT COUNT(*) 
        FROM matches m 
        WHERE m.requester_user_id = u.id
      )) AS match_requests_count,
      
      -- Meetups completed by users in this cohort (either as user A or B)
      SUM((
        SELECT COUNT(*) 
        FROM match_outcomes mo 
        WHERE (mo.user_id_a = u.id OR mo.user_id_b = u.id) 
          AND mo.status = 'meetup_completed'
      )) AS meetups_count,
      
      -- Day 1 Retention (Active exactly 1 day after signup)
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM analytics_events ae 
        WHERE ae.user_id = u.id 
          AND date(ae.created_at) = date(u.created_at, '+1 day')
      ) THEN 1 ELSE 0 END) AS day1_retained,

      -- Day 7 Retention (Active between day 6 and 8 after signup)
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM analytics_events ae 
        WHERE ae.user_id = u.id 
          AND date(ae.created_at) BETWEEN date(u.created_at, '+6 days') AND date(u.created_at, '+8 days')
      ) THEN 1 ELSE 0 END) AS day7_retained,

      -- Day 30 Retention (Active between day 28 and 31 after signup)
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM analytics_events ae 
        WHERE ae.user_id = u.id 
          AND date(ae.created_at) BETWEEN date(u.created_at, '+28 days') AND date(u.created_at, '+31 days')
      ) THEN 1 ELSE 0 END) AS day30_retained

    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    GROUP BY cohort_week
    ORDER BY cohort_week DESC
  `;

  try {
    const { results } = await db.prepare(query).all();
    return results.map((r: any) => {
      const size = Number(r.cohort_size || 0);
      const profileCompleted = Number(r.profile_completed_count || 0);
      const day1 = Number(r.day1_retained || 0);
      const day7 = Number(r.day7_retained || 0);
      const day30 = Number(r.day30_retained || 0);

      return {
        cohortWeek: r.cohort_week,
        cohortSize: size,
        profileCompletionCount: profileCompleted,
        profileCompletionRate: size > 0 ? Math.round((profileCompleted / size) * 1000) / 10 : 0,
        matchRequestsCount: Number(r.match_requests_count || 0),
        meetupsCount: Number(r.meetups_count || 0),
        day1Retained: day1,
        day1RetentionRate: size > 0 ? Math.round((day1 / size) * 1000) / 10 : 0,
        day7Retained: day7,
        day7RetentionRate: size > 0 ? Math.round((day7 / size) * 1000) / 10 : 0,
        day30Retained: day30,
        day30RetentionRate: size > 0 ? Math.round((day30 / size) * 1000) / 10 : 0
      };
    });
  } catch (err) {
    console.error('Error fetching cohort analytics:', err);
    return [];
  }
}
