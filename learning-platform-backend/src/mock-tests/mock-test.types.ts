export enum MockTestAttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
}

/** JEE Main negative-marking scheme: +4 correct, -1 incorrect, 0 unattempted. */
export const MOCK_TEST_MARKS_CORRECT = 4;
export const MOCK_TEST_MARKS_INCORRECT = -1;

export const MOCK_TEST_SUBJECTS = [
  'Physics',
  'Chemistry',
  'Mathematics',
] as const;
export type MockTestSubject = (typeof MOCK_TEST_SUBJECTS)[number];

/** Target questions per subject; the actual draw degrades gracefully if a subject's bank is smaller. */
export const MOCK_TEST_QUESTIONS_PER_SUBJECT = 20;

export const MOCK_TEST_DURATION_MINUTES = 90;

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
