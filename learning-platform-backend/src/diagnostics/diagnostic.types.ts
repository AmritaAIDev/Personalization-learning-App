export const DIAGNOSTIC_SUBJECT = 'Physics';
export const ELECTROSTATICS_CHAPTERS = [
  'Electric Charges and Fields',
  'Electrostatic Potential and Capacitance',
] as const;
export const DIAGNOSTIC_QUESTION_COUNT = 15;
export const DIAGNOSTIC_QUESTIONS_PER_DIFFICULTY = 5;
export const DIAGNOSTIC_DURATION_MINUTES = 30;

export enum DiagnosticAttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  EXPIRED = 'EXPIRED',
}

export enum DiagnosticAttemptMode {
  PROGRAM = 'PROGRAM',
  TOPIC_PLACEMENT = 'TOPIC_PLACEMENT',
}

export enum LearningResourceType {
  VIDEO = 'VIDEO',
  NOTES = 'NOTES',
  PRACTICE = 'PRACTICE',
  FORMULA = 'FORMULA',
}

export interface PerformanceRow {
  label: string;
  correct: number;
  total: number;
  score: number;
  status: 'strong' | 'average' | 'weak';
}

export interface DiagnosticAnalysis {
  total: number;
  correct: number;
  incorrect: number;
  scorePercent: number;
  grade: 'Excellent' | 'Good' | 'Average' | 'Needs work';
  topicPerformance: PerformanceRow[];
  bloomPerformance: PerformanceRow[];
  weakTopics: string[];
  calculatedAt: string;
}

export interface DiagnosticReviewItem {
  position: number;
  questionId: string;
  topic: string;
  difficulty: string;
  bloomLevel: string;
  marks: number;
  questionText: string;
  options: string[];
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  solution: string;
}

export interface DiagnosticReviewPayload {
  attempt: {
    id: string;
    status: DiagnosticAttemptStatus;
    submittedAt: string | null;
  };
  questions: DiagnosticReviewItem[];
}
