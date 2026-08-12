export type MockTestAttemptStatus = "IN_PROGRESS" | "SUBMITTED";

export type SubjectCount = { subject: string; count: number };
export type DifficultyCount = { label: string; count: number };

export type SubjectBreakdown = {
  subject: string;
  correct: number;
  incorrect: number;
  unattempted: number;
  total: number;
  scorePercent: number;
};

export type MockTestAttemptSummary = {
  id: string;
  status: MockTestAttemptStatus;
  totalQuestions: number;
  subjectCounts: SubjectCount[];
  difficultyMix: DifficultyCount[];
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  scorePercent: number;
  percentile: number | null;
};

export type MockTestQuestion = {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  questionText: string;
  options: string[];
  difficulty: string;
  bloomLevel: string;
  marks: number;
};

export type MockTestAttemptPayload = {
  attempt: MockTestAttemptSummary;
  questions: MockTestQuestion[];
  answers: Array<{ questionId: string; selectedOption: string }>;
};

export type MockTestReviewItem = MockTestQuestion & {
  correctAnswer: string;
  solution: string;
  selectedOption: string | null;
  isCorrect: boolean | null;
  marksAwarded: number | null;
};

export type MockTestReviewPayload = {
  attempt: MockTestAttemptSummary;
  subjectBreakdown: SubjectBreakdown[];
  weakestChapters: Array<{
    subject: string;
    chapter: string;
    lostMarks: number;
    incorrect: number;
    unattempted: number;
  }>;
  items: MockTestReviewItem[];
};
