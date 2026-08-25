import type { DoubtStatus } from './doubt.entity';
import type { Citation } from '../citation.util';

export interface DoubtCard {
  id: string;
  threadId: string | null;
  subject: string;
  chapter: string;
  topic: string;
  message: string;
  assistantResponse: string | null;
  /** Reviewed concept notes the answer cited; empty when none were available. */
  sources: Citation[];
  status: DoubtStatus;
  /** True when `assistantResponse` is the offline fallback, not a real AI answer. */
  answeredWithFallback: boolean;
  questionId: string | null;
  learningSessionId: string | null;
  learningSessionItemId: string | null;
  practiceAttemptId: string | null;
  notebookCardId: string | null;
  createdAt: string;
  answeredAt: string | null;
}

export interface DoubtThreadCard {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  topic: string;
  status: 'OPEN' | 'ANSWERED';
  turns: number;
  lastMessageAt: string;
  doubts: DoubtCard[];
}

export interface DoubtsResponse {
  doubts: DoubtCard[];
  threads: DoubtThreadCard[];
  total: number;
  summary: {
    open: number;
    answered: number;
    recentTopics: string[];
  };
}
