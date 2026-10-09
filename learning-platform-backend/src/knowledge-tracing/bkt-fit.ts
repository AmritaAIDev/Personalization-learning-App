import { BktParams, DEFAULT_BKT_PARAMS } from './bkt';

/**
 * Offline parameter fitting for the BKT model — the knowledge-tracing
 * counterpart of the FSRS weight optimiser.
 *
 * Given many learners' chronological correct/incorrect sequences for a
 * skill, choose (pL0, pT, pG, pS) that maximise the total log-likelihood of
 * the observed answers under the model. The likelihood is exact: BKT is a
 * two-state HMM (unlearned → learned, absorbing), evaluated with the
 * forward algorithm. Optimisation is deterministic coordinate ascent over
 * bounded grids — no randomness, reproducible from the sequences alone.
 */

/** Total log-likelihood of one observation sequence under the parameters. */
export function bktSequenceLogLikelihood(
  observations: readonly boolean[],
  params: BktParams,
): number {
  if (observations.length === 0) return 0;
  const { pL0, pT, pG, pS } = params;
  // alphaL / alphaU: probability of the observed prefix AND the latent state.
  let alphaL = pL0 * (observations[0] ? 1 - pS : pS);
  let alphaU = (1 - pL0) * (observations[0] ? pG : 1 - pG);
  let logScale = 0;
  for (let i = 1; i < observations.length; i += 1) {
    const correct = observations[i];
    const emitL = correct ? 1 - pS : pS;
    const emitU = correct ? pG : 1 - pG;
    // Learned is absorbing: everything still learned stays learned;
    // unlearned learners may transition in with probability pT.
    const nextL = (alphaL + alphaU * pT) * emitL;
    const nextU = alphaU * (1 - pT) * emitU;
    alphaL = nextL;
    alphaU = nextU;
    // Rescale to keep doubles away from underflow on long sequences.
    const total = alphaL + alphaU;
    if (total < 1e-250) {
      const scale = total || 1e-250;
      alphaL /= scale;
      alphaU /= scale;
      logScale += Math.log(scale);
    }
  }
  return Math.log(alphaL + alphaU) + logScale;
}

export interface BktFitResult {
  params: BktParams;
  logLikelihood: number;
  baselineLogLikelihood: number;
  sequences: number;
  observations: number;
  passes: number;
}

const GRIDS: Record<keyof BktParams, readonly number[]> = {
  pL0: range(0.05, 0.95, 0.05),
  pT: range(0.01, 0.6, 0.01),
  pG: range(0.01, 0.5, 0.01),
  pS: range(0.01, 0.5, 0.01),
};

function range(from: number, to: number, step: number): number[] {
  const values: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) {
    values.push(Math.round(v * 100) / 100);
  }
  return values;
}

function totalLogLikelihood(
  sequences: readonly (readonly boolean[])[],
  params: BktParams,
): number {
  return sequences.reduce(
    (sum, sequence) => sum + bktSequenceLogLikelihood(sequence, params),
    0,
  );
}

/**
 * Deterministic coordinate ascent: sweep each parameter over its grid,
 * keep the best value, repeat until a full pass improves nothing (or the
 * pass cap). Sequences with a single observation are included — they only
 * inform pL0/guess/slip jointly, which the likelihood handles correctly.
 */
export function fitBktParams(
  sequences: readonly (readonly boolean[])[],
  initial: BktParams = DEFAULT_BKT_PARAMS,
  maxPasses = 25,
): BktFitResult {
  const usable = sequences.filter((s) => s.length > 0);
  const current: BktParams = { ...initial };
  let best = totalLogLikelihood(usable, current);
  let passes = 0;

  for (; passes < maxPasses; passes += 1) {
    let improved = false;
    for (const key of Object.keys(GRIDS) as (keyof BktParams)[]) {
      let bestValue = current[key];
      let bestForParam = best;
      for (const candidate of GRIDS[key]) {
        const trial: BktParams = { ...current, [key]: candidate };
        const ll = totalLogLikelihood(usable, trial);
        if (ll > bestForParam + 1e-9) {
          bestForParam = ll;
          bestValue = candidate;
        }
      }
      if (bestValue !== current[key]) {
        current[key] = bestValue;
        best = bestForParam;
        improved = true;
      }
    }
    if (!improved) break;
  }

  return {
    params: current,
    logLikelihood: best,
    baselineLogLikelihood: totalLogLikelihood(usable, DEFAULT_BKT_PARAMS),
    sequences: usable.length,
    observations: usable.reduce((sum, s) => sum + s.length, 0),
    passes,
  };
}
