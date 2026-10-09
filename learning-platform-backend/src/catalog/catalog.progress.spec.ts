import { LearningTopicStatus } from '../adaptive/adaptive.types';
import {
  chapterProgress,
  chapterStatusFromScore,
  countStatuses,
  masteryLevel,
  rollUpLearningStatus,
  sumCounts,
  topicLearningStatus,
  mean,
  topicProgress,
  type TopicProgress,
} from './catalog.progress';

const t = (
  status: TopicProgress['status'],
  score: number | null,
): TopicProgress => ({ status, score, answered: score === null ? 0 : 10 });

const answers = (answered: number, correct: number) => ({
  answered,
  correct,
  accuracy: answered > 0 ? Math.round((correct / answered) * 100) : null,
});

describe('topicProgress', () => {
  it('is NOT_STARTED with no score when untracked and unanswered', () => {
    expect(topicProgress(undefined, answers(0, 0))).toEqual({
      status: 'NOT_STARTED',
      score: null,
      answered: 0,
    });
  });

  it('is ACTIVE once answered, even if the adaptive engine never tracked it', () => {
    expect(topicProgress(undefined, answers(3, 2))).toEqual({
      status: 'ACTIVE',
      score: 67,
      answered: 3,
    });
  });

  it('takes mastered / paused status from the adaptive engine', () => {
    expect(
      topicProgress({ status: LearningTopicStatus.MASTERED }, answers(3, 2)),
    ).toEqual({ status: 'MASTERED', score: 67, answered: 3 });
    expect(
      topicProgress(
        { status: LearningTopicStatus.PAUSED_FOR_PREREQUISITE },
        answers(4, 1),
      ).status,
    ).toBe('PAUSED');
  });

  it('leaves the score null when nothing was answered yet', () => {
    expect(
      topicProgress({ status: LearningTopicStatus.ACTIVE }, answers(0, 0)),
    ).toEqual({ status: 'ACTIVE', score: null, answered: 0 });
  });
});

describe('masteryLevel (JEE Compass bands)', () => {
  it.each([
    [0, 'Beginner', 1],
    [19, 'Beginner', 1],
    [20, 'Developing', 2],
    [39, 'Developing', 2],
    [40, 'Proficient', 3],
    [59, 'Proficient', 3],
    [60, 'Advanced', 4],
    [79, 'Advanced', 4],
    [80, 'Master', 5],
    [100, 'Master', 5],
  ])('score %i is %s with %i stars', (score, label, stars) => {
    expect(masteryLevel(score)).toMatchObject({ label, stars });
  });

  it('has no level without a score, instead of calling it Beginner', () => {
    expect(masteryLevel(null)).toBeNull();
  });

  it('reports how far the next band is, and none at the top', () => {
    expect(masteryLevel(55)?.next).toEqual({
      label: 'Advanced',
      pointsNeeded: 5,
    });
    expect(masteryLevel(95)?.next).toBeNull();
  });

  it('clamps out-of-range scores', () => {
    expect(masteryLevel(-5)?.label).toBe('Beginner');
    expect(masteryLevel(140)?.label).toBe('Master');
  });
});

describe('chapterStatusFromScore (Compass: <40 needs work, <70 in progress)', () => {
  it.each([
    [null, false, 'NOT_STARTED'],
    [null, true, 'IN_PROGRESS'],
    [0, true, 'NEEDS_WORK'],
    [39, true, 'NEEDS_WORK'],
    [40, true, 'IN_PROGRESS'],
    [69, true, 'IN_PROGRESS'],
    [70, true, 'MASTERED'],
    [100, true, 'MASTERED'],
  ] as const)('score %s (started %s) -> %s', (score, started, expected) => {
    expect(chapterStatusFromScore(score, started)).toBe(expected);
  });
});

