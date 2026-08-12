import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  Question,
  QuestionPublicationStatus,
  QuestionSource,
} from '../question.entity';
import { MockTestsService } from './mock-tests.service';
import { MockTestAttemptStatus } from './mock-test.types';

function makeQuestion(
  id: string,
  subject: string,
  correctAnswer = 'A',
): Question {
  return {
    id,
    question_id: 'QUESTION-' + id,
    subject,
    chapter: subject + ' Chapter',
    topic: subject + ' Topic',
    subtopic: null,
    question_text: 'Question ' + id,
    options: ['A', 'B', 'C', 'D'],
    correct_answer: correctAnswer,
    solution: 'Explanation for ' + id,
    bloom_level: 'Apply',
    difficulty: 'Medium',
    marks: 4,
    estimated_time_sec: 60,
    concept_tags: ['tag'],
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

describe('MockTestsService', () => {
  const attemptsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };
  const answersRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const questionsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };
  let service: MockTestsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new MockTestsService(
      attemptsRepository as never,
      answersRepository as never,
      questionsRepository as never,
    );
    attemptsRepository.create.mockImplementation((input) => input);
    attemptsRepository.save.mockImplementation(async (input) => input);
    answersRepository.create.mockImplementation((input) => input);
    answersRepository.save.mockImplementation(async (input) => input);
  });

  it('draws a balanced set across all three subjects when starting fresh', async () => {
    attemptsRepository.findOne.mockResolvedValue(null);
    questionsRepository.find.mockImplementation(
      async ({ where }: { where: { subject: string } }) =>
        Array.from({ length: 25 }, (_, index) =>
          makeQuestion(`${where.subject}-${index}`, where.subject),
        ),
    );

    const result = await service.createAttempt('user-1');

    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.attempt.subjectCounts.map((s) => s.subject).sort()).toEqual([
      'Chemistry',
      'Mathematics',
      'Physics',
    ]);
    expect(result.attempt.status).toBe(MockTestAttemptStatus.IN_PROGRESS);
  });

  it('scores with JEE negative marking and computes a subject breakdown', async () => {
    const physics1 = makeQuestion('p1', 'Physics', 'A');
    const physics2 = makeQuestion('p2', 'Physics', 'A');
    const chemistry1 = makeQuestion('c1', 'Chemistry', 'A');
    const attempt = {
      id: 'attempt-1',
      userId: 'user-1',
      status: MockTestAttemptStatus.IN_PROGRESS,
      questionIds: ['p1', 'p2', 'c1'],
      totalQuestions: 3,
      maxPossibleScore: 12,
      expiresAt: new Date(Date.now() + 60_000),
      subjectCounts: [],
      difficultyMix: [],
    };
    attemptsRepository.findOne.mockResolvedValue(attempt);
    questionsRepository.find.mockResolvedValue([
      physics1,
      physics2,
      chemistry1,
    ]);
    answersRepository.find.mockResolvedValue([
      { questionId: 'p1', selectedOption: 'A' }, // correct: +4
      { questionId: 'p2', selectedOption: 'B' }, // incorrect: -1
      // c1 left unattempted: 0
    ]);
    attemptsRepository.count
      .mockResolvedValueOnce(0) // scoredLower
      .mockResolvedValueOnce(1); // totalOthers (only this attempt)

    const result = await service.submit('user-1', 'attempt-1');

    expect(result.attempt.status).toBe(MockTestAttemptStatus.SUBMITTED);
    // rawScore = 4 - 1 + 0 = 3; scorePercent = round(3/12 * 100) = 25
    expect(attempt).toMatchObject({
      rawScore: 3,
      correctCount: 1,
      incorrectCount: 1,
      unattemptedCount: 1,
      scorePercent: 25,
      // No other submitted attempts to compare against yet -> neutral midpoint.
      percentile: 50,
    });
  });

  it('rejects saving an answer after the attempt has already been submitted', async () => {
    attemptsRepository.findOne.mockResolvedValue({
      id: 'attempt-1',
      userId: 'user-1',
      status: MockTestAttemptStatus.SUBMITTED,
      questionIds: ['p1'],
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.saveAnswer('user-1', 'attempt-1', 'p1', {
        selectedOption: 'A',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects reviewing an attempt that does not belong to the caller', async () => {
    attemptsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getReview('user-1', 'someone-elses-attempt'),
    ).rejects.toThrow(NotFoundException);
  });
});
