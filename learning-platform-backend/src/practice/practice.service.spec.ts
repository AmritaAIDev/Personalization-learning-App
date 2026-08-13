import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  Question,
  QuestionPublicationStatus,
  QuestionSource,
} from '../question.entity';
import { PracticeService } from './practice.service';
import { PracticeAttemptStatus } from './practice.types';

function makeQuestion(
  id: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  index: number,
): Question {
  return {
    id,
    question_id: 'QUESTION-' + id,
    subject: 'Physics',
    chapter: 'Electric Charges and Fields',
    topic: "Coulomb's Law and Charge",
    subtopic: null,
    question_text: 'Question ' + id,
    options: ['A', 'B', 'C', 'D'],
    correct_answer: 'A',
    solution: 'Server-side explanation for question ' + id,
    bloom_level: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate'][
      index % 5
    ],
    difficulty,
    marks: 4,
    estimated_time_sec: 60,
    concept_tags: ['concept-' + (index % 3)],
    common_errors: [],
    status: QuestionPublicationStatus.PUBLISHED,
    source: QuestionSource.CURATED,
    quality_score: 90,
    created_by_user_id: null,
    reviewed_by_user_id: null,
    reviewed_at: null,
    review_notes: null,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };
}

describe('PracticeService', () => {
  const attemptsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const answersRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    upsert: jest.fn(),
  };
  const questionsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const agentService = {
    generateTutorResponse: jest.fn(),
    retrieveSupplementalSources: jest.fn(),
  };
  const misconceptionsService = {
    recordFromWrongAnswer: jest.fn().mockResolvedValue(undefined),
  };
  let service: PracticeService;

  const bank = [
    ...Array.from({ length: 5 }, (_, index) =>
      makeQuestion('easy-' + index, 'Easy', index),
    ),
    ...Array.from({ length: 5 }, (_, index) =>
      makeQuestion('medium-' + index, 'Medium', index + 5),
    ),
    ...Array.from({ length: 5 }, (_, index) =>
      makeQuestion('hard-' + index, 'Hard', index + 10),
    ),
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    service = new PracticeService(
      attemptsRepository as never,
      answersRepository as never,
      questionsRepository as never,
      agentService as never,
      misconceptionsService as never,
    );
    agentService.retrieveSupplementalSources.mockResolvedValue([]);
  });

  it('creates a 15-question practice session with five questions in each tier', async () => {
    attemptsRepository.findOne.mockResolvedValue(null);
    questionsRepository.find.mockResolvedValue(bank);
    attemptsRepository.create.mockImplementation((input) => ({
      id: 'attempt-1',
      ...input,
    }));
    attemptsRepository.save.mockImplementation(async (input) => input);

    const payload = await service.createOrResume(
      {
        id: 'student-1',
        name: 'Student',
        email: 'student@example.invalid',
        role: 'student',
        xp: 0,
        level: 1,
        streak: 0,
      },
      {
        subject: 'Physics',
        chapter: 'Electric Charges and Fields',
        topic: "Coulomb's Law and Charge",
      },
    );

    const created = attemptsRepository.create.mock.calls[0][0];
    const selected = bank.filter((question) =>
      created.questionIds.includes(question.id),
    );
    expect(payload.questions).toHaveLength(15);
    expect(
      selected.filter((question) => question.difficulty === 'Easy'),
    ).toHaveLength(5);
    expect(
      selected.filter((question) => question.difficulty === 'Medium'),
    ).toHaveLength(5);
    expect(
      selected.filter((question) => question.difficulty === 'Hard'),
    ).toHaveLength(5);
    expect(JSON.stringify(payload.questions)).not.toContain('correct_answer');
    expect(JSON.stringify(payload.questions)).not.toContain('solution');
  });

  it('builds the largest balanced set it can when a tier has fewer than five', async () => {
    const thinBank = [
      ...Array.from({ length: 2 }, (_, index) =>
        makeQuestion('easy-' + index, 'Easy', index),
      ),
      ...Array.from({ length: 2 }, (_, index) =>
        makeQuestion('medium-' + index, 'Medium', index + 5),
      ),
      ...Array.from({ length: 2 }, (_, index) =>
        makeQuestion('hard-' + index, 'Hard', index + 10),
      ),
    ];
    attemptsRepository.findOne.mockResolvedValue(null);
    questionsRepository.find.mockResolvedValue(thinBank);
    attemptsRepository.create.mockImplementation((input) => ({
      id: 'attempt-thin',
      ...input,
    }));
    attemptsRepository.save.mockImplementation(async (input) => input);

    const payload = await service.createOrResume(
      {
        id: 'student-1',
        name: 'Student',
        email: 'student@example.invalid',
        role: 'student',
        xp: 0,
        level: 1,
        streak: 0,
      },
      {
        subject: 'Physics',
        chapter: 'Electric Charges and Fields',
        topic: "Coulomb's Law and Charge",
      },
    );

    expect(payload.questions).toHaveLength(6);
    expect(payload.attempt.totalQuestions).toBe(6);
  });

  it('still rejects a topic that is missing an entire difficulty tier', async () => {
    const noHardBank = [
      ...Array.from({ length: 3 }, (_, index) =>
        makeQuestion('easy-' + index, 'Easy', index),
      ),
      ...Array.from({ length: 3 }, (_, index) =>
        makeQuestion('medium-' + index, 'Medium', index + 5),
      ),
    ];
    attemptsRepository.findOne.mockResolvedValue(null);
    questionsRepository.find.mockResolvedValue(noHardBank);
    attemptsRepository.create.mockImplementation((input) => ({
      id: 'attempt-no-hard',
      ...input,
    }));
    attemptsRepository.save.mockImplementation(async (input) => input);

    await expect(
      service.createOrResume(
        {
          id: 'student-1',
          name: 'Student',
          email: 'student@example.invalid',
          role: 'student',
          xp: 0,
          level: 1,
          streak: 0,
        },
        {
          subject: 'Physics',
          chapter: 'Electric Charges and Fields',
          topic: "Coulomb's Law and Charge",
        },
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
  it('rejects a choice that is not one of the stored answer options', async () => {
    attemptsRepository.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'student-1',
      questionIds: ['question-1'],
      status: PracticeAttemptStatus.IN_PROGRESS,
      answers: [],
    });
    questionsRepository.findOne.mockResolvedValue(
      makeQuestion('question-1', 'Easy', 0),
    );

    await expect(
      service.saveAnswer('student-1', 'attempt-1', 'question-1', {
        selectedOption: 'invalid',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('withholds answer review until the session is submitted', async () => {
    attemptsRepository.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'student-1',
      questionIds: ['question-1'],
      status: PracticeAttemptStatus.IN_PROGRESS,
      answers: [],
      analysis: null,
    });

    await expect(
      service.getReview('student-1', 'attempt-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('persists the optional pre-answer confidence when saving', async () => {
    attemptsRepository.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'student-1',
      questionIds: ['question-1'],
      status: PracticeAttemptStatus.IN_PROGRESS,
    });
    questionsRepository.findOne.mockResolvedValue(
      makeQuestion('question-1', 'Easy', 0),
    );
    answersRepository.upsert.mockResolvedValue(undefined);

    await service.saveAnswer('student-1', 'attempt-1', 'question-1', {
      selectedOption: 'A',
      confidence: 3,
    });

    expect(answersRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ confidence: 3 }),
      expect.anything(),
    );
  });

  it('flags an overconfident wrong answer on review', async () => {
    const question = makeQuestion('question-1', 'Easy', 0);
    attemptsRepository.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'student-1',
      questionIds: ['question-1'],
      status: PracticeAttemptStatus.SUBMITTED,
      analysis: { scorePercent: 0 },
      answers: [
        {
          questionId: 'question-1',
          selectedOption: 'B',
          isCorrect: false,
          confidence: 3,
        },
      ],
    });
    questionsRepository.find.mockResolvedValue([question]);

    const review = await service.getReview('student-1', 'attempt-1');

    expect(review.results[0].confidence).toBe(3);
    expect(review.results[0].calibration).toBe('overconfident');
  });

  it('explains a reviewed question through the tutor when the model is available', async () => {
    const question = makeQuestion('question-1', 'Easy', 0);
    attemptsRepository.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'student-1',
      questionIds: ['question-1'],
      status: PracticeAttemptStatus.SUBMITTED,
      analysis: { scorePercent: 50 },
      answers: [{ questionId: 'question-1', selectedOption: 'B' }],
    });
    questionsRepository.findOne.mockResolvedValue(question);
    agentService.generateTutorResponse.mockResolvedValue('### Grounded answer');
    agentService.retrieveSupplementalSources.mockResolvedValue([
      { title: "Gauss's Law", topic: 'Gauss Law', chapter: 'EF', snippet: 'x' },
      { title: "Gauss's Law", topic: 'Gauss Law', chapter: 'EF', snippet: 'y' },
    ]);

    const result = await service.explainReviewQuestion(
      'student-1',
      'attempt-1',
      'question-1',
      { depth: 'concise' },
    );

    expect(result.grounded).toBe(true);
    expect(result.explanation).toContain('Grounded answer');
    expect(agentService.generateTutorResponse).toHaveBeenCalledWith(
      expect.objectContaining({ answerRevealed: true, depth: 'concise' }),
    );
    // Citations are de-duplicated by title and never leak the raw snippet.
    expect(result.sources).toEqual([
      { title: "Gauss's Law", topic: 'Gauss Law', chapter: 'EF' },
    ]);
  });

  it('falls back to the stored solution when the tutor is unavailable', async () => {
    const question = makeQuestion('question-1', 'Easy', 0);
    attemptsRepository.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'student-1',
      questionIds: ['question-1'],
      status: PracticeAttemptStatus.SUBMITTED,
      analysis: { scorePercent: 50 },
      answers: [{ questionId: 'question-1', selectedOption: 'B' }],
    });
    questionsRepository.findOne.mockResolvedValue(question);
    agentService.generateTutorResponse.mockRejectedValue(
      new Error('model down'),
    );

    const result = await service.explainReviewQuestion(
      'student-1',
      'attempt-1',
      'question-1',
      {},
    );

    expect(result.grounded).toBe(false);
    expect(result.explanation).toContain(question.solution);
  });
});
