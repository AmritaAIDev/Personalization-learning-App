export const PRACTICE_QUESTION_COUNT = 15;
export const PRACTICE_PER_DIFFICULTY = 5;
export const PRACTICE_DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

export type PracticeDifficulty = (typeof PRACTICE_DIFFICULTIES)[number];

export enum PracticeAttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
}

export interface PracticePerformanceRow {
  label: string;
  correct: number;
  total: number;
  score: number;
  status: 'strong' | 'average' | 'weak';
}

export interface PracticeAnalysis {
  total: number;
  correct: number;
  incorrect: number;
  scorePercent: number;
  grade: 'Excellent' | 'Good' | 'Average' | 'Needs work';
  difficultyPerformance: PracticePerformanceRow[];
  bloomPerformance: PracticePerformanceRow[];
  weakConcepts: string[];
  calculatedAt: string;
}
