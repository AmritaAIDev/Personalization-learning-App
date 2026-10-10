import {
  lastDayOfMonth,
  daysBetween,
  todayIST,
} from '../study-plan/plan-dates';
import { TARGET_MONTH_PATTERN } from './personalization';

/**
 * How close the student's target month is, and what that means for practice
 * and revision. Pure so it is easy to test; the services only read it.
 *
 * - `none`: no target set (or it has already passed) — behave as before.
 * - `foundation`: plenty of time; broad, balanced practice.
 * - `consolidation`: the final stretch begins; lean towards harder questions.
 * - `sprint`: exam is near; exam-like difficulty and a longer weak-topic list.
 */
export type TargetPhase = 'none' | 'foundation' | 'consolidation' | 'sprint';

export interface TargetPressure {
  phase: TargetPhase;
  /** Days from today (IST) to the last day of the target month; null if none. */
  daysLeft: number | null;
}

export const CONSOLIDATION_WITHIN_DAYS = 120;
export const SPRINT_WITHIN_DAYS = 45;

export const NO_TARGET_PRESSURE: TargetPressure = {
  phase: 'none',
  daysLeft: null,
};

export function getTargetPressure(
  targetMonth: string | null | undefined,
  now: Date = new Date(),
): TargetPressure {
  if (!targetMonth || !TARGET_MONTH_PATTERN.test(targetMonth)) {
    return NO_TARGET_PRESSURE;
  }
  const daysLeft = daysBetween(todayIST(now), lastDayOfMonth(targetMonth));
  if (daysLeft < 0) return NO_TARGET_PRESSURE;
  if (daysLeft <= SPRINT_WITHIN_DAYS) return { phase: 'sprint', daysLeft };
  if (daysLeft <= CONSOLIDATION_WITHIN_DAYS) {
    return { phase: 'consolidation', daysLeft };
  }
  return { phase: 'foundation', daysLeft };
}

/** Questions wanted per [Easy, Medium, Hard]; always totals 15. */
export const DIFFICULTY_MIX: Record<
  TargetPhase,
  readonly [number, number, number]
> = {
  none: [5, 5, 5],
  foundation: [5, 5, 5],
  consolidation: [4, 5, 6],
  sprint: [3, 5, 7],
};

/** How many weak topics the revision hub lists for each phase. */
export const WEAK_TOPIC_LIMIT_BY_PHASE: Record<TargetPhase, number> = {
  none: 8,
  foundation: 8,
  consolidation: 10,
  sprint: 12,
};
