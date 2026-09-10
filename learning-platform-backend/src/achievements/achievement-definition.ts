/**
 * Real, server-computed stats an achievement condition is evaluated against.
 * Nothing here is client-supplied — see AchievementsService.getStats().
 */
export interface AchievementStats {
  /** SUBMITTED attempts across diagnostics, practice and mock tests. */
  totalTests: number;
  /** Highest scorePercent across any SUBMITTED attempt. */
  bestScore: number;
  xp: number;
  streak: number;
  /**
   * SUBMITTED attempt count per subject, from diagnostics + practice only.
   * Mock tests are excluded — a single mock test spans all three subjects
   * (MockTestAttempt has no single `subject` column), so counting it under
   * each subject would double-count "tests" relative to totalTests.
   */
  subjectTests: Record<string, number>;
}

export interface AchievementDefinition {
  /** Stable key, persisted in student_achievements.achievement_key. */
  key: string;
  name: string;
  description: string;
  isEarned: (stats: AchievementStats) => boolean;
}

/**
 * Condition thresholds, inspired by jee-compass's client-side BADGES array
 * (curriculum.js) but evaluated here against real attempt/XP/streak data
 * instead of localStorage.
 */
export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  {
    key: 'FIRST_TEST',
    name: 'First Step',
    description: 'Complete your first test.',
    isEarned: (s) => s.totalTests >= 1,
  },
  {
    key: 'STREAK_3',
    name: 'On Fire',
    description: 'Reach a 3-day study streak.',
    isEarned: (s) => s.streak >= 3,
  },
  {
    key: 'STREAK_7',
    name: 'Week Warrior',
    description: 'Reach a 7-day study streak.',
    isEarned: (s) => s.streak >= 7,
  },
  {
    key: 'PERFECT_SCORE',
    name: 'Perfect Score',
    description: 'Score 100% on any test.',
    isEarned: (s) => s.bestScore >= 100,
  },
  {
    key: 'PHYSICS_ACE',
    name: 'Physics Ace',
    description: 'Complete 5 Physics tests.',
    isEarned: (s) => (s.subjectTests.Physics ?? 0) >= 5,
  },
  {
    key: 'CHEMISTRY_WIZARD',
    name: 'Chemistry Wizard',
    description: 'Complete 5 Chemistry tests.',
    isEarned: (s) => (s.subjectTests.Chemistry ?? 0) >= 5,
  },
  {
    key: 'MATH_GENIUS',
    name: 'Math Genius',
    description: 'Complete 5 Mathematics tests.',
    isEarned: (s) => (s.subjectTests.Mathematics ?? 0) >= 5,
  },
  {
    key: 'XP_500',
    name: 'Rising Star',
    description: 'Earn 500 XP.',
    isEarned: (s) => s.xp >= 500,
  },
  {
    key: 'XP_1000',
    name: 'Star Performer',
    description: 'Earn 1000 XP.',
    isEarned: (s) => s.xp >= 1000,
  },
  {
    key: 'ALL_ROUNDER',
    name: 'All Rounder',
    description: 'Complete at least one test in every subject.',
    isEarned: (s) =>
      (s.subjectTests.Physics ?? 0) >= 1 &&
      (s.subjectTests.Chemistry ?? 0) >= 1 &&
      (s.subjectTests.Mathematics ?? 0) >= 1,
  },
];
