/**
 * Calendar-month helpers for the target-month picker. Months are `YYYY-MM`
 * strings, the same shape the API stores. "Now" is the India (IST) calendar
 * month, matching the backend's rule (learning-platform-backend
 * src/users/personalization.ts), so the picker never offers a month the server
 * would reject.
 */

/** Mirrors MAX_TARGET_MONTHS_AHEAD on the backend. */
export const MAX_TARGET_MONTHS_AHEAD = 24;

const IST_OFFSET_MINUTES = 330;
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function isMonth(value: string): boolean {
  return MONTH_PATTERN.test(value);
}

/** The IST calendar month containing `now`, e.g. "2026-10". */
export function currentMonthIST(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000);
  return toMonth(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1);
}

export function toMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonth(value: string): { year: number; month: number } {
  const match = MONTH_PATTERN.exec(value);
  if (!match) throw new Error(`Not a YYYY-MM month: ${value}`);
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function addMonths(value: string, delta: number): string {
  const { year, month } = parseMonth(value);
  const index = year * 12 + (month - 1) + delta;
  return toMonth(Math.floor(index / 12), (((index % 12) + 12) % 12) + 1);
}

/** Whole months from `from` to `to` (negative when `to` is earlier). */
export function monthsBetween(from: string, to: string): number {
  const a = parseMonth(from);
  const b = parseMonth(to);
  return b.year * 12 + b.month - (a.year * 12 + a.month);
}

/** "December 2026"; the raw value if it is not a valid month. */
export function formatMonth(value: string | null): string {
  if (!value || !isMonth(value)) return value ?? "";
  const { year, month } = parseMonth(value);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1];
}

/** The earliest and latest months a student may pick right now. */
export function targetMonthBounds(now: Date = new Date()): {
  min: string;
  max: string;
} {
  const min = currentMonthIST(now);
  return { min, max: addMonths(min, MAX_TARGET_MONTHS_AHEAD) };
}

export function isMonthInRange(value: string, min: string, max: string): boolean {
  return isMonth(value) && monthsBetween(min, value) >= 0 && monthsBetween(value, max) >= 0;
}

/** Whole days from `from` to `to` (both `YYYY-MM-DD`), ignoring time of day. */
export function daysUntil(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}
