import {
  forgettingCurve,
  FSRS_DEFAULT_WEIGHTS,
  intervalDaysFromStability,
  nextFsrsState,
} from './fsrs.util';

describe('fsrs.util', () => {
  describe('nextFsrsState — first-ever review (no prior state)', () => {
    it('uses the grade-indexed default weight as initial stability', () => {
      expect(nextFsrsState(null, 0, 3).stability).toBeCloseTo(
        FSRS_DEFAULT_WEIGHTS[2],
        6,
      );
      expect(nextFsrsState(null, 0, 4).stability).toBeCloseTo(
        FSRS_DEFAULT_WEIGHTS[3],
        6,
      );
    });

    it('gives a harder first grade a higher initial difficulty', () => {
      const again = nextFsrsState(null, 0, 1).difficulty;
      const easy = nextFsrsState(null, 0, 4).difficulty;
      expect(again).toBeGreaterThan(easy);
    });

    it('keeps difficulty within the [1,10] band regardless of grade', () => {
      for (const grade of [1, 2, 3, 4] as const) {
        const { difficulty } = nextFsrsState(null, 0, grade);
        expect(difficulty).toBeGreaterThanOrEqual(1);
        expect(difficulty).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('nextFsrsState — subsequent reviews', () => {
    const learned = { difficulty: 5, stability: 10 };

    it('never shrinks stability on a successful (non-Again) recall after elapsed days', () => {
      for (const grade of [2, 3, 4] as const) {
        const next = nextFsrsState(learned, 5, grade);
        expect(next.stability).toBeGreaterThanOrEqual(learned.stability);
      }
    });

    it('can shrink stability on a lapse (Again) after elapsed days', () => {
      const next = nextFsrsState(learned, 5, 1);
      expect(next.stability).toBeLessThan(learned.stability);
    });

    it('never shrinks stability on a same-day (elapsedDays=0) non-Again review', () => {
      for (const grade of [2, 3, 4] as const) {
        const next = nextFsrsState(learned, 0, grade);
        expect(next.stability).toBeGreaterThanOrEqual(learned.stability);
      }
    });

    it('keeps difficulty within [1,10] across many repeated Again ratings', () => {
      let state = learned;
      for (let i = 0; i < 20; i += 1) {
        state = nextFsrsState(state, 1, 1);
      }
      expect(state.difficulty).toBeGreaterThanOrEqual(1);
      expect(state.difficulty).toBeLessThanOrEqual(10);
    });
  });

  describe('forgettingCurve', () => {
    it('is 1 (certain recall) at zero elapsed days', () => {
      expect(forgettingCurve(0, 10)).toBeCloseTo(1, 6);
    });

    it('decreases as elapsed days increase', () => {
      const soon = forgettingCurve(1, 10);
      const later = forgettingCurve(30, 10);
      expect(later).toBeLessThan(soon);
      expect(later).toBeGreaterThan(0);
    });

    it('crosses ~90% recall at t = stability, by construction', () => {
      expect(forgettingCurve(10, 10)).toBeCloseTo(0.9, 2);
    });
  });

  describe('intervalDaysFromStability', () => {
    it('is approximately equal to stability at the default 90% retention target', () => {
      expect(intervalDaysFromStability(10, 0.9)).toBeCloseTo(10, 1);
    });

    it('grows as the requested retention target drops', () => {
      const highRetention = intervalDaysFromStability(10, 0.95);
      const lowRetention = intervalDaysFromStability(10, 0.8);
      expect(lowRetention).toBeGreaterThan(highRetention);
    });

    it('scales linearly with stability for a fixed retention target', () => {
      const single = intervalDaysFromStability(5, 0.9);
      const doubled = intervalDaysFromStability(10, 0.9);
      expect(doubled).toBeCloseTo(single * 2, 4);
    });
  });
});
