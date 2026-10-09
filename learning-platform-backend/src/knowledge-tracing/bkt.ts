/**
 * Bayesian Knowledge Tracing — the model behind `skill_mastery`.
 *
 * BKT represents a learner's knowledge of one skill (here: a subject /
 * chapter / topic triple) as a single probability P(L) that the skill is
 * learned, and updates it after every graded observation. Compared to the
 * raw accuracy percentage the catalog shows, BKT is deliberately humble on
 * small samples: one lucky correct answer moves P(L) a modest step, not to
 * "100% mastered", and repeated failures drive it down towards the floor.
 *
 * Model per observation (standard BKT, single knowledge component):
 *   posterior after correct:  P(L|✓)  = P(L)(1−S) / [P(L)(1−S) + (1−P(L))G]
 *   posterior after wrong:    P(L|✗)  = P(L)S     / [P(L)S     + (1−P(L))(1−G)]
 *   learning transition:      P(L')   = P(L|obs) + (1 − P(L|obs)) · T
 *
 * The four parameters are global defaults for now (values sit inside the
 * ranges reported in the literature, e.g. Baker & Inventado 2014). Fitting
 * them per-skill by EM on the answer corpus is the documented next step —
 * same trajectory as the FSRS optimiser took — which is why every function
 * here takes the parameters explicitly instead of hard-coding them.
 */

export interface BktParams {
  /** Prior probability the skill is already learned before any observation. */
  pL0: number;
  /** Per-opportunity probability of moving from unlearned to learned. */
  pT: number;
  /** Probability an unlearned learner answers correctly anyway. */
  pG: number;
  /** Probability a learned learner slips and answers wrong. */
  pS: number;
}

/**
 * Conservative defaults for JEE aspirants: a small prior (we do not assume
 * the topic was studied), a moderate learning rate, and guess/slip rates in
 * the commonly reported ranges. Tunable per deployment; kept as a single
 * constant so the whole product shares one model.
 */
export const DEFAULT_BKT_PARAMS: BktParams = {
  pL0: 0.2,
  pT: 0.15,
  pG: 0.25,
  pS: 0.1,
};

/** Display bands over P(L), chosen so they agree with the catalog's story:
 *  below COMPLETED-equivalent is genuinely shaky, ≥0.85 is dependable. */
export const MASTERY_BANDS = {
  MASTERED_AT: 0.85,
  DEVELOPING_AT: 0.55,
} as const;

export type MasteryBand = 'mastered' | 'developing' | 'weak' | 'unseen';

/** Clamp helper guarding against float drift outside [0, 1]. */
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * One BKT update: posterior given the observation, then the learning
 * transition. `observations` are chronological (oldest first) at the call
 * site so recency naturally dominates the trace.
 */
export function bktUpdate(
  pLearned: number,
  correct: boolean,
  params: BktParams,
): number {
  const pL = clamp01(pLearned);
  const evidence = correct
    ? pL * (1 - params.pS) + (1 - pL) * params.pG
    : pL * params.pS + (1 - pL) * (1 - params.pG);
  if (evidence === 0) return pL;
  const posterior = correct
    ? (pL * (1 - params.pS)) / evidence
    : (pL * params.pS) / evidence;
  return clamp01(posterior + (1 - posterior) * params.pT);
}

/** Fold a skill's whole graded history into a single P(Learned). */
export function bktTrace(
  observations: readonly boolean[],
  params: BktParams = DEFAULT_BKT_PARAMS,
): number {
  return observations.reduce(
    (pL, correct) => bktUpdate(pL, correct, params),
    params.pL0,
  );
}

/**
 * Map P(L) plus the evidence volume onto the four display bands. Skills with
 * fewer than LOW_DATA_ATTEMPTS observations are flagged low-confidence by
 * callers; the band itself only describes the probability.
 */
export function masteryBand(pKnow: number, attempts: number): MasteryBand {
  if (attempts === 0) return 'unseen';
  if (pKnow >= MASTERY_BANDS.MASTERED_AT) return 'mastered';
  if (pKnow >= MASTERY_BANDS.DEVELOPING_AT) return 'developing';
  return 'weak';
}

/** Below this many graded observations the estimate is statistically thin. */
export const LOW_DATA_ATTEMPTS = 3;
