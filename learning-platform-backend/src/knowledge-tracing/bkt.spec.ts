import {
  bktTrace,
  bktUpdate,
  DEFAULT_BKT_PARAMS,
  LOW_DATA_ATTEMPTS,
  MASTERY_BANDS,
  masteryBand,
} from './bkt';

describe('bktUpdate', () => {
  it('raises P(L) after a correct answer and lowers it after a wrong one', () => {
    const p = DEFAULT_BKT_PARAMS;
    expect(bktUpdate(0.5, true, p)).toBeGreaterThan(0.5);
    expect(bktUpdate(0.5, false, p)).toBeLessThan(0.5);
  });

  it('stays inside [0, 1] for any input sequence', () => {
    const p = { pL0: 0.5, pT: 0.9, pG: 0.9, pS: 0.9 };
    let pL = 0.5;
    for (const obs of [true, false, true, true, false, false, false, true]) {
      pL = bktUpdate(pL, obs, p);
      expect(pL).toBeGreaterThanOrEqual(0);
      expect(pL).toBeLessThanOrEqual(1);
    }
  });

  it('high guessing dampens the value of a correct answer', () => {
    const lowGuess = bktUpdate(0.4, true, { ...DEFAULT_BKT_PARAMS, pG: 0.05 });
    const highGuess = bktUpdate(0.4, true, { ...DEFAULT_BKT_PARAMS, pG: 0.45 });
    expect(lowGuess).toBeGreaterThan(highGuess);
  });

  it('high slip dampens the penalty of a wrong answer', () => {
    const lowSlip = bktUpdate(0.8, false, { ...DEFAULT_BKT_PARAMS, pS: 0.05 });
    const highSlip = bktUpdate(0.8, false, { ...DEFAULT_BKT_PARAMS, pS: 0.4 });
    expect(lowSlip).toBeLessThan(highSlip);
  });
});

describe('bktTrace — small-sample behaviour vs raw accuracy', () => {
  it('does not call a single lucky answer "mastered" (raw accuracy would)', () => {
    const pKnow = bktTrace([true]);
    // Raw percentage: 1/1 = 100%. BKT stays humble:
    expect(pKnow).toBeLessThan(MASTERY_BANDS.MASTERED_AT);
    expect(masteryBand(pKnow, 1)).not.toBe('mastered');
  });

  it('converges to mastered for sustained correct answers', () => {
    const pKnow = bktTrace([true, true, true, true, true]);
    expect(pKnow).toBeGreaterThanOrEqual(MASTERY_BANDS.MASTERED_AT);
    expect(masteryBand(pKnow, 5)).toBe('mastered');
  });

  it('drives an all-wrong history to weak', () => {
    const pKnow = bktTrace([false, false, false, false]);
    expect(masteryBand(pKnow, 4)).toBe('weak');
  });

  it('is recency-sensitive: recent failures erode earlier mastery', () => {
    const masteredThenFailed = bktTrace([
      true,
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
    expect(masteredThenFailed).toBeLessThan(MASTERY_BANDS.MASTERED_AT);
  });

  it('is deterministic for the same observation sequence', () => {
    const obs = [true, false, true, true, false];
    expect(bktTrace(obs)).toBe(bktTrace(obs));
  });
});

describe('masteryBand', () => {
  it('marks zero attempts as unseen regardless of probability', () => {
    expect(masteryBand(0.99, 0)).toBe('unseen');
  });

  it('applies the documented thresholds', () => {
    expect(masteryBand(0.85, 5)).toBe('mastered');
    expect(masteryBand(0.55, 5)).toBe('developing');
    expect(masteryBand(0.54, 5)).toBe('weak');
  });

  it('flags thin evidence as low confidence', () => {
    expect(LOW_DATA_ATTEMPTS).toBe(3);
  });
});
