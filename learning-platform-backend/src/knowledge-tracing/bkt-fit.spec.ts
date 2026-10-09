import { BktParams } from './bkt';
import { bktSequenceLogLikelihood, fitBktParams } from './bkt-fit';

/** Deterministic PRNG (mulberry32) so recovery tests never flake. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simulate the generative BKT process: latent state, then an emission. */
function simulateSequences(
  params: BktParams,
  count: number,
  length: number,
  seed: number,
): boolean[][] {
  const random = rng(seed);
  const sequences: boolean[][] = [];
  for (let s = 0; s < count; s += 1) {
    let learned = random() < params.pL0;
    const observations: boolean[] = [];
    for (let i = 0; i < length; i += 1) {
      if (!learned && random() < params.pT) learned = true;
      const correct = learned ? random() > params.pS : random() < params.pG;
      observations.push(correct);
    }
    sequences.push(observations);
  }
  return sequences;
}

describe('bktSequenceLogLikelihood', () => {
  it('matches the hand-computed single-step case', () => {
    const params: BktParams = { pL0: 0.3, pT: 0.2, pG: 0.2, pS: 0.1 };
    const expected = Math.log(0.3 * 0.9 + 0.7 * 0.2); // P(correct)
    expect(bktSequenceLogLikelihood([true], params)).toBeCloseTo(expected, 10);
  });

  it('returns 0 for empty sequences', () => {
    expect(
      bktSequenceLogLikelihood([], { pL0: 0.5, pT: 0.1, pG: 0.2, pS: 0.1 }),
    ).toBe(0);
  });

  it('prefers high-mastery parameters for an all-correct sequence', () => {
    const high = bktSequenceLogLikelihood([true, true, true, true], {
      pL0: 0.8,
      pT: 0.1,
      pG: 0.2,
      pS: 0.05,
    });
    const low = bktSequenceLogLikelihood([true, true, true, true], {
      pL0: 0.05,
      pT: 0.01,
      pG: 0.1,
      pS: 0.4,
    });
    expect(high).toBeGreaterThan(low);
  });

  it('stays finite on long sequences (rescaling works)', () => {
    const long = Array.from({ length: 200 }, () => true);
    const ll = bktSequenceLogLikelihood(long, {
      pL0: 0.05,
      pT: 0.01,
      pG: 0.01,
      pS: 0.01,
    });
    expect(Number.isFinite(ll)).toBe(true);
    expect(ll).toBeLessThan(0);
  });
});

describe('fitBktParams — synthetic recovery', () => {
  it('recovers the generating parameters from enough sequences', () => {
    const truth: BktParams = { pL0: 0.3, pT: 0.2, pG: 0.2, pS: 0.1 };
    const sequences = simulateSequences(truth, 800, 10, 42);
    const fit = fitBktParams(sequences);

    // MLE property: the fitted parameters must explain the data at least
    // as well as the true ones (up to grid rounding).
    const truthLl = sequences.reduce(
      (sum, s) => sum + bktSequenceLogLikelihood(s, truth),
      0,
    );
    expect(fit.logLikelihood).toBeGreaterThanOrEqual(truthLl - 1);

    // pL0 is only identified up to its classic trade-off with pT/pG, so its
    // recovery bounds are deliberately wider than the grid step.
    expect(fit.params.pT).toBeGreaterThan(0.08);
    expect(fit.params.pT).toBeLessThan(0.4);
    expect(Math.abs(fit.params.pG - truth.pG)).toBeLessThan(0.12);
    expect(Math.abs(fit.params.pS - truth.pS)).toBeLessThan(0.12);
    expect(fit.params.pL0).toBeGreaterThan(0.05);
    expect(fit.params.pL0).toBeLessThan(0.6);
    expect(fit.logLikelihood).toBeGreaterThanOrEqual(fit.baselineLogLikelihood);
  });

  it('is deterministic for the same data', () => {
    const sequences = simulateSequences(
      { pL0: 0.2, pT: 0.15, pG: 0.25, pS: 0.1 },
      60,
      6,
      7,
    );
    expect(fitBktParams(sequences).params).toEqual(
      fitBktParams(sequences).params,
    );
  });

  it('handles degenerate input without crashing', () => {
    const fit = fitBktParams([[], [true], [false]]);
    expect(fit.sequences).toBe(2); // empties dropped
    expect(Number.isFinite(fit.logLikelihood)).toBe(true);
  });
});
