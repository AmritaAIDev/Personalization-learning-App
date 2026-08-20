import { createHash } from 'node:crypto';
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

function makeConceptSummaryRepository(
  existing: {
    sourceHash: string;
    conceptLabel: string;
    misconceptionSummary: string;
  } | null = null,
) {
  return {
    findOne: jest.fn().mockResolvedValue(
      existing
        ? {
            id: 'cached-1',
            userId: 'user-1',
            subject: 'Physics',
            chapter: 'Electrostatics',
            topic: 'Gauss Law',
            ...existing,
          }
        : null,
    ),
    create: jest.fn((entity: Record<string, unknown>) => entity),
    save: jest.fn().mockResolvedValue(undefined),
  } as never;
}

function makeMistakeReviewRepository() {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((entity: Record<string, unknown>) => entity),
    save: jest.fn().mockResolvedValue(undefined),
  } as never;
}

function makeConceptService(
  label = 'Flux vs enclosed charge',
  summary = 'You keep treating outside charge as contributing to flux.',
) {
  return {
    summariseGroup: jest.fn().mockResolvedValue({
      conceptLabel: label,
      misconceptionSummary: summary,
      source: 'LLM' as const,
    }),
  };
}

function makeMisconceptionsService() {
  return {
    recordFromWrongAnswer: jest.fn().mockResolvedValue(undefined),
    getDominantForTopic: jest.fn().mockResolvedValue(null),
    getDominantByTopic: jest.fn().mockResolvedValue(new Map()),
  };
}

function practiceAnswer(
  id: string,
  topic: string,
  occurredAt: string,
  misconception = 'Gap',
) {
  return {
    id,
    selectedOption: 'A',
    updatedAt: new Date(occurredAt),
    question: {
      id: `q-${id}`,
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic,
      question_text: `${topic} question`,
      correct_answer: 'B',
      solution: 'Solution',
      common_errors: [misconception],
      concept_tags: ['flux'],
      difficulty: 'Easy',
      bloom_level: 'Remember',
    },
  };
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
      { createQueryBuilder: jest.fn(() => makeQueryBuilder([])) } as never,
      makeConceptSummaryRepository(),
      makeMistakeReviewRepository(),
      makeConceptService() as never,
      makeMisconceptionsService() as never,
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
      { createQueryBuilder: jest.fn(() => makeQueryBuilder([])) } as never,
      makeConceptSummaryRepository(),
      makeMistakeReviewRepository(),
      makeConceptService() as never,
      makeMisconceptionsService() as never,
    );

    const result = await service.getMistakes('user-1');

    expect(result.total).toBe(1);
    expect(result.cards[0]).toMatchObject({
      id: 'practice:latest',
      selectedOption: 'C',
    });
  });

  it('clubs mistakes into concept groups by topic and enriches via the LLM', async () => {
    const practiceQb = makeQueryBuilder([
      practiceAnswer(
        'p1',
        'Gauss Law',
        '2026-07-20T10:00:00.000Z',
        'Flux depends on outside charge.',
      ),
      practiceAnswer(
        'p2',
        'Gauss Law',
        '2026-07-22T10:00:00.000Z',
        'Confusing field with flux.',
      ),
    ]);
    const adaptiveQb = makeQueryBuilder([
      {
        id: 'a1',
        selectedOption: 'A',
        createdAt: new Date('2026-07-21T10:00:00.000Z'),
        sessionItem: {
          question: null,
          generatedQuestion: {
            id: 'gq-1',
            subject: 'Physics',
            chapter: 'Electrostatics',
            topic: 'Capacitance',
            questionText: 'Capacitor question',
            correctAnswer: 'B',
            solution: 'Solution',
            commonErrors: ['Misreading plate area.'],
            conceptTags: ['capacitance'],
            difficulty: 'Medium',
            bloomLevel: 'Apply',
          },
        },
      },
    ]);
    const conceptService = makeConceptService(
      'Gauss Law — flux vs enclosed charge',
      'You repeatedly treat outside charge as if it contributes to flux.',
    );
    const service = new NotebookService(
      { createQueryBuilder: jest.fn(() => practiceQb) } as never,
      { createQueryBuilder: jest.fn(() => adaptiveQb) } as never,
      { createQueryBuilder: jest.fn(() => makeQueryBuilder([])) } as never,
      makeConceptSummaryRepository(),
      makeMistakeReviewRepository(),
      conceptService as never,
      makeMisconceptionsService() as never,
    );

    const result = await service.getConceptGroups('user-1');

    expect(result.groupCount).toBe(2);
    // Groups are sorted by mistake count descending, so Gauss Law (2) is first.
    expect(result.groups[0]).toMatchObject({
      topic: 'Gauss Law',
      mistakeCount: 2,
      summarySource: 'LLM',
      conceptLabel: 'Gauss Law — flux vs enclosed charge',
    });
    expect(result.groups[0].cards).toHaveLength(2);
    expect(result.groups[1]).toMatchObject({
      topic: 'Capacitance',
      mistakeCount: 1,
      // A singleton never calls the model — deterministic fallback.
      summarySource: 'FALLBACK',
      conceptLabel: 'Capacitance',
    });
    expect(conceptService.summariseGroup).toHaveBeenCalledTimes(1);
  });

  it('reuses a cached summary when the constituent misconceptions have not changed', async () => {
    const practiceQb = makeQueryBuilder([
      practiceAnswer(
        'p1',
        'Gauss Law',
        '2026-07-20T10:00:00.000Z',
        'Flux depends on outside charge.',
      ),
      practiceAnswer(
        'p2',
        'Gauss Law',
        '2026-07-22T10:00:00.000Z',
        'Confusing field with flux.',
      ),
    ]);
    const cachedHash = createHashFor([
      'q-p1:Flux depends on outside charge.',
      'q-p2:Confusing field with flux.',
    ]);
    const conceptService = makeConceptService();
    const summaryRepo = makeConceptSummaryRepository({
      sourceHash: cachedHash,
      conceptLabel: 'Cached label',
      misconceptionSummary: 'Cached summary',
    });
    const service = new NotebookService(
      { createQueryBuilder: jest.fn(() => practiceQb) } as never,
      { createQueryBuilder: jest.fn(() => makeQueryBuilder([])) } as never,
      { createQueryBuilder: jest.fn(() => makeQueryBuilder([])) } as never,
      summaryRepo,
      makeMistakeReviewRepository(),
      conceptService as never,
      makeMisconceptionsService() as never,
    );

    const result = await service.getConceptGroups('user-1');

    expect(result.groups[0].summarySource).toBe('CACHE');
    expect(result.groups[0].conceptLabel).toBe('Cached label');
    // The model is never called when the cache is still valid.
    expect(conceptService.summariseGroup).not.toHaveBeenCalled();
  });
});

function createHashFor(signatures: string[]): string {
  return createHash('sha256')
    .update(signatures.sort().join('|'))
    .digest('hex')
    .slice(0, 40);
}
