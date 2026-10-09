/**
 * Calendar-date helpers for the study plan. Every date is a plain
 * `YYYY-MM-DD` string with no time zone attached, so the plan never drifts when
 * the server (UTC) and the student (IST) disagree about what day it is. "Today"
 * is always the IST calendar day.
 */

const IST_OFFSET_MINUTES = 330;
const DAY_MS = 86_400_000;
const DATE_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const toUtcMs = (date: string) => Date.parse(`${date}T00:00:00Z`);
const fromUtcMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** True for a real calendar date, e.g. rejects 2026-02-30. */
export function isDate(value: string): boolean {
  return DATE_PATTERN.test(value) && fromUtcMs(toUtcMs(value)) === value;
}

/** The IST calendar day containing `now`. */
export function todayIST(now: Date = new Date()): string {
  return fromUtcMs(now.getTime() + IST_OFFSET_MINUTES * 60_000).slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** First day of a `YYYY-MM` month. */
export function firstDayOfMonth(month: string): string {
  return `${month}-01`;
}

/** Last day of a `YYYY-MM` month (handles leap years). */
export function lastDayOfMonth(month: string): string {
  const [year, number] = month.split('-').map(Number);
  return fromUtcMs(Date.UTC(year, number, 0));
}

/** The `YYYY-MM` month a date falls in. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
  const dayOfWeek = new Date(toUtcMs(date)).getUTCDay(); // 0 = Sunday
  return addDays(date, -((dayOfWeek + 6) % 7));
}

/** Every date from `from` to `to`, inclusive; empty when `to` is before `from`. */
export function dateRange(from: string, to: string): string[] {
  const count = daysBetween(from, to) + 1;
  return count > 0
    ? Array.from({ length: count }, (_, index) => addDays(from, index))
    : [];
}
