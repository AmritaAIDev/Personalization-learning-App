export const BLOOM_LEVELS = [
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
] as const;

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;

export type BloomLevel = (typeof BLOOM_LEVELS)[number];
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export interface LearningCoordinate {
  level: number;
  bloomLevel: BloomLevel;
  difficulty: DifficultyLevel;
  label: string;
}

/**
 * The master specification orders cognitive depth first inside every
 * difficulty tier: T1/D1 ... T5/D1, then T1/D2 ... T5/D3.
 */
export const LEARNING_COORDINATES: readonly LearningCoordinate[] =
  DIFFICULTY_LEVELS.flatMap((difficulty) =>
    BLOOM_LEVELS.map((bloomLevel, index) => {
      const level =
        DIFFICULTY_LEVELS.indexOf(difficulty) * BLOOM_LEVELS.length + index + 1;
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
  const coordinate = LEARNING_COORDINATES[level - 1];
  if (!coordinate) {
    throw new RangeError(
      `Learning level must be between 1 and ${LEARNING_LEVEL_COUNT}.`,
    );
  }
  return coordinate;
}

export function previousCoordinate(level: number): LearningCoordinate | null {
  return level <= 1 ? null : coordinateForLevel(level - 1);
}

export function nextCoordinate(level: number): LearningCoordinate | null {
  return level >= LEARNING_LEVEL_COUNT ? null : coordinateForLevel(level + 1);
}
