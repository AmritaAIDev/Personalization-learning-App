import {
  DIFFICULTY_MIX,
  getTargetPressure,
  NO_TARGET_PRESSURE,
  WEAK_TOPIC_LIMIT_BY_PHASE,
} from './target-pressure';

describe('getTargetPressure', () => {
  // 2026-10-10 in IST.
  const now = new Date('2026-10-10T06:00:00Z');

  it('has no pressure without a target or with a malformed one', () => {
    expect(getTargetPressure(null, now)).toEqual(NO_TARGET_PRESSURE);
    expect(getTargetPressure(undefined, now)).toEqual(NO_TARGET_PRESSURE);
    expect(getTargetPressure('soon', now)).toEqual(NO_TARGET_PRESSURE);
  });

  it('has no pressure once the target month is over', () => {
    expect(getTargetPressure('2026-09', now)).toEqual(NO_TARGET_PRESSURE);
  });

  it('counts days to the last day of the target month', () => {
    expect(getTargetPressure('2026-10', now)).toEqual({
      phase: 'sprint',
      daysLeft: 21,
    });
  });

  it('moves from foundation to consolidation to sprint', () => {
    expect(getTargetPressure('2027-06', now).phase).toBe('foundation');
    expect(getTargetPressure('2026-12', now).phase).toBe('consolidation');
    expect(getTargetPressure('2026-10', now).phase).toBe('sprint');
  });

  it('uses the IST day, not the UTC day, near midnight', () => {
    // 2026-10-31 20:00 UTC is already 2026-11-01 in IST.
    const lateUtc = new Date('2026-10-31T20:00:00Z');
    expect(getTargetPressure('2026-10', lateUtc)).toEqual(NO_TARGET_PRESSURE);
  });
});

describe('phase tables', () => {
  it('always asks for 15 practice questions', () => {
    for (const mix of Object.values(DIFFICULTY_MIX)) {
      expect(mix.reduce((sum, count) => sum + count, 0)).toBe(15);
    }
  });

  it('lists at least as many weak topics as the target gets closer', () => {
    expect(WEAK_TOPIC_LIMIT_BY_PHASE.sprint).toBeGreaterThanOrEqual(
      WEAK_TOPIC_LIMIT_BY_PHASE.consolidation,
    );
    expect(WEAK_TOPIC_LIMIT_BY_PHASE.consolidation).toBeGreaterThanOrEqual(
      WEAK_TOPIC_LIMIT_BY_PHASE.foundation,
    );
  });
});
