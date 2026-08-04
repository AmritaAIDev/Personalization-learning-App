export type NotebookMistakeCard = {
  id: string;
  source: "PRACTICE" | "ADAPTIVE";
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
  reviewState: "DUE" | "UPCOMING";
  practiceSimilar: {
    subject: string;
    chapter: string;
    topic: string;
  };
};

export type NotebookMistakesResponse = {
  cards: NotebookMistakeCard[];
  total: number;
  summary: {
    practiceMistakes: number;
    adaptiveMistakes: number;
    weakTopics: string[];
  };
};

export type NotebookConceptSummarySource = "LLM" | "CACHE" | "FALLBACK";

export type NotebookConceptGroup = {
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
};

export type NotebookConceptsResponse = {
  groups: NotebookConceptGroup[];
  total: number;
  groupCount: number;
  summary: {
    practiceMistakes: number;
    adaptiveMistakes: number;
  };
};
