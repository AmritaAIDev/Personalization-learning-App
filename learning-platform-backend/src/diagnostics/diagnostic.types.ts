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

/**
 * Best-effort, admin-only signal that an attempt looks like guessing rather
 * than reasoning. Deterministic and heuristic — never a certainty, and never
 * shown to the learner.
 */
export interface IntegritySignal {
  /** True when the pattern crosses the flag threshold. */
  guessingSuspected: boolean;
  /** Answers that were both implausibly fast and wrong. */
  fastWrongCount: number;
  /** Share (0–1) of answers that reused the single most-picked option slot. */
  dominantOptionShare: number;
  /** Human-readable summary for the admin panel, or null when nothing stood out. */
  note: string | null;
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
  /**
   * One-line, deterministic recap of the result built from topic performance.
   * Reads like an AI summary but never depends on the model, so it always
   * renders instantly and offline.
   */
  recap: string;
  /** Admin-only guessing/random-answering heuristic. */
  integrity: IntegritySignal;
  calculatedAt: string;
}

export interface DiagnosticReviewItem {
  position: number;
  /** Internal question UUID — used to target the on-demand explain endpoint. */
  id: string;
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
  confidence: number | null;
  calibration: 'overconfident' | 'underconfident' | 'calibrated' | null;
}

export interface DiagnosticReviewPayload {
  attempt: {
    id: string;
    status: DiagnosticAttemptStatus;
    submittedAt: string | null;
  };
  questions: DiagnosticReviewItem[];
}
