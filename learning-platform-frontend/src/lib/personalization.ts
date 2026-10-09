import { apiFetch } from "./api";
import type {
  AuthenticatedUser,
  PersonalizationProfile,
} from "./diagnostic-types";
import { isMonthInRange, targetMonthBounds } from "./month";

/** Mirrors the backend rules (learning-platform-backend src/users/personalization.ts). */
export const CLASS_OPTIONS = [
  { value: "11", label: "Class 11" },
  { value: "12", label: "Class 12" },
  { value: "Dropper", label: "Dropper / Repeater" },
] as const;

/** The product is JEE-only, so Science (PCM) is the one stream offered. */
export const STREAM_OPTIONS = [
  { value: "Science (PCM)", label: "Science (PCM)" },
] as const;

export const MIN_DAILY_MINUTES = 30;
export const MAX_DAILY_MINUTES = 600;
export const DEFAULT_DAILY_MINUTES = 120;
export const DAILY_MINUTE_PRESETS = [60, 90, 120, 180, 240] as const;

export interface PersonalizationValues {
  className: PersonalizationProfile["className"];
  stream: PersonalizationProfile["stream"];
  targetMonth: string | null;
  dailyMinutes: number;
}

export type PersonalizationErrors = Partial<
  Record<keyof PersonalizationValues, string>
>;

export function valuesFromProfile(
  profile: PersonalizationProfile | null | undefined,
): PersonalizationValues {
  return {
    className: profile?.className ?? null,
    // The only stream offered is the default, so a new student starts with it chosen.
    stream: profile?.stream ?? STREAM_OPTIONS[0].value,
    targetMonth: profile?.targetMonth ?? null,
    dailyMinutes: profile?.dailyMinutes ?? DEFAULT_DAILY_MINUTES,
  };
}

/**
 * Client-side validation, so the student gets an instant message. The server
 * validates again and is the authority.
 *
 * `allowMonth` lets an unchanged, already-past month through, matching the
 * server (which only checks a month when it changes).
 */
export function validatePersonalization(
  values: PersonalizationValues,
  options: { now?: Date; unchangedMonth?: string | null } = {},
): PersonalizationErrors {
  const errors: PersonalizationErrors = {};
  if (!values.className) errors.className = "Choose your class.";
  if (!values.stream) errors.stream = "Choose your stream.";
  if (!values.targetMonth) {
    errors.targetMonth = "Pick the month you are aiming for.";
  } else if (values.targetMonth !== options.unchangedMonth) {
    const { min, max } = targetMonthBounds(options.now);
    if (!isMonthInRange(values.targetMonth, min, max)) {
      errors.targetMonth = "Pick this month or a later one, up to 24 months ahead.";
    }
  }
  if (
    !Number.isInteger(values.dailyMinutes) ||
    values.dailyMinutes < MIN_DAILY_MINUTES ||
    values.dailyMinutes > MAX_DAILY_MINUTES
  ) {
    errors.dailyMinutes = `Choose between ${MIN_DAILY_MINUTES} and ${MAX_DAILY_MINUTES} minutes a day.`;
  }
  return errors;
}

/** "2 h", "1 h 30 min", "45 min". */
export function formatDailyMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export interface SavePersonalizationResult {
  user: AuthenticatedUser;
  targetMonthChanged: boolean;
}

export async function savePersonalization(
  values: PersonalizationValues,
): Promise<SavePersonalizationResult> {
  return apiFetch<SavePersonalizationResult>("/api/users/me/personalization", {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

/**
 * Whether to ask a signed-in user to finish setting up their profile: students
 * only (admins have no study plan), once, until class, stream and month are all
 * set. "Skip for now" hides it for the rest of the browser session.
 */
export function shouldShowSetup(
  user: AuthenticatedUser | null,
  skippedThisSession: boolean,
): boolean {
  return (
    user !== null &&
    user.role === "student" &&
    user.personalization.completedAt === null &&
    !skippedThisSession
  );
}

const SKIP_KEY_PREFIX = "jee-ai:profile-setup-skipped:";

/** sessionStorage can throw (private mode, blocked storage); treat that as "not skipped". */
export function wasSetupSkipped(userId: string): boolean {
  try {
    return window.sessionStorage.getItem(SKIP_KEY_PREFIX + userId) === "1";
  } catch {
    return false;
  }
}

export function rememberSetupSkipped(userId: string): void {
  try {
    window.sessionStorage.setItem(SKIP_KEY_PREFIX + userId, "1");
  } catch {
    // Not remembering is harmless: the prompt simply shows again next page load.
  }
}
