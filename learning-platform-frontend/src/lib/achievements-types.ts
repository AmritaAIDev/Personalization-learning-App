export interface AchievementView {
  key: string;
  name: string;
  description: string;
  /** ISO timestamp, or null while locked. */
  earnedAt: string | null;
}

export interface AchievementsPayload {
  earned: AchievementView[];
  locked: AchievementView[];
}
