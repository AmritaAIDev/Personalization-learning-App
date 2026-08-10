export type DoubtStatus = "OPEN" | "ANSWERED";

export type DoubtSource = {
  title: string;
  topic: string;
  chapter: string;
};

export type DoubtCard = {
  id: string;
  threadId: string | null;
  subject: string;
  chapter: string;
  topic: string;
  message: string;
  assistantResponse: string | null;
  sources: DoubtSource[];
  status: DoubtStatus;
  questionId: string | null;
  learningSessionId: string | null;
  learningSessionItemId: string | null;
  practiceAttemptId: string | null;
  notebookCardId: string | null;
  createdAt: string;
  answeredAt: string | null;
};

export type DoubtThread = {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  topic: string;
  status: DoubtStatus;
  turns: number;
  lastMessageAt: string;
  doubts: DoubtCard[];
};

export type DoubtsResponse = {
  doubts: DoubtCard[];
  threads: DoubtThread[];
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
  threadId?: string;
};

export type CreateDoubtThreadPayload = {
  subject: string;
  chapter: string;
  topic: string;
  title?: string;
};
