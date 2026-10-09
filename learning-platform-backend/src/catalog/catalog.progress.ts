import { LearningTopicStatus } from '../adaptive/adaptive.types';
import type { AccuracyStat } from './catalog.analytics.types';
import type {
  ChapterProgressStatus,
  MasteryLevel,
  TopicProgressStatus,
} from './catalog.types';

/**
 * Score bands ported from JEE Compass (`curriculum.js` / `SubjectDetail`):
 *  - a chapter below COMPLETED_AT has not really been learned yet,
 *  - COMPLETED_AT up to MASTERED_AT counts as "in progress",
 *  - MASTERED_AT and above is "mastered".
 */
export const COMPLETED_AT = 40;
export const MASTERED_AT = 70;

/** Compass "mastery levels": 20-point bands with a 1-5 star rating. */
const MASTERY_LEVELS: ReadonlyArray<{
  min: number;
  label: string;
  stars: number;
}> = [
  { min: 0, label: 'Beginner', stars: 1 },
  { min: 20, label: 'Developing', stars: 2 },
  { min: 40, label: 'Proficient', stars: 3 },
  { min: 60, label: 'Advanced', stars: 4 },
  { min: 80, label: 'Master', stars: 5 },
];

/** Null score (nothing answered yet) has no level, never "Beginner". */
export function masteryLevel(score: number | null): MasteryLevel | null {
  if (score === null) return null;
  const bounded = Math.max(0, Math.min(100, score));
  let level = MASTERY_LEVELS[0];
  for (const candidate of MASTERY_LEVELS) {
    if (bounded >= candidate.min) level = candidate;
  }
  const next = MASTERY_LEVELS.find((candidate) => candidate.min > bounded);
  return {
    label: level.label,
    stars: level.stars,
    next: next ? { label: next.label, pointsNeeded: next.min - bounded } : null,
  };
}

export interface TopicStateInput {
  status: LearningTopicStatus;
}

export interface TopicProgress {
  status: TopicProgressStatus;
  score: number | null;
  answered: number;
}

/**
 * A topic's score always comes from its graded answers (every source, see
 * answer-events.query.ts). Its status comes from the adaptive engine when it
 * has tracked the topic (mastered / paused), otherwise it is simply active
 * once the student has answered anything and not started before that.
 */
export function topicProgress(
  state: TopicStateInput | undefined,
  answers: AccuracyStat,
): TopicProgress {
  let status: TopicProgressStatus;
  if (state) {
    status =
      state.status === LearningTopicStatus.MASTERED
        ? 'MASTERED'
        : state.status === LearningTopicStatus.PAUSED_FOR_PREREQUISITE
          ? 'PAUSED'
          : 'ACTIVE';
  } else {
    status = answers.answered > 0 ? 'ACTIVE' : 'NOT_STARTED';
  }
  return { status, score: answers.accuracy, answered: answers.answered };
}

export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export interface ChapterProgress {
  status: ChapterProgressStatus;
  score: number | null;
  mastery: MasteryLevel | null;
  masteredTopics: number;
  startedTopics: number;
}

/** Status from the chapter's score, using the Compass bands above. */
export function chapterStatusFromScore(
  score: number | null,
  started: boolean,
): ChapterProgressStatus {
  if (score === null) return started ? 'IN_PROGRESS' : 'NOT_STARTED';
  if (score < COMPLETED_AT) return 'NEEDS_WORK';
  if (score < MASTERED_AT) return 'IN_PROGRESS';
  return 'MASTERED';
}

/**
 * `score` is the chapter's pooled accuracy over all its graded answers, the
 * same number the analytics page shows for the chapter.
 */
export function chapterProgress(
  topics: readonly TopicProgress[],
  score: number | null,
): ChapterProgress {
  const masteredTopics = topics.filter((t) => t.status === 'MASTERED').length;
  const startedTopics = topics.filter((t) => t.status !== 'NOT_STARTED').length;
  return {
    status: chapterStatusFromScore(score, startedTopics > 0),
    score,
    mastery: masteryLevel(score),
    masteredTopics,
    startedTopics,
  };
}
