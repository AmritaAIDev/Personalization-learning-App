import { DashboardService } from './dashboard.service';

const user = {
  id: 'student-id',
  name: 'Demo Student',
  email: 'student@example.test',
  role: 'student' as const,
  level: 4,
  xp: 120,
  streak: 3,
};

function learningDashboard() {
  return {
    activeTopics: [
      {
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
        status: 'ACTIVE',
      },
    ],
    completedTopics: [],
    history: [],
    suggestions: [],
  };
}

function diagnosticDashboard(
  activeAttempt: { id: string; answeredCount: number } | null,
) {
  return {
    data: {
      activeAttempt,
      recentAttempts: [],
      stats: {
        testsTaken: 0,
        bestScore: null,
        averageScore: null,
        subject: 'Physics',
      },
      diagnostic: {
        title: 'Diagnostic',
        chapters: [],
        questionCount: 15,
        durationMinutes: 30,
        ready: true,
      },
    },
  };
}

describe('DashboardService', () => {
  const adaptiveService = { getDashboard: jest.fn() };
  const competencyService = {
    getGrowth: jest.fn().mockResolvedValue({
      overall: { topicsTracked: 1, mastered: 0, score: 42 },
      topics: [],
      timeline: [],
    }),
  };
  const diagnosticsService = { getDashboard: jest.fn() };
  const notebookService = { getMistakes: jest.fn() };
  const questionsRepository = { createQueryBuilder: jest.fn() };
  const service = new DashboardService(
    adaptiveService as never,
    competencyService as never,
    diagnosticsService as never,
    notebookService as never,
    questionsRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    // The question-catalog cache is process-wide and long-lived in
    // production (content rarely changes); reset it between tests so each
    // test's mocked catalog is actually exercised instead of a prior test's.
    (service as unknown as { catalogCache: unknown }).catalogCache = null;
    adaptiveService.getDashboard.mockResolvedValue(learningDashboard());
    notebookService.getMistakes.mockResolvedValue({ cards: [] });
    questionsRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    });
  });

  it('prioritizes an active diagnostic over due revision and adaptive work', async () => {
    diagnosticsService.getDashboard.mockResolvedValue(
      diagnosticDashboard({ id: 'attempt-id', answeredCount: 4 }),
    );
    notebookService.getMistakes.mockResolvedValue({
      cards: [
        {
          subject: 'Physics',
          chapter: 'Electrostatics',
          topic: 'Gauss Law',
          reviewState: 'DUE',
        },
      ],
    });

    const result = await service.getStudentDashboard(user);

    expect(result.today.primary).toMatchObject({
      kind: 'RESUME_DIAGNOSTIC',
      attemptId: 'attempt-id',
    });
  });

  it('prioritizes due revision before continuing an active topic', async () => {
    diagnosticsService.getDashboard.mockResolvedValue(
      diagnosticDashboard(null),
    );
    notebookService.getMistakes.mockResolvedValue({
      cards: [
        {
          subject: 'Physics',
          chapter: 'Electrostatics',
          topic: 'Gauss Law',
          reviewState: 'DUE',
        },
      ],
    });

    const result = await service.getStudentDashboard(user);

    expect(result.today.primary.kind).toBe('REVIEW_MISTAKES');
    expect(result.revision.topics).toEqual([
      expect.objectContaining({ topic: 'Gauss Law', count: 1 }),
    ]);
  });

  it('derives subject coverage from the published catalogue and student topic state', async () => {
    diagnosticsService.getDashboard.mockResolvedValue(
      diagnosticDashboard(null),
    );
    competencyService.getGrowth.mockResolvedValue({
      overall: { topicsTracked: 2, mastered: 1, score: 66, momentum: 4 },
      topics: [
        {
          subject: 'Physics',
          chapter: 'Electrostatics',
          topic: 'Gauss Law',
          score: 84,
          status: 'MASTERED',
        },
        {
          subject: 'Physics',
          chapter: 'Electrostatics',
          topic: 'Electric Field',
          score: 43,
          status: 'ACTIVE',
        },
      ],
      timeline: [],
    });
    questionsRepository.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { subject: 'Physics', chapter: 'Electrostatics', topic: 'Gauss Law' },
        {
          subject: 'Physics',
          chapter: 'Electrostatics',
          topic: 'Electric Field',
        },
        { subject: 'Physics', chapter: 'Electrostatics', topic: 'Capacitance' },
      ]),
    });

    const result = await service.getStudentDashboard(user);

    expect(result.subjectCoverage).toEqual([
      expect.objectContaining({
        subject: 'Physics',
        totalTopics: 3,
        masteredTopics: 1,
        activeTopics: 1,
        notStartedTopics: 1,
      }),
    ]);
    expect(
      result.subjectCoverage[0].topics.map((topic) => topic.topic),
    ).toEqual(['Electric Field', 'Capacitance', 'Gauss Law']);
  });

  it('degrades gracefully when one section fails instead of failing the whole dashboard', async () => {
    diagnosticsService.getDashboard.mockRejectedValue(
      new Error('diagnostics db timeout'),
    );
    notebookService.getMistakes.mockResolvedValue({
      cards: [
        {
          subject: 'Physics',
          chapter: 'Electrostatics',
          topic: 'Gauss Law',
          reviewState: 'DUE',
        },
      ],
    });

    const result = await service.getStudentDashboard(user);

    expect(result.diagnostics.activeAttempt).toBeNull();
    expect(result.diagnostics.recentAttempts).toEqual([]);
    expect(result.today.primary.kind).toBe('REVIEW_MISTAKES');
    expect(result.learning.activeTopics).toHaveLength(1);
  });

  it('degrades gracefully when subject coverage lookup throws', async () => {
    diagnosticsService.getDashboard.mockResolvedValue(
      diagnosticDashboard(null),
    );
    questionsRepository.createQueryBuilder.mockImplementation(() => {
      throw new Error('connection pool exhausted');
    });

    const result = await service.getStudentDashboard(user);

    expect(result.subjectCoverage).toEqual([]);
    expect(result.today).toBeDefined();
  });
});
