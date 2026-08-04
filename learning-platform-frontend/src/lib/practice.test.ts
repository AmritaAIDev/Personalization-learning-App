import { describe, expect, it } from 'vitest';
import {
  elapsedPracticeSeconds,
  nextUnansweredIndex,
  practiceHref,
  practiceScopeFromSearchParams,
  summarizePracticeProgress,
} from './practice';

describe('practice route helpers', () => {
  it('builds practice workspace URLs with encoded topic scope', () => {
    expect(
      practiceHref({
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
      }),
    ).toBe('/practice?subject=Physics&chapter=Electrostatics&topic=Gauss+Law');
  });

  it('accepts only complete practice scopes from search params', () => {
    expect(
      practiceScopeFromSearchParams(
        new URLSearchParams('subject=Physics&chapter=Electrostatics&topic=Gauss+Law'),
      ),
    ).toEqual({
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
    });

    expect(practiceScopeFromSearchParams(new URLSearchParams('subject=Physics'))).toBeNull();
  });
});

describe('practice attempt progress', () => {
  const questionIds = ['q1', 'q2', 'q3', 'q4'];

  it('separates answered, unanswered, and marked questions', () => {
    const progress = summarizePracticeProgress(
      questionIds,
      { q1: 'A', q3: 'C' },
      new Set(['q3', 'q4']),
    );

    expect(progress.answered).toBe(2);
    expect(progress.unanswered).toEqual([2, 4]);
    expect(progress.markedForReview).toEqual([3, 4]);
    expect(progress.firstUnansweredIndex).toBe(1);
  });

  it('reports a complete attempt with no gaps', () => {
    const progress = summarizePracticeProgress(
      questionIds,
      { q1: 'A', q2: 'B', q3: 'C', q4: 'D' },
      new Set(),
    );

    expect(progress.unanswered).toEqual([]);
    expect(progress.firstUnansweredIndex).toBeNull();
  });

  it('wraps to the earliest gap when searching forward', () => {
    expect(nextUnansweredIndex(questionIds, { q1: 'A', q3: 'C' }, 2)).toBe(3);
    expect(nextUnansweredIndex(questionIds, { q2: 'B', q3: 'C' }, 2)).toBe(3);
    expect(nextUnansweredIndex(questionIds, { q1: 'A', q2: 'B', q4: 'D' }, 3)).toBe(2);
  });

  it('returns null when nothing is left to answer', () => {
    expect(
      nextUnansweredIndex(questionIds, { q1: 'A', q2: 'B', q3: 'C', q4: 'D' }, 0),
    ).toBeNull();
  });
});

describe('practice answer timing', () => {
  it('measures seconds from a timestamp and clamps to the accepted range', () => {
    expect(elapsedPracticeSeconds(Date.now() - 5_000)).toBe(5);
    expect(elapsedPracticeSeconds(Date.now() - 10 * 60 * 60 * 1000)).toBe(3600);
    expect(elapsedPracticeSeconds('not-a-date')).toBe(0);
  });
});
