import { LearningTopicStatus } from '../adaptive/adaptive.types';
import type { AccuracyStat } from './catalog.analytics.types';
import type {
  ChapterProgressStatus,
  LearningStatus,
  MasteryLevel,
  SyllabusCounts,
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

/**
 * The three words students see in the syllabus overview and the Subject >
 * Chapter > Topic drill-down (`LearningStatus`). Derived from the same answers
 * as everything else (see STUDY-PLAN-UI-PLAN.md section 3); the adaptive engine
 * contributes only its MASTERED status.
 */

/**
 * A topic needs this many graded answers before a score of COMPLETED_AT counts
 * as completion: one lucky answer must not complete a topic.
 */
export const MIN_COMPLETED_ANSWERS = 5;

export function topicLearningStatus(topic: {
  status: TopicProgressStatus;
  score: number | null;
  answered: number;
}): LearningStatus {
  if (topic.status === 'MASTERED') return 'COMPLETED';
  if (
    topic.answered >= MIN_COMPLETED_ANSWERS &&
    topic.score !== null &&
    topic.score >= COMPLETED_AT
  ) {
    return 'COMPLETED';
  }
  if (topic.answered > 0 || topic.status !== 'NOT_STARTED') {
    return 'IN_PROGRESS';
  }
  return 'PENDING';
}

/** A chapter or subject is COMPLETED when all its parts are, PENDING when none has started. */
export function rollUpLearningStatus(
  statuses: readonly LearningStatus[],
): LearningStatus {
  if (statuses.length === 0) return 'PENDING';
  if (statuses.every((status) => status === 'COMPLETED')) return 'COMPLETED';
  if (statuses.every((status) => status === 'PENDING')) return 'PENDING';
  return 'IN_PROGRESS';
}

export function percentOf(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

/** Counts of Completed / In Progress / Pending, with the completed percent. */
export function countStatuses(
  statuses: readonly LearningStatus[],
): SyllabusCounts {
  const completed = statuses.filter((s) => s === 'COMPLETED').length;
  const inProgress = statuses.filter((s) => s === 'IN_PROGRESS').length;
  return {
    total: statuses.length,
    completed,
    inProgress,
    pending: statuses.length - completed - inProgress,
    percent: percentOf(completed, statuses.length),
  };
}

/** Adds up several counts (e.g. subjects into an overall figure). */
export function sumCounts(parts: readonly SyllabusCounts[]): SyllabusCounts {
  const total = parts.reduce((sum, part) => sum + part.total, 0);
  const completed = parts.reduce((sum, part) => sum + part.completed, 0);
  return {
    total,
    completed,
    inProgress: parts.reduce((sum, part) => sum + part.inProgress, 0),
    pending: parts.reduce((sum, part) => sum + part.pending, 0),
    percent: percentOf(completed, total),
  };
}
