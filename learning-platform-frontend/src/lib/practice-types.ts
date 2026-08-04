export interface QuestionCatalogEntry {
  subject: string;
  chapter: string;
  topic: string;
  questionCount: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  readyForPractice: boolean;
}

export interface PracticeQuestion {
  id: string;
  questionId: string;
  subject: string;
  chapter: string;
  topic: string;
  questionText: string;
  options: string[];
  difficulty: string;
  bloomLevel: string;
  marks: number;
  position: number;
}

export type PracticeStatus = "IN_PROGRESS" | "SUBMITTED";

export interface PracticeAttemptPayload {
  attempt: {
    id: string;
    title: string;
    subject: string;
    chapter: string;
    topic: string;
    status: PracticeStatus;
    totalQuestions: number;
    startedAt: string;
    /** Real composition of this attempt, computed by the backend. */
    difficultyMix: Array<{ label: string; count: number }>;
  };
  questions: PracticeQuestion[];
  answers: Array<{ questionId: string; selectedOption: string }>;
}

export interface PracticePerformanceRow {
  label: string;
  correct: number;
  total: number;
  score: number;
  status: "strong" | "average" | "weak";
}

export interface PracticeAnalysis {
  total: number;
  correct: number;
  incorrect: number;
  scorePercent: number;
  grade: "Excellent" | "Good" | "Average" | "Needs work";
  difficultyPerformance: PracticePerformanceRow[];
  bloomPerformance: PracticePerformanceRow[];
  weakConcepts: string[];
  calculatedAt: string;
}

export interface PracticeReviewPayload {
  attempt: {
    id: string;
    title: string;
    subject: string;
    chapter: string;
    topic: string;
    status: PracticeStatus;
    submittedAt: string;
  };
  analysis: PracticeAnalysis;
  results: Array<{
    position: number;
    questionId: string;
    questionText: string;
    options: string[];
    selectedOption: string | null;
    correctOption: string;
    isCorrect: boolean;
    solution: string;
    conceptTags: string[];
    commonErrors: string[];
    difficulty: string;
    bloomLevel: string;
  }>;
}
