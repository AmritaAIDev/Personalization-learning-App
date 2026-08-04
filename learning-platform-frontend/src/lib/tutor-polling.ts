/**
 * Poll schedule for a tutor reply that is being written in the background.
 *
 * The first checks are quick so a cached or fast reply appears almost
 * immediately; later checks back off so a slow model costs a handful of small
 * reads rather than a fixed-rate request storm. Returning `null` ends the wait,
 * which matches the server-side pending time-to-live.
 */
const TUTOR_POLL_DELAYS_MS = [
  600, 900, 1_200, 1_600, 2_000, 2_500, 3_000, 3_500, 4_000, 4_500, 5_000,
];

export function nextTutorPollDelay(attempt: number): number | null {
  if (attempt < 0) return TUTOR_POLL_DELAYS_MS[0];
  return TUTOR_POLL_DELAYS_MS[attempt] ?? null;
}

/** Total time the client will wait for a background reply, in milliseconds. */
export function totalTutorPollWindowMs(): number {
  return TUTOR_POLL_DELAYS_MS.reduce((sum, delay) => sum + delay, 0);
}
