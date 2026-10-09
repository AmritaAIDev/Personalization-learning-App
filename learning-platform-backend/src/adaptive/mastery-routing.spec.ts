import { LearningSessionTransition } from './adaptive.types';
import {
  resolveCoordinateCompletion,
  resolveSecondFailure,
  skipAheadLevelFromEvidence,
} from './mastery-routing';

describe('mastery routing', () => {
  it('advances once first-try accuracy reaches 80%, but reinforces below it', () => {
    // 3 of 5 first-try correct is below the 80% bar -> reinforce.
    expect(resolveCoordinateCompletion(4, 3, 5)).toEqual({
      transition: LearningSessionTransition.REINFORCE,
      nextLevel: 4,
    });
    // 4 of 5 first-try correct clears the bar -> advance.
    expect(resolveCoordinateCompletion(5, 4, 5)).toEqual({
      transition: LearningSessionTransition.ADVANCED,
      nextLevel: 6,
    });
  });

  it('marks the final coordinate as mastered', () => {
    expect(resolveCoordinateCompletion(12, 5, 5)).toEqual({
      transition: LearningSessionTransition.MASTERED,
      nextLevel: null,
    });
  });

  it('keeps legacy out-of-range levels safe as mastered rather than crashing', () => {
    expect(resolveCoordinateCompletion(15, 5, 5)).toEqual({
      transition: LearningSessionTransition.MASTERED,
      nextLevel: null,
    });
  });

  it('demotes across the difficulty boundary and respects the floor', () => {
    expect(resolveSecondFailure(6, false)).toEqual({
      transition: LearningSessionTransition.DEMOTED,
      nextLevel: 5,
    });
    expect(resolveSecondFailure(1, true)).toEqual({
      transition: LearningSessionTransition.PREREQUISITE,
      nextLevel: null,
    });
    expect(resolveSecondFailure(1, false)).toEqual({
      transition: LearningSessionTransition.REINFORCE,
      nextLevel: 1,
    });
  });
});

describe('skipAheadLevelFromEvidence', () => {
  it('ignores thin evidence', () => {
    expect(skipAheadLevelFromEvidence(0.99, 4)).toBeNull();
    expect(skipAheadLevelFromEvidence(0.99, 0)).toBeNull();
  });

  it('lands strong evidence on level 8, moderate on level 4', () => {
    expect(skipAheadLevelFromEvidence(0.9, 12)).toBe(8);
    expect(skipAheadLevelFromEvidence(0.85, 5)).toBe(8);
    expect(skipAheadLevelFromEvidence(0.6, 5)).toBe(4);
    expect(skipAheadLevelFromEvidence(0.55, 9)).toBe(4);
  });

  it('leaves weak learners at normal placement', () => {
    expect(skipAheadLevelFromEvidence(0.3, 20)).toBeNull();
  });
});
