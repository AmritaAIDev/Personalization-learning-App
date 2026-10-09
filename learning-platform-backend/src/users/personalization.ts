/**
 * Rules for the student's personalisation profile (class, stream, target
 * month, daily study budget). Pure so they are easy to test; the service and
 * the DTO both use these constants.
 */

export const CLASS_NAMES = ['11', '12', 'Dropper'] as const;
export type ClassName = (typeof CLASS_NAMES)[number];

/**
 * The product is JEE-only, so only the PCM stream is offered. A PCB/NEET option
 * would promise a syllabus that does not exist.
 */
export const STREAMS = ['Science (PCM)'] as const;
export type Stream = (typeof STREAMS)[number];

export const DEFAULT_DAILY_MINUTES = 120;
export const MIN_DAILY_MINUTES = 30;
export const MAX_DAILY_MINUTES = 600;

/** A target further away than this is almost certainly a typo. */
export const MAX_TARGET_MONTHS_AHEAD = 24;

export const TARGET_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** India Standard Time is UTC+05:30 with no daylight saving. */
const IST_OFFSET_MINUTES = 330;

/** "Now" as an IST calendar month, e.g. "2026-10". Servers run in UTC. */
export function currentMonthIST(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000);
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${month}`;
}

function monthIndex(month: string): number {
  const [year, number] = month.split('-').map(Number);
  return year * 12 + (number - 1);
}

/** Whole months from `from` to `to` (negative when `to` is earlier). */
export function monthsBetween(from: string, to: string): number {
  return monthIndex(to) - monthIndex(from);
}

/**
 * Why a target month is not acceptable, or null when it is: it must be the
 * current month or later (IST), and at most 24 months ahead.
 */
export function targetMonthProblem(
  month: string,
  now: Date = new Date(),
): string | null {
  if (!TARGET_MONTH_PATTERN.test(month)) {
    return 'Target month must be in YYYY-MM format.';
  }
  const ahead = monthsBetween(currentMonthIST(now), month);
  if (ahead < 0) return 'Target month cannot be in the past.';
  if (ahead > MAX_TARGET_MONTHS_AHEAD) {
    return `Target month cannot be more than ${MAX_TARGET_MONTHS_AHEAD} months ahead.`;
  }
  return null;
}

/** What the API returns about a student's personalisation. */
export interface PersonalizationProfile {
  className: ClassName | null;
  stream: Stream | null;
  targetMonth: string | null;
  dailyMinutes: number;
  /** Null until class, stream and target month have all been chosen. */
  completedAt: string | null;
}

/** A student who has not set anything up yet (also handy as a test fixture). */
export const EMPTY_PERSONALIZATION: PersonalizationProfile = {
  className: null,
  stream: null,
  targetMonth: null,
  dailyMinutes: DEFAULT_DAILY_MINUTES,
  completedAt: null,
};

export interface PersonalizationSource {
  className: string | null;
  stream: string | null;
  targetMonth: string | null;
  dailyMinutes: number;
  personalizationCompletedAt: Date | null;
}

const isClassName = (value: string | null): value is ClassName =>
  (CLASS_NAMES as readonly string[]).includes(value ?? '');
const isStream = (value: string | null): value is Stream =>
  (STREAMS as readonly string[]).includes(value ?? '');

export function toPersonalization(
  user: PersonalizationSource,
): PersonalizationProfile {
  return {
    // Unknown stored values (e.g. an option removed later) read as "not set".
    className: isClassName(user.className) ? user.className : null,
    stream: isStream(user.stream) ? user.stream : null,
    targetMonth: user.targetMonth,
    dailyMinutes: user.dailyMinutes,
    completedAt: user.personalizationCompletedAt?.toISOString() ?? null,
  };
}
