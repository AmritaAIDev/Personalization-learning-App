import { LearningTopicStatus } from '../adaptive/adaptive.types';
import {
  chapterProgress,
  mean,
  topicProgress,
  type TopicProgress,
} from './catalog.progress';

const t = (
  status: TopicProgress['status'],
  score: number | null,
): TopicProgress => ({ status, score, answered: score === null ? 0 : 10 });

describe('topicProgress', () => {
  it('is NOT_STARTED with no score when there is no learning state', () => {
    expect(topicProgress(undefined)).toEqual({
      status: 'NOT_STARTED',
      score: null,
      answered: 0,
    });
  });

  it('maps learning statuses and rounds accuracy', () => {
    expect(
      topicProgress({
        status: LearningTopicStatus.MASTERED,
        totalAnswered: 3,
        totalCorrect: 2,
      }),
    ).toEqual({ status: 'MASTERED', score: 67, answered: 3 });
    expect(
      topicProgress({
        status: LearningTopicStatus.PAUSED_FOR_PREREQUISITE,
        totalAnswered: 4,
        totalCorrect: 1,
      }).status,
    ).toBe('PAUSED');
  });

  it('leaves the score null when nothing was answered yet', () => {
    expect(
      topicProgress({
        status: LearningTopicStatus.ACTIVE,
        totalAnswered: 0,
        totalCorrect: 0,
      }),
    ).toEqual({ status: 'ACTIVE', score: null, answered: 0 });
  });
});

describe('chapterProgress', () => {
  it('is NOT_STARTED for an untouched or empty chapter', () => {
    expect(chapterProgress([]).status).toBe('NOT_STARTED');
    expect(
      chapterProgress([t('NOT_STARTED', null), t('NOT_STARTED', null)]).status,
    ).toBe('NOT_STARTED');
  });

  it('is MASTERED only when every topic is mastered', () => {
    expect(chapterProgress([t('MASTERED', 90), t('MASTERED', 80)]).status).toBe(
      'MASTERED',
    );
    expect(
      chapterProgress([t('MASTERED', 90), t('NOT_STARTED', null)]).status,
    ).toBe('IN_PROGRESS');
  });

  it('flags NEEDS_WORK when started with low accuracy', () => {
    expect(chapterProgress([t('ACTIVE', 30), t('NOT_STARTED', null)])).toEqual({
      status: 'NEEDS_WORK',
      score: 30,
      masteredTopics: 0,
      startedTopics: 1,
    });
  });

  it('averages only topics that have a score', () => {
    expect(
      chapterProgress([t('ACTIVE', 60), t('ACTIVE', 80), t('ACTIVE', null)])
        .score,
    ).toBe(70);
  });

  it('mean of nothing is null', () => {
    expect(mean([])).toBeNull();
  });
});
