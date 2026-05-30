import { D1Database } from '@cloudflare/workers-types';

export interface TrustMetrics {
  user_id: string;
  attendance_score: number;
  no_show_count: number;
  attended_count: number;
  verification_score: number;
  is_verified: boolean;
  response_rate: number;
  trust_score: number;
  would_meet_again_pct?: number;
}

export function calculateTrustScore(
  completed: boolean,
  metrics: {
    attendance_score?: number;
    no_show_count?: number;
    verification_score?: number;
    is_verified?: number | boolean;
    response_rate?: number;
    would_meet_again_pct?: number;
  }
): { score: number; explanations: string[] } {
  const completionScore = completed ? 100 : 50;
  const attendanceScore = Number(metrics.attendance_score ?? 100.0);
  const noShowCount = Number(metrics.no_show_count ?? 0);
  const isVerified = Boolean(metrics.is_verified ?? false);
  const verificationScore = isVerified ? 100 : Number(metrics.verification_score ?? 0.0);
  const responseRate = Number(metrics.response_rate ?? 100.0);
  const wouldMeetAgainPct = Number(metrics.would_meet_again_pct ?? 100.0);

  // No Show History = 100 minus a penalty of 20 per no-show (5% weight)
  const noShowScore = Math.max(0, 100 - noShowCount * 20);

  // Trust Score formula:
  // Attendance Score = 25%
  // Verification Score = 25%
  // Profile Completion = 20%
  // Would Meet Again = 15%
  // Response Rate = 10%
  // No Show History = 5%
  const score = Math.round(
    0.25 * attendanceScore +
    0.25 * verificationScore +
    0.20 * completionScore +
    0.15 * wouldMeetAgainPct +
    0.10 * responseRate +
    0.05 * noShowScore
  );

  const explanations: string[] = [];
  if (score >= 95) {
    explanations.push('Elite Reliable member');
  } else if (score >= 85) {
    explanations.push('Highly Reliable member');
  } else if (score >= 70) {
    explanations.push('Reliable member');
  } else if (score >= 50) {
    explanations.push('Building Trust');
  } else {
    explanations.push('Low Reliability');
  }

  if (isVerified) {
    explanations.push('Verified member');
  }
  if (attendanceScore >= 90 && noShowCount === 0) {
    explanations.push('Strong attendance history');
  }

  return { score, explanations };
}

export async function getOrInitializeTrustMetrics(db: D1Database, userId: string, completed = false): Promise<TrustMetrics> {
  let metrics = await db.prepare('SELECT * FROM trust_metrics WHERE user_id = ?').bind(userId).first<any>();
  
  if (!metrics) {
    await db.prepare(`
      INSERT INTO trust_metrics (user_id, attendance_score, no_show_count, attended_count, verification_score, is_verified, response_rate, trust_score)
      VALUES (?, 100.0, 0, 0, 0.0, 0, 100.0, 75.0)
    `).bind(userId).run();
    metrics = await db.prepare('SELECT * FROM trust_metrics WHERE user_id = ?').bind(userId).first<any>();
  }

  // Calculate Would Meet Again % from meetup_feedback exactly (handling both column names for compatibility)
  const wmaRow = await db.prepare(`
    SELECT COUNT(*) as total, 
           SUM(CASE WHEN would_meet_again = 1 OR meet_again = 1 THEN 1 ELSE 0 END) as positive 
    FROM meetup_feedback 
    WHERE target_user_id = ?
  `).bind(userId).first<{ total: number; positive: number }>();
  
  const wmaTotal = wmaRow?.total ?? 0;
  const wmaPositive = wmaRow?.positive ?? 0;
  const wouldMeetAgainPct = wmaTotal > 0 ? (wmaPositive / wmaTotal) * 100 : 100.0;

  // Mix in the would_meet_again_pct to metrics for calculation
  const metricsWithWma = {
    ...metrics,
    would_meet_again_pct: wouldMeetAgainPct
  };

  const { score: computedTrust } = calculateTrustScore(completed, metricsWithWma);
  
  // Sync computed score back to DB if different
  if (Math.abs(Number(metrics.trust_score) - computedTrust) > 1) {
    await db.prepare('UPDATE trust_metrics SET trust_score = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .bind(computedTrust, userId).run();
    metrics.trust_score = computedTrust;
  }

  return {
    user_id: userId,
    attendance_score: Number(metrics.attendance_score ?? 100.0),
    no_show_count: Number(metrics.no_show_count ?? 0),
    attended_count: Number(metrics.attended_count ?? 0),
    verification_score: Number(metrics.verification_score ?? 0.0),
    is_verified: Boolean(metrics.is_verified ?? 0),
    response_rate: Number(metrics.response_rate ?? 100.0),
    trust_score: computedTrust,
    would_meet_again_pct: wouldMeetAgainPct
  };
}

/**
 * Record a meetup outcome, update no-show counts and attendance scores.
 */
export async function recordMeetupOutcome(
  db: D1Database,
  reporterUserId: string,
  targetUserId: string,
  meetupHappened: boolean,
  showedUp: boolean,
  ratingStars: number | null,
  meetAgain: boolean,
  textFeedback: string | null,
  meetOutcomeId: string
) {
  // Save feedback log
  const feedbackId = `fb-${crypto.randomUUID()}`;
  await db.prepare(`
    INSERT INTO meetup_feedback (
      id, match_outcome_id, reporter_user_id, target_user_id, meetup_happened, showed_up, meet_again, rating_stars, text_feedback,
      meetup_id, user_id, rating, would_meet_again, feedback
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    feedbackId,
    meetOutcomeId,
    reporterUserId,
    targetUserId,
    meetupHappened ? 1 : 0,
    showedUp ? 1 : 0,
    meetAgain ? 1 : 0,
    ratingStars,
    textFeedback,
    meetOutcomeId,
    reporterUserId,
    ratingStars,
    meetAgain ? 1 : 0,
    textFeedback
  ).run();

  // If the meetup happened and showedUp is true, we should credit the target
  if (meetupHappened) {
    if (!showedUp) {
      const noShowId = `ns-${crypto.randomUUID()}`;
      await db.prepare(`
        INSERT INTO no_show_logs (id, user_id, reported_by_user_id, reason)
        VALUES (?, ?, ?, 'Reported absent from meetup outcome')
      `).bind(noShowId, targetUserId, reporterUserId).run();

      await db.prepare(`
        UPDATE trust_metrics 
        SET no_show_count = no_show_count + 1,
            attendance_score = MAX(0, attendance_score - 15.0),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(targetUserId).run();
    } else {
      await db.prepare(`
        UPDATE trust_metrics 
        SET attended_count = attended_count + 1,
            attendance_score = MIN(100.0, attendance_score + 5.0),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(targetUserId).run();
    }
  }

  // Sync trust scores for both participants
  await getOrInitializeTrustMetrics(db, reporterUserId);
  await getOrInitializeTrustMetrics(db, targetUserId);
}