describe('chapterProgress', () => {
  it('is NOT_STARTED for an untouched or empty chapter', () => {
    expect(chapterProgress([], null).status).toBe('NOT_STARTED');
    expect(
      chapterProgress([t('NOT_STARTED', null), t('NOT_STARTED', null)], null)
        .status,
    ).toBe('NOT_STARTED');
  });

  it('derives status and mastery from the pooled chapter score', () => {
    const result = chapterProgress(
      [t('MASTERED', 90), t('ACTIVE', 60), t('NOT_STARTED', null)],
      75,
    );
    expect(result).toMatchObject({
      status: 'MASTERED',
      score: 75,
      masteredTopics: 1,
      startedTopics: 2,
    });
    expect(result.mastery?.label).toBe('Advanced');
  });

  it('flags NEEDS_WORK when started with a low score', () => {
    expect(
      chapterProgress([t('ACTIVE', 30), t('NOT_STARTED', null)], 30),
    ).toMatchObject({ status: 'NEEDS_WORK', score: 30, startedTopics: 1 });
  });

  it('is IN_PROGRESS when started but nothing has been scored yet', () => {
    expect(chapterProgress([t('ACTIVE', null)], null)).toMatchObject({
      status: 'IN_PROGRESS',
      score: null,
      mastery: null,
    });
  });

  it('scores a chapter that has answers but no tracked sub-topics', () => {
    expect(chapterProgress([], 55)).toMatchObject({
      status: 'IN_PROGRESS',
      score: 55,
    });
  });

  it('mean of nothing is null', () => {
    expect(mean([])).toBeNull();
  });
});

describe('topicLearningStatus (Completed / In Progress / Pending)', () => {
  const topic = (
    status: TopicProgress['status'],
    score: number | null,
    answered: number,
  ) => ({ status, score, answered });

  it('is Pending with no answers and no tracked state', () => {
    expect(topicLearningStatus(topic('NOT_STARTED', null, 0))).toBe('PENDING');
  });

  it('is Completed when the adaptive engine says MASTERED, whatever the score', () => {
    expect(topicLearningStatus(topic('MASTERED', null, 0))).toBe('COMPLETED');
    expect(topicLearningStatus(topic('MASTERED', 30, 3))).toBe('COMPLETED');
  });

  it('needs at least 5 answers for a 40%+ score to count as Completed', () => {
    expect(topicLearningStatus(topic('ACTIVE', 100, 1))).toBe('IN_PROGRESS');
    expect(topicLearningStatus(topic('ACTIVE', 100, 4))).toBe('IN_PROGRESS');
    expect(topicLearningStatus(topic('ACTIVE', 100, 5))).toBe('COMPLETED');
    expect(topicLearningStatus(topic('ACTIVE', 40, 5))).toBe('COMPLETED');
    expect(topicLearningStatus(topic('ACTIVE', 39, 50))).toBe('IN_PROGRESS');
  });

  it('is In Progress for any answered topic below the completion bar, and for tracked-but-unanswered ones', () => {
    expect(topicLearningStatus(topic('ACTIVE', 20, 2))).toBe('IN_PROGRESS');
    expect(topicLearningStatus(topic('ACTIVE', null, 0))).toBe('IN_PROGRESS');
    expect(topicLearningStatus(topic('PAUSED', 10, 6))).toBe('IN_PROGRESS');
  });
});

describe('rollUpLearningStatus and counts', () => {
  it('rolls a group of statuses up', () => {
    expect(rollUpLearningStatus([])).toBe('PENDING');
    expect(rollUpLearningStatus(['COMPLETED', 'COMPLETED'])).toBe('COMPLETED');
    expect(rollUpLearningStatus(['PENDING', 'PENDING'])).toBe('PENDING');
    expect(rollUpLearningStatus(['COMPLETED', 'PENDING'])).toBe('IN_PROGRESS');
    expect(rollUpLearningStatus(['IN_PROGRESS', 'PENDING'])).toBe(
      'IN_PROGRESS',
    );
  });

  it('counts statuses and the completed percent, never dividing by zero', () => {
    expect(countStatuses([])).toEqual({
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      percent: 0,
    });
    expect(
      countStatuses(['COMPLETED', 'IN_PROGRESS', 'PENDING', 'PENDING']),
    ).toEqual({
      total: 4,
      completed: 1,
      inProgress: 1,
      pending: 2,
      percent: 25,
    });
  });

  it('adds counts together and recomputes the percent from the totals', () => {
    const a = countStatuses(['COMPLETED', 'PENDING']); // 50%
    const b = countStatuses(['COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING']); // 75%
    expect(sumCounts([a, b])).toEqual({
      total: 6,
      completed: 4,
      inProgress: 0,
      pending: 2,
      percent: 67, // 4 of 6, not the average of 50 and 75
    });
    expect(sumCounts([]).percent).toBe(0);
  });
});
