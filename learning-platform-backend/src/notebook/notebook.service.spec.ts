import { NotebookService } from './notebook.service';
import { PracticeAttemptStatus } from '../practice/practice.types';

type QueryBuilderMock<T> = {
  innerJoinAndSelect: jest.Mock<QueryBuilderMock<T>, [string, string]>;
  leftJoinAndSelect: jest.Mock<QueryBuilderMock<T>, [string, string]>;
  where: jest.Mock<QueryBuilderMock<T>, [string, Record<string, unknown>]>;
  andWhere: jest.Mock<QueryBuilderMock<T>, [string, Record<string, unknown>?]>;
  orderBy: jest.Mock<QueryBuilderMock<T>, [string, string]>;
  take: jest.Mock<QueryBuilderMock<T>, [number]>;
  getMany: jest.Mock<Promise<T[]>, []>;
};

function makeQueryBuilder<T>(rows: T[]): QueryBuilderMock<T> {
  const builder = {
    innerJoinAndSelect: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    take: jest.fn(),
    getMany: jest.fn().mockResolvedValue(rows),
  } as QueryBuilderMock<T>;

  builder.innerJoinAndSelect.mockReturnValue(builder);
  builder.leftJoinAndSelect.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.andWhere.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  builder.take.mockReturnValue(builder);

  return builder;
}

describe('NotebookService', () => {
  it('builds mistake cards from submitted practice answers and adaptive answers', async () => {
    const practiceAnswer = {
      id: 'practice-answer-1',
      selectedOption: 'A',
      updatedAt: new Date('2026-07-20T10:00:00.000Z'),
      question: {
        id: 'question-1',
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
        question_text: 'What does electric flux measure?',
        correct_answer: 'B',
        solution: 'Flux measures field passing through a surface.',
        common_errors: ['Confusing flux with electric field magnitude.'],
        concept_tags: ['flux', 'field lines'],
        difficulty: 'Easy',
        bloom_level: 'Remember',
      },
    };
    const adaptiveAnswer = {
      id: 'adaptive-answer-1',
      selectedOption: 'C',
      createdAt: new Date('2026-07-21T10:00:00.000Z'),
      sessionItem: {
        question: null,
        generatedQuestion: {
          id: 'generated-question-1',
          subject: 'Physics',
          chapter: 'Electrostatics',
          topic: 'Gauss Law',
          questionText: 'Which surface is best for a point charge?',
          correctAnswer: 'D',
          solution: 'A sphere keeps the field constant by symmetry.',
          commonErrors: ['Choosing a cube without symmetry reasoning.'],
          conceptTags: ['symmetry', 'Gaussian surface'],
          difficulty: 'Medium',
          bloomLevel: 'Apply',
        },
      },
    };
    const practiceQueryBuilder = makeQueryBuilder([practiceAnswer]);
    const adaptiveQueryBuilder = makeQueryBuilder([adaptiveAnswer]);
    const service = new NotebookService(
      { createQueryBuilder: jest.fn(() => practiceQueryBuilder) } as never,
      { createQueryBuilder: jest.fn(() => adaptiveQueryBuilder) } as never,
    );

    const result = await service.getMistakes('user-1');

    expect(practiceQueryBuilder.andWhere).toHaveBeenCalledWith(
      'attempt.status = :status',
      { status: PracticeAttemptStatus.SUBMITTED },
    );
    expect(result.total).toBe(2);
    expect(result.cards[0]).toMatchObject({
      id: 'adaptive:adaptive-answer-1',
      source: 'ADAPTIVE',
      correctOption: 'D',
      misconception: 'Choosing a cube without symmetry reasoning.',
      dueReviewAt: '2026-07-22T10:00:00.000Z',
    });
    expect(result.cards[1]).toMatchObject({
      id: 'practice:practice-answer-1',
      source: 'PRACTICE',
      correctOption: 'B',
      misconception: 'Confusing flux with electric field magnitude.',
    });
  });

  it('keeps only the latest card for the same source and question', async () => {
    const older = {
      id: 'older',
      selectedOption: 'A',
      updatedAt: new Date('2026-07-20T10:00:00.000Z'),
      question: {
        id: 'question-1',
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
        question_text: 'Flux question',
        correct_answer: 'B',
        solution: 'Solution',
        common_errors: [],
        concept_tags: [],
        difficulty: 'Easy',
        bloom_level: 'Remember',
      },
    };
    const latest = {
      ...older,
      id: 'latest',
      selectedOption: 'C',
      updatedAt: new Date('2026-07-22T10:00:00.000Z'),
    };
    const service = new NotebookService(
      {
        createQueryBuilder: jest.fn(() => makeQueryBuilder([older, latest])),
      } as never,
      { createQueryBuilder: jest.fn(() => makeQueryBuilder([])) } as never,
    );

    const result = await service.getMistakes('user-1');

    expect(result.total).toBe(1);
    expect(result.cards[0]).toMatchObject({
      id: 'practice:latest',
      selectedOption: 'C',
    });
  });
});
