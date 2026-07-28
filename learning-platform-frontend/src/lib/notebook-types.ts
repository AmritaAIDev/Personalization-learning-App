export type NotebookMistakeCard = {
  id: string;
  source: 'PRACTICE' | 'ADAPTIVE';
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
