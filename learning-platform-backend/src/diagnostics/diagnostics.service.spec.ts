import { BadRequestException } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticAttemptStatus } from './diagnostic.types';

describe('DiagnosticsService', () => {
  const attemptsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const answersRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };
  const questionsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };
  const resourcesRepository = {
    find: jest.fn(),
  };
  const topicStatesRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  let service: DiagnosticsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new DiagnosticsService(
      attemptsRepository as never,
      answersRepository as never,
      questionsRepository as never,
      resourcesRepository as never,
      topicStatesRepository as never,
    );
  });

  it('rejects an option that does not belong to the server-side question', async () => {
    attemptsRepository.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'student-1',
      questionIds: ['question-1'],
      status: DiagnosticAttemptStatus.IN_PROGRESS,
      expiresAt: new Date(Date.now() + 60_000),
      answers: [],
    });
    questionsRepository.findOne.mockResolvedValue({
      id: 'question-1',
      options: ['A. 1', 'B. 2'],
    });

    await expect(
      service.saveAnswer('student-1', 'attempt-1', 'question-1', {
        selectedOption: 'C. 3',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(answersRepository.save).not.toHaveBeenCalled();
  });

  it('calculates result data on the server from stored answer selections', async () => {
    const firstAnswer = {
      questionId: 'question-1',
      selectedOption: 'A. Correct',
      isCorrect: null,
    };
    const secondAnswer = {
      questionId: 'question-2',
      selectedOption: 'B. Incorrect',
      isCorrect: null,
    };
    const attempt = {
      id: 'attempt-1',
      userId: 'student-1',
      questionIds: ['question-1', 'question-2'],
      status: DiagnosticAttemptStatus.IN_PROGRESS,
      expiresAt: new Date(Date.now() + 60_000),
      answers: [firstAnswer, secondAnswer],
      analysis: null,
      correctCount: 0,
      scorePercent: 0,
      submittedAt: null,
    };
    attemptsRepository.findOne.mockResolvedValue(attempt);
    questionsRepository.find.mockResolvedValue([
      {
        id: 'question-1',
        topic: 'Coulomb Law',
        bloom_level: 'Apply',
        correct_answer: 'A. Correct',
      },
      {
        id: 'question-2',
        topic: 'Electric Field',
        bloom_level: 'Understand',
        correct_answer: 'C. Correct',
      },
    ]);
    answersRepository.save.mockImplementation(async (answer) => answer);
    attemptsRepository.save.mockImplementation(
      async (savedAttempt) => savedAttempt,
    );

    const result = await service.submitAttempt('student-1', 'attempt-1');

    expect(firstAnswer.isCorrect).toBe(true);
    expect(secondAnswer.isCorrect).toBe(false);
    expect(result.data.analysis).toMatchObject({
      total: 2,
      correct: 1,
      incorrect: 1,
      scorePercent: 50,
      grade: 'Average',
      weakTopics: [],
    });
    expect(attempt.status).toBe(DiagnosticAttemptStatus.SUBMITTED);
  });

  it('only clears completed diagnostic records, preserving a resumable attempt', async () => {
    attemptsRepository.delete.mockResolvedValue({ affected: 2 });

    await expect(
      service.clearHistory('student-1', { confirmation: 'DELETE' }),
    ).resolves.toEqual({ data: { clearedAttempts: 2 } });

    expect(attemptsRepository.delete).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'student-1' }),
    );
  });

  it('prefers unseen reviewed questions when a balanced diagnostic can be formed', async () => {
    const bank = ['Easy', 'Medium', 'Hard'].flatMap((difficulty) =>
      Array.from({ length: 10 }, (_, index) => ({
        id: `${difficulty}-${index}`,
        difficulty,
        bloom_level: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate'][
          index % 5
        ],
        chapter:
          index % 2
            ? 'Electric Charges and Fields'
            : 'Electrostatic Potential and Capacitance',
        quality_score: 90,
      })),
    );
    const recentlyUsed = bank.filter(
      (question) => Number(question.id.split('-').at(-1)) < 5,
    );
    questionsRepository.find.mockResolvedValue(bank);
    attemptsRepository.find.mockResolvedValue([
      { questionIds: recentlyUsed.map((question) => question.id) },
    ]);

    const selected = await (
      service as unknown as {
        getQuestionSet: (
          userId: string,
          subject: string,
        ) => Promise<Array<{ id: string }>>;
      }
    ).getQuestionSet('student-1', 'Physics');

    expect(selected).toHaveLength(15);
    expect(selected.map((question) => question.id)).not.toEqual(
      expect.arrayContaining(recentlyUsed.map((question) => question.id)),
    );
  });
});
