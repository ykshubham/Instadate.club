import { describe, it, expect } from 'vitest';
import { calculateTrustScore } from '../../worker/services/trust';

describe('calculateTrustScore', () => {
  it('scores a perfect, completed, verified member at exactly 100 (Elite + badges)', () => {
    const { score, explanations } = calculateTrustScore(true, {
      attendance_score: 100,
      no_show_count: 0,
      is_verified: true,
      response_rate: 100,
      would_meet_again_pct: 100
    });
    // 0.25*100 + 0.25*100 + 0.20*100 + 0.15*100 + 0.10*100 + 0.05*100 = 100
    expect(score).toBe(100);
    expect(explanations[0]).toBe('Elite Reliable member');
    expect(explanations).toContain('Verified member');
    expect(explanations).toContain('Strong attendance history');
  });

  it('applies defaults (all metrics omitted, completed) -> 90, Highly Reliable, no verified badge', () => {
    // attendance 100, verification 0 (not verified), completion 100,
    // wma 100, response 100, noShow 100:
    // 25 + 0 + 20 + 15 + 10 + 5 = 75 ... wait recompute: 0.25*100=25, 0.25*0=0,
    // 0.20*100=20, 0.15*100=15, 0.10*100=10, 0.05*100=5 => 75
    const { score, explanations } = calculateTrustScore(true, {});
    expect(score).toBe(75);
    expect(explanations[0]).toBe('Reliable member');
    expect(explanations).not.toContain('Verified member');
    // attendance defaults to 100 and no_show_count to 0 -> strong attendance
    expect(explanations).toContain('Strong attendance history');
  });

  it('lands in the Highly Reliable tier when verified but completion is mid', () => {
    // completed but verified true -> verification 100
    // attendance 100, verification 100, completion 100, wma 50, response 60, noShow 100
    // 25 + 25 + 20 + 7.5 + 6 + 5 = 88.5 -> 89
    const { score, explanations } = calculateTrustScore(true, {
      attendance_score: 100,
      no_show_count: 0,
      is_verified: 1,
      response_rate: 60,
      would_meet_again_pct: 50
    });
    expect(score).toBe(89);
    expect(explanations[0]).toBe('Highly Reliable member');
    expect(explanations).toContain('Verified member');
  });

  it('drops to a lower tier for an incomplete, weak-metrics profile', () => {
    // completed=false -> completion 50, not verified -> verification 0
    // attendance 60, verification 0, completion 50, wma 50, response 50, noShow 100
    // 15 + 0 + 10 + 7.5 + 5 + 5 = 42.5 -> 43 (rounds to 43)
    const { score, explanations } = calculateTrustScore(false, {
      attendance_score: 60,
      no_show_count: 0,
      is_verified: false,
      response_rate: 50,
      would_meet_again_pct: 50
    });
    expect(score).toBe(43);
    expect(explanations[0]).toBe('Low Reliability');
    expect(explanations).not.toContain('Verified member');
    // attendance 60 < 90 -> no strong attendance badge
    expect(explanations).not.toContain('Strong attendance history');
  });

  it('reduces the score as no-show count rises and removes the attendance badge', () => {
    // noShowCount 3 -> noShowScore = 100 - 60 = 40
    // attendance 40, verification 0, completion 50, wma 50, response 50, noShow 40
    // 10 + 0 + 10 + 7.5 + 5 + 2 = 34.5 -> 35
    const { score, explanations } = calculateTrustScore(false, {
      attendance_score: 40,
      no_show_count: 3,
      is_verified: false,
      response_rate: 50,
      would_meet_again_pct: 50
    });
    expect(score).toBe(35);
    expect(explanations[0]).toBe('Low Reliability');
    expect(explanations).not.toContain('Strong attendance history');
  });

  it('floors the no-show score at 0 for many no-shows', () => {
    // noShowCount 10 -> 100 - 200 -> floored to 0
    // attendance 90, verification 0, completion 50, wma 50, response 50, noShow 0
    // 22.5 + 0 + 10 + 7.5 + 5 + 0 = 45 -> 45
    const { score } = calculateTrustScore(false, {
      attendance_score: 90,
      no_show_count: 10,
      is_verified: false,
      response_rate: 50,
      would_meet_again_pct: 50
    });
    expect(score).toBe(45);
  });

  it('lands in the Building Trust tier between 50 and 69', () => {
    // completed -> completion 100, not verified -> 0
    // attendance 50, verification 0, completion 100, wma 50, response 50, noShow 100
    // 12.5 + 0 + 20 + 7.5 + 5 + 5 = 50 -> 50
    const { score, explanations } = calculateTrustScore(true, {
      attendance_score: 50,
      no_show_count: 0,
      is_verified: false,
      response_rate: 50,
      would_meet_again_pct: 50
    });
    expect(score).toBe(50);
    expect(explanations[0]).toBe('Building Trust');
  });

  it('withholds the strong-attendance badge when attendance is high but a no-show exists', () => {
    const { explanations } = calculateTrustScore(true, {
      attendance_score: 95,
      no_show_count: 1,
      is_verified: false
    });
    expect(explanations).not.toContain('Strong attendance history');
  });

  it('uses explicit verification_score when not is_verified', () => {
    // not verified, verification_score 80 used directly
    // attendance 100, verification 80, completion 100, wma 100, response 100, noShow 100
    // 25 + 20 + 20 + 15 + 10 + 5 = 95 -> Elite
    const { score, explanations } = calculateTrustScore(true, {
      attendance_score: 100,
      no_show_count: 0,
      is_verified: false,
      verification_score: 80,
      response_rate: 100,
      would_meet_again_pct: 100
    });
    expect(score).toBe(95);
    expect(explanations[0]).toBe('Elite Reliable member');
    expect(explanations).not.toContain('Verified member');
  });
});
