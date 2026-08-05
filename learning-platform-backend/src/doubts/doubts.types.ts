import type { DoubtStatus } from './doubt.entity';
import type { Citation } from '../citation.util';

export interface DoubtCard {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  message: string;
  assistantResponse: string | null;
  /** Reviewed concept notes the answer cited; empty when none were available. */
  sources: Citation[];
  status: DoubtStatus;
  questionId: string | null;
  learningSessionId: string | null;
  learningSessionItemId: string | null;
  practiceAttemptId: string | null;
  notebookCardId: string | null;
  createdAt: string;
  answeredAt: string | null;
}

export interface DoubtsResponse {
  doubts: DoubtCard[];
  total: number;
  summary: {
    open: number;
    answered: number;
    recentTopics: string[];
  };
}
