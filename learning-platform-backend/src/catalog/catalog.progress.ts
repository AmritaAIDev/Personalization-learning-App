import { LearningTopicStatus } from '../adaptive/adaptive.types';
import type {
  ChapterProgressStatus,
  TopicProgressStatus,
} from './catalog.types';

/** Below this average accuracy a started chapter is flagged "needs work". */
export const NEEDS_WORK_BELOW = 40;

export interface TopicStateInput {
  status: LearningTopicStatus;
  totalAnswered: number;
  totalCorrect: number;
}

export interface TopicProgress {
  status: TopicProgressStatus;
  score: number | null;
  answered: number;
}

export function topicProgress(
  state: TopicStateInput | undefined,
): TopicProgress {
  if (!state) return { status: 'NOT_STARTED', score: null, answered: 0 };
  const status: TopicProgressStatus =
    state.status === LearningTopicStatus.MASTERED
      ? 'MASTERED'
      : state.status === LearningTopicStatus.PAUSED_FOR_PREREQUISITE
        ? 'PAUSED'
        : 'ACTIVE';
  return {
    status,
    score:
      state.totalAnswered > 0
        ? Math.round((state.totalCorrect / state.totalAnswered) * 100)
        : null,
    answered: state.totalAnswered,
  };
}

export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export interface ChapterProgress {
  status: ChapterProgressStatus;
  score: number | null;
  masteredTopics: number;
  startedTopics: number;
}

/**
 * A chapter is MASTERED only when it has topics and all are mastered;
 * NOT_STARTED when nothing was touched; NEEDS_WORK when it was started but
 * accuracy is low; otherwise IN_PROGRESS.
 */
export function chapterProgress(
  topics: readonly TopicProgress[],
): ChapterProgress {
  const masteredTopics = topics.filter((t) => t.status === 'MASTERED').length;
  const startedTopics = topics.filter((t) => t.status !== 'NOT_STARTED').length;
  const score = mean(
    topics.flatMap((t) => (t.score === null ? [] : [t.score])),
  );
  let status: ChapterProgressStatus;
  if (topics.length > 0 && masteredTopics === topics.length) {
    status = 'MASTERED';
  } else if (startedTopics === 0) {
    status = 'NOT_STARTED';
  } else if (score !== null && score < NEEDS_WORK_BELOW) {
    status = 'NEEDS_WORK';
  } else {
    status = 'IN_PROGRESS';
  }
  return { status, score, masteredTopics, startedTopics };
}
