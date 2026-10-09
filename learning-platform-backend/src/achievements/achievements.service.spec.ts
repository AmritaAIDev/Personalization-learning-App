import { EMPTY_PERSONALIZATION } from '../users/personalization';
import { AchievementsService } from './achievements.service';
import { DiagnosticAttemptStatus } from '../diagnostics/diagnostic.types';
import { PracticeAttemptStatus } from '../practice/practice.types';
import { MockTestAttemptStatus } from '../mock-tests/mock-test.types';
import type { AuthenticatedUser } from '../auth/auth.types';

function makeUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: 'user-1',
    name: 'Test Student',
    email: 'student@example.com',
    role: 'student',
    xp: 0,
    level: 1,
    streak: 0,
    personalization: EMPTY_PERSONALIZATION,
    ...overrides,
  };
}

describe('AchievementsService', () => {
  const diagnosticAttempts = { find: jest.fn() };
  const practiceAttempts = { find: jest.fn() };
  const mockTestAttempts = { find: jest.fn() };
  const studentAchievements = {
    find: jest.fn(),
    create: jest.fn((row: unknown) => row),
    save: jest.fn(),
  };
  let service: AchievementsService;

  beforeEach(() => {
    jest.resetAllMocks();
    studentAchievements.create.mockImplementation((row: unknown) => row);
    diagnosticAttempts.find.mockResolvedValue([]);
    practiceAttempts.find.mockResolvedValue([]);
    mockTestAttempts.find.mockResolvedValue([]);
    studentAchievements.find.mockResolvedValue([]);
    service = new AchievementsService(
      diagnosticAttempts as never,
      practiceAttempts as never,
      mockTestAttempts as never,
      studentAchievements as never,
    );
  });

  it('locks every achievement for a brand-new student', async () => {
    const result = await service.getAchievements(makeUser());
    expect(result.earned).toHaveLength(0);
    expect(result.locked.length).toBeGreaterThan(0);
    expect(studentAchievements.save).not.toHaveBeenCalled();
  });

  it('earns and persists FIRST_TEST after a single submitted attempt', async () => {
    practiceAttempts.find.mockResolvedValue([
      { subject: 'Physics', scorePercent: 40 },
    ]);
    const result = await service.getAchievements(makeUser());
    const firstTest = result.earned.find((a) => a.key === 'FIRST_TEST');
    expect(firstTest).toBeDefined();
    expect(firstTest?.earnedAt).not.toBeNull();
    expect(studentAchievements.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-1',
          achievementKey: 'FIRST_TEST',
        }),
      ]),
    );
  });

  it('does not re-persist an achievement already recorded as earned', async () => {
    const earnedAt = new Date('2026-01-01T00:00:00.000Z');
    practiceAttempts.find.mockResolvedValue([
      { subject: 'Physics', scorePercent: 40 },
    ]);
    studentAchievements.find.mockResolvedValue([
      { userId: 'user-1', achievementKey: 'FIRST_TEST', earnedAt },
    ]);
    const result = await service.getAchievements(makeUser());
    const firstTest = result.earned.find((a) => a.key === 'FIRST_TEST');
    expect(firstTest?.earnedAt).toBe(earnedAt.toISOString());
    // FIRST_TEST already earned, nothing new to save this round.
    expect(studentAchievements.save).not.toHaveBeenCalled();
  });

  it('counts subject achievements from diagnostics + practice, not mock tests', async () => {
    diagnosticAttempts.find.mockResolvedValue([
      { subject: 'Physics', scorePercent: 50 },
      { subject: 'Physics', scorePercent: 60 },
    ]);
    practiceAttempts.find.mockResolvedValue([
      { subject: 'Physics', scorePercent: 70 },
      { subject: 'Physics', scorePercent: 80 },
      { subject: 'Physics', scorePercent: 90 },
    ]);
    mockTestAttempts.find.mockResolvedValue([{ scorePercent: 65 }]);
    const result = await service.getAchievements(makeUser());
    expect(result.earned.map((a) => a.key)).toContain('PHYSICS_ACE');
    expect(result.earned.map((a) => a.key)).not.toContain('CHEMISTRY_WIZARD');
  });

  it('awards PERFECT_SCORE only at 100%', async () => {
    practiceAttempts.find.mockResolvedValue([
      { subject: 'Mathematics', scorePercent: 99 },
    ]);
    let result = await service.getAchievements(makeUser());
    expect(result.earned.map((a) => a.key)).not.toContain('PERFECT_SCORE');

    jest.resetAllMocks();
    studentAchievements.create.mockImplementation((row: unknown) => row);
    diagnosticAttempts.find.mockResolvedValue([]);
    mockTestAttempts.find.mockResolvedValue([]);
    studentAchievements.find.mockResolvedValue([]);
    practiceAttempts.find.mockResolvedValue([
      { subject: 'Mathematics', scorePercent: 100 },
    ]);
    result = await service.getAchievements(makeUser());
    expect(result.earned.map((a) => a.key)).toContain('PERFECT_SCORE');
  });

  it('reads xp/streak thresholds straight from the authenticated user', async () => {
    const result = await service.getAchievements(
      makeUser({ xp: 1200, streak: 8 }),
    );
    const keys = result.earned.map((a) => a.key);
    expect(keys).toEqual(
      expect.arrayContaining(['XP_500', 'XP_1000', 'STREAK_3', 'STREAK_7']),
    );
  });

  it('queries only SUBMITTED attempts', async () => {
    await service.getAchievements(makeUser());
    expect(diagnosticAttempts.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: DiagnosticAttemptStatus.SUBMITTED,
        }),
      }),
    );
    expect(practiceAttempts.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: PracticeAttemptStatus.SUBMITTED,
        }),
      }),
    );
    expect(mockTestAttempts.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: MockTestAttemptStatus.SUBMITTED,
        }),
      }),
    );
  });
});
