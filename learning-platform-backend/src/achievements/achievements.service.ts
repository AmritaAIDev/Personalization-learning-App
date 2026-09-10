import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosticAttempt } from '../diagnostics/diagnostic-attempt.entity';
import { DiagnosticAttemptStatus } from '../diagnostics/diagnostic.types';
import { PracticeAttempt } from '../practice/practice-attempt.entity';
import { PracticeAttemptStatus } from '../practice/practice.types';
import { MockTestAttempt } from '../mock-tests/mock-test-attempt.entity';
import { MockTestAttemptStatus } from '../mock-tests/mock-test.types';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementStats,
} from './achievement-definition';
import { StudentAchievement } from './student-achievement.entity';

export interface AchievementView {
  key: string;
  name: string;
  description: string;
  earnedAt: string | null;
}

export interface AchievementsPayload {
  earned: AchievementView[];
  locked: AchievementView[];
}

/**
 * Achievements are evaluated on read rather than hooked into every attempt-
 * completion call site (diagnostics/practice/mock-tests each finalize
 * attempts independently). Every condition in achievement-definition.ts is
 * monotonic — built from totals, a running best score, and XP/streak, none
 * of which the rest of the app ever decreases (confirmed: user.streak is
 * only ever incremented, see diagnostics.service.ts's awardXpAndStreak) — so
 * "recompute on every GET, persist newly-met ones" is equivalent to hooking
 * every completion path, without touching three other services' working
 * completion logic.
 */
@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(DiagnosticAttempt)
    private readonly diagnosticAttempts: Repository<DiagnosticAttempt>,
    @InjectRepository(PracticeAttempt)
    private readonly practiceAttempts: Repository<PracticeAttempt>,
    @InjectRepository(MockTestAttempt)
    private readonly mockTestAttempts: Repository<MockTestAttempt>,
    @InjectRepository(StudentAchievement)
    private readonly studentAchievements: Repository<StudentAchievement>,
  ) {}

  async getAchievements(user: AuthenticatedUser): Promise<AchievementsPayload> {
    const stats = await this.getStats(user);
    const alreadyEarned = await this.studentAchievements.find({
      where: { userId: user.id },
    });
    const earnedKeys = new Set(alreadyEarned.map((row) => row.achievementKey));
    const earnedAtByKey = new Map(
      alreadyEarned.map((row) => [row.achievementKey, row.earnedAt]),
    );

    const newlyEarned = ACHIEVEMENT_DEFINITIONS.filter(
      (def) => !earnedKeys.has(def.key) && def.isEarned(stats),
    );
    if (newlyEarned.length > 0) {
      const now = new Date();
      await this.studentAchievements.save(
        newlyEarned.map((def) =>
          this.studentAchievements.create({
            userId: user.id,
            achievementKey: def.key,
            earnedAt: now,
          }),
        ),
      );
      for (const def of newlyEarned) earnedAtByKey.set(def.key, now);
    }

    const earned: AchievementView[] = [];
    const locked: AchievementView[] = [];
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const earnedAt = earnedAtByKey.get(def.key);
      const view: AchievementView = {
        key: def.key,
        name: def.name,
        description: def.description,
        earnedAt: earnedAt ? earnedAt.toISOString() : null,
      };
      (earnedAt ? earned : locked).push(view);
    }
    return { earned, locked };
  }

  private async getStats(user: AuthenticatedUser): Promise<AchievementStats> {
    const [diagnosticRows, practiceRows, mockRows] = await Promise.all([
      this.diagnosticAttempts.find({
        where: { userId: user.id, status: DiagnosticAttemptStatus.SUBMITTED },
        select: { subject: true, scorePercent: true },
      }),
      this.practiceAttempts.find({
        where: { userId: user.id, status: PracticeAttemptStatus.SUBMITTED },
        select: { subject: true, scorePercent: true },
      }),
      this.mockTestAttempts.find({
        where: { userId: user.id, status: MockTestAttemptStatus.SUBMITTED },
        select: { scorePercent: true },
      }),
    ]);

    const subjectTests: Record<string, number> = {};
    for (const row of [...diagnosticRows, ...practiceRows]) {
      subjectTests[row.subject] = (subjectTests[row.subject] ?? 0) + 1;
    }

    const allScores = [...diagnosticRows, ...practiceRows, ...mockRows].map(
      (row) => row.scorePercent,
    );

    return {
      totalTests: diagnosticRows.length + practiceRows.length + mockRows.length,
      bestScore: allScores.length > 0 ? Math.max(...allScores) : 0,
      xp: user.xp,
      streak: user.streak,
      subjectTests,
    };
  }
}
