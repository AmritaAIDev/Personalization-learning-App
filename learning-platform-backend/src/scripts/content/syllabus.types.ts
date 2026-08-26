import {
  FlashcardSource,
  FlashcardStatus,
} from '../../adaptive/adaptive.types';
import {
  QuestionPublicationStatus,
  QuestionSource,
} from '../../question.entity';

export type SeedDifficulty = 'Easy' | 'Medium' | 'Hard';

export type SeedQuestion = {
  text: string;
  options: [string, string, string, string];
  answer: string;
  solution: string;
  bloom: 'Remember' | 'Understand' | 'Apply' | 'Analyze';
  difficulty: SeedDifficulty;
};

export type SeedFlashcard = {
  front: string;
  back: string;
  hint?: string;
};

export type SeedConcept = {
  /** Concept title used as the Qdrant payload title. */
  title: string;
  /** Grounding text embedded into the vector store. */
  content: string;
};

/**
 * One sub-topic of a chapter with every artefact that should exist for it.
 * Keeping the grouping here means the topic hierarchy, practice bank,
 * flashcard deck, and vector-store grounding are always derived from one
 * reviewed definition.
 */
export type SubtopicSeed = {
  name: string;
  questions?: SeedQuestion[];
  flashcards?: SeedFlashcard[];
  concepts?: SeedConcept[];
};

export type ChapterSeed = {
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  subtopics: SubtopicSeed[];
};

/** Chapters already populated by earlier seed scripts — tree nodes only. */
export type ExistingChapterRef = {
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  chapter: string;
  subtopics: [];
};

export const SEED_QUESTION_STATUS = QuestionPublicationStatus.PUBLISHED;
export const SEED_QUESTION_SOURCE = QuestionSource.CURATED;
export const SEED_FLASHCARD_SOURCE: FlashcardSource = FlashcardSource.CURATED;
export const SEED_FLASHCARD_STATUS: FlashcardStatus = FlashcardStatus.PUBLISHED;

export function slugifyChapter(value: string): string {
  return value.replace(/[^A-Za-z]/g, '').toUpperCase();
}

export function slugifySubtopic(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '').toUpperCase();
}
