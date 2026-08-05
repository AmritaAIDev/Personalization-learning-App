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
  const agentService = {
    generateTutorResponse: jest.fn(),
    retrieveSupplementalSources: jest.fn(),
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
      agentService as never,
    );
    agentService.retrieveSupplementalSources.mockResolvedValue([]);
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

  type IntegrityAccess = {
    buildIntegritySignal: (
      questions: Array<{ id: string; options: string[]; correct_answer: string }>,
      answers: Map<
        string,
        { selectedOption: string | null; elapsedSeconds: number | null }
      >,
    ) => {
      guessingSuspected: boolean;
      fastWrongCount: number;
      note: string | null;
    };
    buildRecap: (
      scorePercent: number,
      grade: string,
      topicPerformance: Array<{ label: string; status: string; score: number }>,
      weakTopics: string[],
    ) => string;
    viewAnalysisFor: (analysis: unknown, isAdmin: boolean) => { integrity: unknown };
  };

  function optionQuestion(id: string, correct: string) {
    return { id, options: ['A', 'B', 'C', 'D'], correct_answer: correct };
  }

  it('flags a burst of implausibly fast wrong answers as a possible guess pattern', () => {
    const access = service as unknown as IntegrityAccess;
    const questions = Array.from({ length: 6 }, (_, index) =>
      optionQuestion(`q${index}`, 'A'),
    );
    const answers = new Map(
      questions.map((question, index) => [
        question.id,
        // Five of six are wrong and answered in 2 seconds.
        {
          selectedOption: index === 0 ? 'A' : 'B',
          elapsedSeconds: 2,
        },
      ]),
    );

    const signal = access.buildIntegritySignal(questions, answers);

    expect(signal.guessingSuspected).toBe(true);
    expect(signal.fastWrongCount).toBe(5);
    expect(signal.note).toContain('Possible guess pattern');
  });

  it('flags an all-same-position answer pattern', () => {
    const access = service as unknown as IntegrityAccess;
    const questions = Array.from({ length: 6 }, (_, index) =>
      optionQuestion(`q${index}`, index % 2 ? 'B' : 'A'),
    );
    // Every answer reuses slot 2 ("C"), and there is enough thinking time.
    const answers = new Map(
      questions.map((question) => [
        question.id,
        { selectedOption: 'C', elapsedSeconds: 40 },
      ]),
    );

    const signal = access.buildIntegritySignal(questions, answers);

    expect(signal.guessingSuspected).toBe(true);
    expect(signal.note).toContain('same option position');
  });

  it('does not flag a normal, considered attempt', () => {
    const access = service as unknown as IntegrityAccess;
    const questions = Array.from({ length: 6 }, (_, index) =>
      optionQuestion(`q${index}`, 'A'),
    );
    const answers = new Map(
      questions.map((question, index) => [
        question.id,
        {
          selectedOption: ['A', 'B', 'C', 'D'][index % 4],
          elapsedSeconds: 45,
        },
      ]),
    );

    const signal = access.buildIntegritySignal(questions, answers);

    expect(signal.guessingSuspected).toBe(false);
    expect(signal.note).toBeNull();
  });

  it('builds a deterministic recap from the performance rows', () => {
    const access = service as unknown as IntegrityAccess;
    const recap = access.buildRecap(
      62,
      'Good',
      [
        { label: 'Electric Field', status: 'strong', score: 90 },
        { label: 'Gauss Law', status: 'weak', score: 20 },
      ],
      ['Gauss Law'],
    );

    expect(recap).toContain('62%');
    expect(recap).toContain('Electric Field');
    expect(recap).toContain('Gauss Law');
  });

  it('redacts the admin-only integrity signal from a student view', () => {
    const access = service as unknown as IntegrityAccess;
    const analysis = {
      integrity: {
        guessingSuspected: true,
        fastWrongCount: 5,
        dominantOptionShare: 0.9,
        note: 'Possible guess pattern.',
      },
    };

    const studentView = access.viewAnalysisFor(analysis, false);
    const adminView = access.viewAnalysisFor(analysis, true);

    expect(studentView.integrity).toMatchObject({
      guessingSuspected: false,
      note: null,
    });
    expect(adminView.integrity).toMatchObject({
      guessingSuspected: true,
      note: 'Possible guess pattern.',
    });
  });

  it('explains a reviewed question and falls back to the stored solution when the model fails', async () => {
    const question = {
      id: 'question-1',
      subject: 'Physics',
      chapter: 'Electric Charges and Fields',
      topic: 'Gauss Law',
      question_text: 'Q?',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 'A',
      solution: 'Stored worked solution.',
      common_errors: ['Forgetting the enclosed charge'],
    };
    attemptsRepository.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'student-1',
      questionIds: ['question-1'],
      analysis: { scorePercent: 50 },
      answers: [{ questionId: 'question-1', selectedOption: 'B' }],
    });
    questionsRepository.findOne.mockResolvedValue(question);
    agentService.generateTutorResponse.mockRejectedValue(new Error('down'));

    const result = await service.explainReviewQuestion(
      'student-1',
      'attempt-1',
      'question-1',
      {},
    );

    expect(result.grounded).toBe(false);
    expect(result.explanation).toContain('Stored worked solution.');
  });
});
