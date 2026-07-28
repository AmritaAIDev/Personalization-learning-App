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
