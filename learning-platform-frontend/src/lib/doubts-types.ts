export type DoubtStatus = 'OPEN' | 'ANSWERED';

export type DoubtCard = {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  message: string;
  assistantResponse: string | null;
  status: DoubtStatus;
  questionId: string | null;
  learningSessionId: string | null;
  learningSessionItemId: string | null;
  practiceAttemptId: string | null;
  notebookCardId: string | null;
  createdAt: string;
  answeredAt: string | null;
};

export type DoubtsResponse = {
  doubts: DoubtCard[];
  total: number;
  summary: {
    open: number;
    answered: number;
    recentTopics: string[];
  };
};

export type CreateDoubtPayload = {
  subject: string;
  chapter: string;
  topic: string;
  message: string;
};
