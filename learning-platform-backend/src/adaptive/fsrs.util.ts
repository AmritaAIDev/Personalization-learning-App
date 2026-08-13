/**
 * FSRS-6 (Free Spaced Repetition Scheduler), the algorithm Anki has shipped
 * since 25.07. Ported directly from the official `ts-fsrs` package
 * (open-spaced-repetition/ts-fsrs, `packages/fsrs/src/algorithm.ts` and
 * `default.ts`) rather than re-derived, since the exact constants matter —
 * this is the published default parameter set (no per-user training, which
 * needs review-history volume this app doesn't have yet).
 *
 * Deliberately trimmed to what a review actually needs: no fuzzing, no
 * discrete Anki-style learning steps, no manual/reschedule grade. Difficulty
 * and stability are the only persisted memory state; `intervalDays` in the
 * database is a rounded, informational projection of stability for display
 * and `dueAt` filtering — never fed back into the algorithm.
 */

/** 1=Again, 2=Hard, 3=Good, 4=Easy — FSRS's Grade, excluding its unused Manual(0). */
export type FsrsGrade = 1 | 2 | 3 | 4;

export interface FsrsMemoryState {
  difficulty: number;
  stability: number;
}

const S_MIN = 0.001;
const S_MAX = 36_500;

// FSRS-6 default weights (w0..w20), open-spaced-repetition/ts-fsrs default_w.
export const FSRS_DEFAULT_WEIGHTS: readonly number[] = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666,
  0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658,
  0.1542,
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function decayFactor(w: readonly number[]): { decay: number; factor: number } {
  const decay = -w[20];
  const factor = Math.exp(Math.pow(decay, -1) * Math.log(0.9)) - 1.0;
  return { decay, factor };
}

/** R(t,S) = (1 + FACTOR * t / S) ^ DECAY — probability of recall after `elapsedDays`. */
export function forgettingCurve(
  elapsedDays: number,
  stability: number,
  w: readonly number[] = FSRS_DEFAULT_WEIGHTS,
): number {
  const { decay, factor } = decayFactor(w);
  return Math.pow(1 + (factor * elapsedDays) / stability, decay);
}

function initStability(w: readonly number[], g: FsrsGrade): number {
  return Math.max(w[g - 1], 0.1);
}

function initDifficulty(w: readonly number[], g: FsrsGrade): number {
  return clamp(w[4] - Math.exp((g - 1) * w[5]) + 1, 1, 10);
}

function linearDamping(deltaD: number, oldD: number): number {
  return (deltaD * (10 - oldD)) / 9;
}

function meanReversion(
  w: readonly number[],
  init: number,
  current: number,
): number {
  return w[7] * init + (1 - w[7]) * current;
}

function nextDifficulty(w: readonly number[], d: number, g: FsrsGrade): number {
  const deltaD = -w[6] * (g - 3);
  const nextD = d + linearDamping(deltaD, d);
  return clamp(meanReversion(w, initDifficulty(w, 4), nextD), 1, 10);
}

function nextRecallStability(
  w: readonly number[],
  d: number,
  s: number,
  r: number,
  g: FsrsGrade,
): number {
  const hardPenalty = g === 2 ? w[15] : 1;
  const easyBonus = g === 4 ? w[16] : 1;
  return clamp(
    s *
      (1 +
        Math.exp(w[8]) *
          (11 - d) *
          Math.pow(s, -w[9]) *
          (Math.exp((1 - r) * w[10]) - 1) *
          hardPenalty *
          easyBonus),
    S_MIN,
    S_MAX,
  );
}

function nextForgetStability(
  w: readonly number[],
  d: number,
  s: number,
  r: number,
): number {
  return clamp(
    w[11] *
      Math.pow(d, -w[12]) *
      (Math.pow(s + 1, w[13]) - 1) *
      Math.exp((1 - r) * w[14]),
    S_MIN,
    S_MAX,
  );
}

function nextShortTermStability(
  w: readonly number[],
  s: number,
  g: FsrsGrade,
): number {
  const sinc = Math.pow(s, -w[19]) * Math.exp(w[17] * (g - 3 + w[18]));
  const masked = g >= 2 ? Math.max(sinc, 1.0) : sinc;
  return clamp(s * masked, S_MIN, S_MAX);
}

/**
 * The core FSRS transition: current memory state (null for a first-ever
 * review) + days since the last review + this review's grade → next memory
 * state. `elapsedDays === 0` (reviewed again the same day, e.g. an AGAIN
 * card resurfacing later in the same deck run) takes FSRS's short-term path
 * for every grade, matching `ts-fsrs`'s `next_state`.
 */
export function nextFsrsState(
  current: FsrsMemoryState | null,
  elapsedDays: number,
  grade: FsrsGrade,
  w: readonly number[] = FSRS_DEFAULT_WEIGHTS,
): FsrsMemoryState {
  if (!current) {
    return {
      difficulty: initDifficulty(w, grade),
      stability: initStability(w, grade),
    };
  }

  const { difficulty: d, stability: s } = current;
  const r = forgettingCurve(elapsedDays, s, w);

  let nextStability: number;
  if (elapsedDays === 0) {
    nextStability = nextShortTermStability(w, s, grade);
  } else if (grade === 1) {
    const sAfterFail = nextForgetStability(w, d, s, r);
    const shortTermFloor = s / Math.exp(w[17] * w[18]);
    nextStability = clamp(shortTermFloor, S_MIN, sAfterFail);
  } else {
    nextStability = nextRecallStability(w, d, s, r, grade);
  }

  return { difficulty: nextDifficulty(w, d, grade), stability: nextStability };
}

/**
 * Days until the next review at `requestRetention` recall probability
 * (FSRS's `calculate_interval_modifier` × stability). Not floored to a
 * whole day like Anki's scheduler — a fresh AGAIN can legitimately resolve
 * to a same-day due time, which this app surfaces directly rather than
 * routing through Anki-style discrete learning steps.
 */
export function intervalDaysFromStability(
  stability: number,
  requestRetention = 0.9,
  w: readonly number[] = FSRS_DEFAULT_WEIGHTS,
): number {
  const { decay, factor } = decayFactor(w);
  const intervalModifier = (Math.pow(requestRetention, 1 / decay) - 1) / factor;
  return Math.max(stability * intervalModifier, 0.01);
}
