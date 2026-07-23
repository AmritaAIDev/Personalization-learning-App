/**
 * Four-level proficiency model (collapsed Bloom taxonomy).
 *
 *   PL1 Recall         ← Remember
 *   PL2 Comprehension  ← Understand
 *   PL3 Application    ← Apply
 *   PL4 Higher-Order   ← Analyze + Evaluate + Create
 *
 * Each proficiency level is practised across all three difficulty tiers
 * (Easy → Medium → Hard) before advancing to the next level.
 */
export const BLOOM_LEVELS = [
  'Recall',
  'Comprehension',
  'Application',
  'Higher-Order',
] as const;

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;

export type BloomLevel = (typeof BLOOM_LEVELS)[number];
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

/**
 * Maps any legacy or model-emitted Bloom label onto one of the four canonical
 * proficiency levels. Keeps the engine resilient to older data and to LLM
 * output that still uses the classic six-category Bloom vocabulary.
 */
const BLOOM_ALIASES: Record<string, BloomLevel> = {
  recall: 'Recall',
  remember: 'Recall',
  knowledge: 'Recall',
  comprehension: 'Comprehension',
  understand: 'Comprehension',
  understanding: 'Comprehension',
  application: 'Application',
  apply: 'Application',
  applying: 'Application',
  'higher-order': 'Higher-Order',
  higherorder: 'Higher-Order',
  analyze: 'Higher-Order',
  analyse: 'Higher-Order',
  analysis: 'Higher-Order',
  evaluate: 'Higher-Order',
  evaluation: 'Higher-Order',
  create: 'Higher-Order',
  creating: 'Higher-Order',
  synthesis: 'Higher-Order',
};

export function normalizeBloomLevel(value: string | null | undefined): BloomLevel {
  const key = (value ?? '').trim().toLowerCase().replace(/\s+/g, '-');
  return BLOOM_ALIASES[key] ?? BLOOM_ALIASES[key.replace(/-/g, '')] ?? 'Recall';
}

/**
 * All raw Bloom labels (legacy + canonical) that resolve to a given
 * proficiency level. Used to match stored question rows regardless of the
 * vocabulary they were tagged with.
 */
export function bloomLevelAliases(level: BloomLevel): string[] {
  const canonical = new Set<string>([level]);
  for (const [raw, mapped] of Object.entries(BLOOM_ALIASES)) {
    if (mapped === level) canonical.add(raw);
  }
  // Add the human-cased legacy spellings the question bank actually stores.
  const legacyByLevel: Record<BloomLevel, string[]> = {
    Recall: ['Remember'],
    Comprehension: ['Understand'],
    Application: ['Apply'],
    'Higher-Order': ['Analyze', 'Analyse', 'Evaluate', 'Create'],
  };
  for (const legacy of legacyByLevel[level]) canonical.add(legacy);
  return Array.from(canonical);
}

export interface LearningCoordinate {
  level: number;
  bloomLevel: BloomLevel;
  difficulty: DifficultyLevel;
  label: string;
}

/**
 * Proficiency-first ordering: a learner clears Easy → Medium → Hard within a
 * proficiency level before the next level unlocks.
 *
 *   L1 Recall·Easy   L2 Recall·Medium   L3 Recall·Hard
 *   L4 Comprehension·Easy … L12 Higher-Order·Hard
 */
export const LEARNING_COORDINATES: readonly LearningCoordinate[] =
  BLOOM_LEVELS.flatMap((bloomLevel, bloomIndex) =>
    DIFFICULTY_LEVELS.map((difficulty, difficultyIndex) => {
      const level =
        bloomIndex * DIFFICULTY_LEVELS.length + difficultyIndex + 1;
      return {
        level,
        bloomLevel,
        difficulty,
        label: `Level ${level}: ${bloomLevel} · ${difficulty}`,
      };
    }),
  );

export const LEARNING_LEVEL_COUNT = LEARNING_COORDINATES.length;
export const LEARNING_QUESTIONS_PER_SESSION = 5;

export enum LearningTopicStatus {
  ACTIVE = 'ACTIVE',
  MASTERED = 'MASTERED',
  PAUSED_FOR_PREREQUISITE = 'PAUSED_FOR_PREREQUISITE',
}

export enum LearningSessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ROUTED = 'ROUTED',
}

export enum LearningSessionTransition {
  NONE = 'NONE',
  ADVANCED = 'ADVANCED',
  REINFORCE = 'REINFORCE',
  DEMOTED = 'DEMOTED',
  PREREQUISITE = 'PREREQUISITE',
  MASTERED = 'MASTERED',
}

export enum LearningQuestionSource {
  CURATED = 'CURATED',
  AI_POOL = 'AI_POOL',
}

export enum GeneratedLearningQuestionStatus {
  READY = 'READY',
  RESERVED = 'RESERVED',
  REJECTED = 'REJECTED',
}

export enum GenerationJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  RETRYING = 'RETRYING',
  FAILED = 'FAILED',
}

export enum FlashcardSource {
  CURATED = 'CURATED',
  AI_GENERATED = 'AI_GENERATED',
}

export enum FlashcardStatus {
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum FlashcardRating {
  AGAIN = 'AGAIN',
  HARD = 'HARD',
  GOOD = 'GOOD',
  EASY = 'EASY',
}

export enum TutorMessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

export enum TutorMessageType {
  GENERAL = 'GENERAL',
  SOCRATIC_HINT = 'SOCRATIC_HINT',
  ANSWER_EXPLANATION = 'ANSWER_EXPLANATION',
}

export function coordinateForLevel(level: number): LearningCoordinate {
  // Clamp into range so legacy state saved on the old 15-level scale (or any
  // out-of-range value) degrades gracefully instead of crashing the session.
  const bounded = Math.min(Math.max(Math.round(level) || 1, 1), LEARNING_LEVEL_COUNT);
  return LEARNING_COORDINATES[bounded - 1];
}

export function previousCoordinate(level: number): LearningCoordinate | null {
  return level <= 1 ? null : coordinateForLevel(level - 1);
}

export function nextCoordinate(level: number): LearningCoordinate | null {
  return level >= LEARNING_LEVEL_COUNT ? null : coordinateForLevel(level + 1);
}
