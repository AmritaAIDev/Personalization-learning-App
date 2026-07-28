import { BadRequestException, ConflictException } from '@nestjs/common';
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
  };
  const questionsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
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
    );
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
});
