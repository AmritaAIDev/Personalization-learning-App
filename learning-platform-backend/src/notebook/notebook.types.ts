export type NotebookMistakeSource = 'PRACTICE' | 'ADAPTIVE';

export interface NotebookMistakeCard {
  id: string;
  source: NotebookMistakeSource;
  subject: string;
  chapter: string;
  topic: string;
  questionId: string;
  questionText: string;
  selectedOption: string | null;
  correctOption: string;
  solution: string;
  misconception: string;
  conceptTags: string[];
  difficulty: string;
  bloomLevel: string;
  occurredAt: string;
  dueReviewAt: string;
  reviewState: 'DUE' | 'UPCOMING';
  practiceSimilar: {
    subject: string;
    chapter: string;
    topic: string;
  };
}

export interface NotebookMistakesResponse {
  cards: NotebookMistakeCard[];
  total: number;
  summary: {
    practiceMistakes: number;
    adaptiveMistakes: number;
    weakTopics: string[];
  };
}

/**
 * Concept-level view of the notebook: individual mistakes are clubbed by topic
 * and, where useful, an LLM synthesises the recurring conceptual gap into a
 * single sentence. The member cards remain attached for drill-down.
 */
export type NotebookConceptSummarySource = 'LLM' | 'CACHE' | 'FALLBACK';

export interface NotebookConceptGroup {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  conceptLabel: string;
  misconceptionSummary: string;
  mistakeCount: number;
  dueCount: number;
  lastOccurredAt: string;
  bloomLevels: string[];
  difficulties: string[];
  conceptTags: string[];
  cards: NotebookMistakeCard[];
  practiceSimilar: {
    subject: string;
    chapter: string;
    topic: string;
  };
  summarySource: NotebookConceptSummarySource;
}

export interface NotebookConceptsResponse {
  groups: NotebookConceptGroup[];
  total: number;
  groupCount: number;
  summary: {
    practiceMistakes: number;
    adaptiveMistakes: number;
  };
}
