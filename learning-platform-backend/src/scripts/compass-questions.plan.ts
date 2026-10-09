import { scoreQuestionQuality } from '../question-quality.util';
import type { CompassQuestion } from './content/compass-question.types';

/**
 * Where the imported questions land. This is the chapter name the existing
 * Electrostatics question bank already uses (see seed-diagnostic.ts and
 * align-gauss-chapter.ts), so the drafts sit beside the questions they extend
 * and need no retagging once approved.
 */
export const COMPASS_QUESTION_TARGET = {
  subject: 'Physics',
  chapter: 'Electric Charges and Fields',
} as const;

const ID_PREFIX = 'CMP-PHY-CH1-';
const MIN_QUESTION_LENGTH = 15;
const SECONDS_BY_DIFFICULTY = { Easy: 60, Medium: 90, Hard: 120 } as const;
const OPTION_COUNT = 4;

export const IMPORT_REVIEW_NOTE =
  'Imported from jee-compass for review. The source always listed the correct ' +
  'answer first; options were re-ordered so the answer position is balanced. ' +
  'Check the key and the wording before publishing.';

/** A row ready to be written as a DRAFT `questions` record. */
export interface PlannedQuestion {
  question_id: string;
  subject: string;
  chapter: string;
  topic: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  solution: string;
  bloom_level: string;
  difficulty: string;
  marks: number;
  estimated_time_sec: number;
  concept_tags: string[];
  quality_score: number;
  review_notes: string;
  /** 0-3: where the correct option sits after re-ordering. */
  answerPosition: number;
}

export interface SkippedQuestion {
  id: string;
  reason: string;
}

export interface CompassQuestionPlan {
  rows: PlannedQuestion[];
  skipped: SkippedQuestion[];
}

function validate(question: CompassQuestion): string | null {
  const options = question.options.map((option) => option.trim());
  if (options.length !== OPTION_COUNT) {
    return `has ${options.length} options, expected ${OPTION_COUNT}`;
  }
  if (options.some((option) => option.length === 0))
    return 'has an empty option';
  if (
    new Set(options.map((option) => option.toLocaleLowerCase())).size !==
    OPTION_COUNT
  ) {
    return 'has duplicate options';
  }
  if (
    !Number.isInteger(question.correctIndex) ||
    question.correctIndex < 0 ||
    question.correctIndex >= OPTION_COUNT
  ) {
    return 'has an out-of-range answer index';
  }
  if (question.question.trim().length < MIN_QUESTION_LENGTH) {
    return 'question text is too short';
  }
  if (question.explanation.trim().length === 0) return 'has no explanation';
  return null;
}

/**
 * Puts the correct option at `position`, keeping the distractors in their
 * original relative order. Safe for these questions: none refer to option
 * letters ("see option B"), which is checked when the data is reviewed.
 */
export function placeCorrectAt(
  options: readonly string[],
  correctIndex: number,
  position: number,
): string[] {
  const correct = options[correctIndex];
  const distractors = options.filter((_, index) => index !== correctIndex);
  return [
    ...distractors.slice(0, position),
    correct,
    ...distractors.slice(position),
  ];
}

/**
 * Turns the Compass bank into reviewable drafts. Pure and deterministic: the
 * same input always yields the same rows, so re-running the import is
 * idempotent. Invalid questions are skipped with a reason, never repaired by
 * guesswork. The i-th accepted question gets its answer at position i mod 4,
 * which makes the key balanced (25% each) instead of always "A".
 */
export function planCompassQuestions(
  source: readonly CompassQuestion[],
): CompassQuestionPlan {
  const rows: PlannedQuestion[] = [];
  const skipped: SkippedQuestion[] = [];
  const seenIds = new Set<string>();

  for (const question of source) {
    if (seenIds.has(question.id)) {
      skipped.push({ id: question.id, reason: 'duplicate id' });
      continue;
    }
    seenIds.add(question.id);

    const problem = validate(question);
    if (problem) {
      skipped.push({ id: question.id, reason: problem });
      continue;
    }

    const position = rows.length % OPTION_COUNT;
    const trimmed = question.options.map((option) => option.trim());
    const options = placeCorrectAt(trimmed, question.correctIndex, position);
    rows.push({
      question_id: `${ID_PREFIX}${question.id.toUpperCase()}`,
      subject: COMPASS_QUESTION_TARGET.subject,
      chapter: COMPASS_QUESTION_TARGET.chapter,
      topic: question.topic.trim(),
      question_text: question.question.trim(),
      options,
      correct_answer: trimmed[question.correctIndex],
      solution: question.explanation.trim(),
      bloom_level: question.bloomLevel,
      difficulty: question.difficulty,
      marks: 4,
      estimated_time_sec: SECONDS_BY_DIFFICULTY[question.difficulty],
      concept_tags: [question.topic.trim()],
      quality_score: scoreQuestionQuality({
        question_text: question.question,
        options: trimmed,
        explanation: question.explanation,
      }),
      review_notes: IMPORT_REVIEW_NOTE,
      answerPosition: position,
    });
  }
  return { rows, skipped };
}

export interface CompassQuestionSummary {
  total: number;
  byTopic: Record<string, number>;
  byBloom: Record<string, number>;
  byDifficulty: Record<string, number>;
  byAnswerPosition: number[];
  lowQuality: number;
}

const LOW_QUALITY_BELOW = 80;

function countBy<T>(items: readonly T[], key: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

export function summarizePlan(
  rows: readonly PlannedQuestion[],
): CompassQuestionSummary {
  const positions = [0, 0, 0, 0];
  for (const row of rows) positions[row.answerPosition] += 1;
  return {
    total: rows.length,
    byTopic: countBy(rows, (row) => row.topic),
    byBloom: countBy(rows, (row) => row.bloom_level),
    byDifficulty: countBy(rows, (row) => row.difficulty),
    byAnswerPosition: positions,
    lowQuality: rows.filter((row) => row.quality_score < LOW_QUALITY_BELOW)
      .length,
  };
}
