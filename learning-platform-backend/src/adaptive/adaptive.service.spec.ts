import { DataSource, Repository } from 'typeorm';
import {
  AdaptiveContentService,
  LearningQuestionReference,
} from './adaptive-content.service';
import { AdaptiveService } from './adaptive.service';
import { Flashcard } from './flashcard.entity';
import { FlashcardReview } from './flashcard-review.entity';
import { GenerationWorkerService } from './generation-worker.service';
import { LearningSession } from './learning-session.entity';
import { LearningTopicState } from './learning-topic-state.entity';
import {
  FlashcardRating,
  FlashcardSource,
  FlashcardStatus,
  LearningSessionStatus,
  LearningSessionTransition,
  LearningQuestionSource,
  LearningTopicStatus,
} from './adaptive.types';
import { LearningSessionItem } from './learning-session-item.entity';
import { LearningAnswer } from './learning-answer.entity';
import { TutorService } from './tutor.service';
import { Question } from '../question.entity';
import { Topic } from '../topics/topic.entity';
import { AgentService } from '../agent/agent.service';
import { MisconceptionsService } from '../misconceptions/misconceptions.service';
import { User } from '../users/user.entity';

describe('AdaptiveService flashcard reviews', () => {
  const card: Flashcard = {
    id: 'card-id',
    subject: 'Physics',
    chapter: 'Electrostatics',
    topic: "Coulomb's Law and Charge",
    front: "State Coulomb's law.",
    back: 'F = k|q1q2|/r^2.',
    hint: 'Use separation squared.',
    tags: ['formula'],
    source: FlashcardSource.CURATED,
    status: FlashcardStatus.PUBLISHED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createService(review: FlashcardReview | null): {
    service: AdaptiveService;
    save: jest.Mock;
  } {
    const save = jest.fn(async (value: FlashcardReview) => ({
      ...value,
      id: 'review-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const flashcards = {
      findOne: jest.fn(async () => card),
    } as unknown as Repository<Flashcard>;
    const reviews = {
      findOne: jest.fn(async () => review),
      create: jest.fn(
        (value: Partial<FlashcardReview>) => value as FlashcardReview,
      ),
      save,
    } as unknown as Repository<FlashcardReview>;
    const service = new AdaptiveService(
      {} as DataSource,
      {} as AdaptiveContentService,
      {} as GenerationWorkerService,
      {} as TutorService,
      {} as AgentService,
      {} as MisconceptionsService,
      {} as Repository<LearningTopicState>,
      {} as Repository<LearningSession>,
      flashcards,
      reviews,
      {} as Repository<Question>,
      {} as Repository<Topic>,
    );
    return { service, save };
  }

  it('sets a short first interval for a good first review, from FSRS init weights', async () => {
    const { service, save } = createService(null);
    const result = await service.reviewFlashcard('user-id', 'card-id', {
      rating: FlashcardRating.GOOD,
    });
    // Deterministic: default weight w[2] (Good's init stability) is 2.3065
    // days, and interval == stability exactly at the 90% retention target.
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ repetitions: 1, intervalDays: 2 }),
    );
    expect(result.review).toMatchObject({ repetitions: 1, intervalDays: 2 });
  });

  it('shrinks stability on an AGAIN rating after the card was actually forgotten', async () => {
    const existing = {
      id: 'review-id',
      userId: 'user-id',
      flashcardId: 'card-id',
      lastRating: FlashcardRating.GOOD,
      repetitions: 4,
      intervalDays: 8,
      difficulty: 5,
      stability: 8,
      dueAt: new Date(),
      // A week ago, so this AGAIN takes FSRS's forgetting/lapse path rather
      // than the same-day short-term path.
      lastReviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as FlashcardReview;
    const originalStability = existing.stability;
    const { service, save } = createService(existing);

    // `reviewFlashcard` mutates the review object findOne returned in place
    // (Object.assign), so the pre-review stability must be captured above.
    await service.reviewFlashcard('user-id', 'card-id', {
      rating: FlashcardRating.AGAIN,
    });

    const [saved] = save.mock.calls[0] as [FlashcardReview];
    expect(saved.lastRating).toBe(FlashcardRating.AGAIN);
    expect(saved.repetitions).toBe(5);
    expect(saved.stability).toBeLessThan(originalStability);
  });

  it('never lets a successful (non-Again) rating shrink stability', async () => {
    const existing = {
      id: 'review-id',
      userId: 'user-id',
      flashcardId: 'card-id',
      lastRating: FlashcardRating.GOOD,
      repetitions: 2,
      intervalDays: 6,
      difficulty: 5,
      stability: 6,
      dueAt: new Date(),
      lastReviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as FlashcardReview;

    for (const rating of [
      FlashcardRating.HARD,
      FlashcardRating.GOOD,
      FlashcardRating.EASY,
    ]) {
      const { service, save } = createService({ ...existing });
      await service.reviewFlashcard('user-id', 'card-id', { rating });
      const [saved] = save.mock.calls[0] as [FlashcardReview];
      expect(saved.stability).toBeGreaterThanOrEqual(existing.stability);
    }
  });

  it('keeps difficulty within the FSRS [1,10] band after a review', async () => {
    const existing = {
      id: 'review-id',
      userId: 'user-id',
      flashcardId: 'card-id',
      lastRating: FlashcardRating.HARD,
      repetitions: 1,
      intervalDays: 1,
      difficulty: 1,
      stability: 1,
      dueAt: new Date(),
      lastReviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as FlashcardReview;
    const { service, save } = createService(existing);

    await service.reviewFlashcard('user-id', 'card-id', {
      rating: FlashcardRating.HARD,
    });

    const [saved] = save.mock.calls[0] as [FlashcardReview];
    expect(saved.difficulty).toBeGreaterThanOrEqual(1);
    expect(saved.difficulty).toBeLessThanOrEqual(10);
  });

  type FlashcardDeliveryHarness = {
    service: AdaptiveService;
    generateFlashcards: jest.Mock;
    saveFlashcards: jest.Mock;
    countFlashcards: jest.Mock;
  };

  function createDeliveryService(
    poolRows: Array<Record<string, unknown>>,
    generated: Array<{
      front: string;
      back: string;
      hint: string | null;
      tags: string[];
    }>,
  ): FlashcardDeliveryHarness {
    const saveFlashcards = jest.fn(async (values: Partial<Flashcard>[]) =>
      values.map((value, index) => ({
        ...value,
        id: `saved-${index}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
    const countFlashcards = jest.fn(async () => poolRows.length);
    const flashcards = {
      create: jest.fn((value: Partial<Flashcard>) => value as Flashcard),
      save: saveFlashcards,
      find: jest.fn(async () => []),
      count: countFlashcards,
    } as unknown as Repository<Flashcard>;
    const dataSource = {
      query: jest.fn(async (_sql: string, params: unknown[]) =>
        poolRows.slice(0, Number(params[params.length - 1])),
      ),
    } as unknown as DataSource;
    const questions = {
      find: jest.fn(async () => [
        {
          question_text: 'What does Gauss law connect in electrostatics?',
          solution:
            'Gauss law connects electric flux through a closed surface to enclosed charge.',
          concept_tags: ['gauss-law', 'flux'],
        },
      ]),
    } as unknown as Repository<Question>;
    const generateFlashcards = jest.fn(async () => generated);
    const agent = { generateFlashcards } as unknown as AgentService;
    const service = new AdaptiveService(
      dataSource,
      {} as AdaptiveContentService,
      {} as GenerationWorkerService,
      {} as TutorService,
      agent,
      {} as MisconceptionsService,
      {} as Repository<LearningTopicState>,
      {} as Repository<LearningSession>,
      flashcards,
      {} as Repository<FlashcardReview>,
      questions,
      {} as Repository<Topic>,
    );
    return { service, generateFlashcards, saveFlashcards, countFlashcards };
  }

  it('serves a warm card pool without waiting on the model', async () => {
    const { service, generateFlashcards } = createDeliveryService(
      Array.from({ length: 8 }, (_, index) => ({
        id: `card-${index}`,
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
        front: `Prompt ${index}`,
        back: `Answer ${index}`,
        hint: null,
        tags: ['gauss-law'],
        lastRating: null,
        repetitions: null,
        intervalDays: null,
        dueAt: null,
        lastReviewedAt: null,
      })),
      [],
    );

    const result = await service.generateFlashcards('user-id', {
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      count: 6,
    });

    expect(generateFlashcards).not.toHaveBeenCalled();
    expect(result).toHaveLength(6);
    expect(result[0]).toMatchObject({ id: 'card-0', review: null });
  });

  it('skips prompts the running deck already showed', async () => {
    const { service } = createDeliveryService(
      Array.from({ length: 8 }, (_, index) => ({
        id: `card-${index}`,
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
        front: `Prompt ${index}`,
        back: `Answer ${index}`,
        hint: null,
        tags: [],
        lastRating: null,
        repetitions: null,
        intervalDays: null,
        dueAt: null,
        lastReviewedAt: null,
      })),
      [],
    );

    const result = await service.generateFlashcards('user-id', {
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      count: 3,
      excludedPrompts: ['prompt 0', 'Prompt 1'],
    });

    expect(result.map((card) => card.id)).toEqual([
      'card-2',
      'card-3',
      'card-4',
    ]);
  });

  it('persists generated cards so ratings and later runs reuse them', async () => {
    const { service, generateFlashcards, saveFlashcards } =
      createDeliveryService(
        [],
        [
          {
            front: 'What does Gauss law relate?',
            back: 'It relates net electric flux through a closed surface to enclosed charge.',
            hint: 'Think closed surface and charge inside.',
            tags: ['gauss-law'],
          },
        ],
      );

    const result = await service.generateFlashcards('user-id', {
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      count: 6,
    });

    expect(generateFlashcards).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: 'Gauss Law',
      }),
    );
    expect(saveFlashcards).toHaveBeenCalled();
    expect(result).toEqual([
      expect.objectContaining({
        id: 'saved-0',
        front: 'What does Gauss law relate?',
        review: null,
      }),
    ]);
  });
});

describe('AdaptiveService second-attempt tutor routing', () => {
  it('explains a level-one second miss even when the routing outcome is reinforce', async () => {
    const createAnswerExplanation = jest.fn(async () => ({
      id: 'message-id',
      role: 'ASSISTANT',
      messageType: 'ANSWER_EXPLANATION',
      content: 'Explanation',
      relatedSessionItemId: 'item-id',
      createdAt: new Date(),
    }));
    const markPending = jest.fn();
    const tutor = {
      createAnswerExplanation,
      markPending,
    } as unknown as TutorService;
    const dataSource = {
      transaction: jest.fn(async (work: (manager: never) => Promise<unknown>) =>
        work({} as never),
      ),
    } as unknown as DataSource;
    const service = new AdaptiveService(
      dataSource,
      {} as AdaptiveContentService,
      {} as GenerationWorkerService,
      tutor,
      {} as AgentService,
      {
        recordFromWrongAnswer: jest.fn().mockResolvedValue(undefined),
      } as unknown as MisconceptionsService,
      {} as Repository<LearningTopicState>,
      {} as Repository<LearningSession>,
      {} as Repository<Flashcard>,
      {} as Repository<FlashcardReview>,
      {} as Repository<Question>,
      {} as Repository<Topic>,
    );
    const question: LearningQuestionReference = {
      source: LearningQuestionSource.CURATED,
      id: 'question-id',
      questionText: 'Question text',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      solution: 'Reasoning',
      hint: null,
      conceptTags: [],
      commonErrors: [],
      bloomLevel: 'Remember',
      difficulty: 'Easy',
    };
    const privateMethods = service as unknown as {
      applyAnswer: (...args: unknown[]) => Promise<unknown>;
      getSession: (...args: unknown[]) => Promise<unknown>;
    };
    jest.spyOn(privateMethods, 'applyAnswer').mockResolvedValue({
      kind: 'REINFORCE',
      sessionId: 'session-id',
      session: {
        id: 'session-id',
        subject: 'Physics',
        chapter: 'Electrostatics',
        topic: "Coulomb's Law and Charge",
      },
      question,
      selectedOption: 'B',
      sessionItemId: 'item-id',
      shouldExplainSecondFailure: true,
      prefetchScope: null,
      prefetchLevel: null,
      route: null,
    });
    jest.spyOn(privateMethods, 'getSession').mockResolvedValue({
      state: {},
      session: {},
      currentItem: null,
      progress: [],
    });

    await service.submitAnswer('user-id', 'session-id', 'item-id', {
      selectedOption: 'B',
    });

    expect(markPending).toHaveBeenCalledWith('session-id');
    expect(createAnswerExplanation).toHaveBeenCalledWith(
      'user-id',
      expect.objectContaining({ id: 'session-id' }),
      'item-id',
      question,
      'B',
    );
  });
});

describe('AdaptiveService learning state projections', () => {
  function createProjectionService({
    states = [],
    sessions = [],
    questionsRepository = {},
    topicsRepository = {},
    contentService = {},
  }: {
    states?: LearningTopicState[];
    sessions?: LearningSession[];
    questionsRepository?: Partial<Repository<Question>>;
    topicsRepository?: Partial<Repository<Topic>>;
    contentService?: Partial<AdaptiveContentService>;
  }) {
    const statesRepository = {
      find: jest.fn(async () => states),
    } as unknown as Repository<LearningTopicState>;
    const sessionsRepository = {
      find: jest.fn(async () => sessions),
    } as unknown as Repository<LearningSession>;
    const service = new AdaptiveService(
      {} as DataSource,
      contentService as AdaptiveContentService,
      {} as GenerationWorkerService,
      {} as TutorService,
      {} as AgentService,
      {} as MisconceptionsService,
      statesRepository,
      sessionsRepository,
      {} as Repository<Flashcard>,
      {} as Repository<FlashcardReview>,
      questionsRepository as Repository<Question>,
      topicsRepository as Repository<Topic>,
    );
    return { service, statesRepository, sessionsRepository };
  }

  it('projects active state, mastered state, and completed sessions into the learning dashboard', async () => {
    const now = new Date('2026-07-28T00:00:00.000Z');
    const activeState = {
      id: 'state-active',
      userId: 'user-id',
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      currentLevel: 4,
      status: LearningTopicStatus.ACTIVE,
      streakCounter: 2,
      totalAnswered: 8,
      totalCorrect: 6,
      lastActivityAt: now,
      masteredAt: null,
      createdAt: now,
      updatedAt: now,
    } as LearningTopicState;
    const masteredState = {
      ...activeState,
      id: 'state-mastered',
      topic: 'Electric Flux',
      currentLevel: 12,
      status: LearningTopicStatus.MASTERED,
      masteredAt: now,
    } as LearningTopicState;
    const completedSession = {
      id: 'session-id',
      userId: 'user-id',
      stateId: activeState.id,
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      level: 4,
      bloomLevel: 'Comprehension',
      difficulty: 'Easy',
      status: LearningSessionStatus.COMPLETED,
      transition: LearningSessionTransition.ADVANCED,
      totalQuestions: 5,
      currentSequence: 6,
      completedAt: now,
      startedAt: now,
      updatedAt: now,
    } as LearningSession;
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(async () => []),
    };
    const { service } = createProjectionService({
      states: [activeState, masteredState],
      sessions: [completedSession],
      questionsRepository: {
        createQueryBuilder: jest.fn(() => queryBuilder),
      },
      topicsRepository: {
        find: jest.fn(async () => []),
      },
    });

    const dashboard = await service.getDashboard('user-id');

    expect(dashboard.activeTopics).toEqual([
      expect.objectContaining({
        id: 'state-active',
        topic: 'Gauss Law',
        currentLevel: 4,
        currentCoordinate: expect.objectContaining({
          level: 4,
          bloomLevel: 'Comprehension',
          difficulty: 'Easy',
        }),
        totalAnswered: 8,
        totalCorrect: 6,
      }),
    ]);
    expect(dashboard.completedTopics).toEqual([
      expect.objectContaining({
        id: 'state-mastered',
        topic: 'Electric Flux',
        masteryPercent: 100,
      }),
    ]);
    expect(dashboard.history).toEqual([
      expect.objectContaining({
        id: 'session-id',
        transition: LearningSessionTransition.ADVANCED,
        coordinate: expect.objectContaining({ level: 4 }),
      }),
    ]);
  });

  it('projects session item progress, retries, and current question without revealing answers', () => {
    const now = new Date('2026-07-28T00:00:00.000Z');
    const state = {
      id: 'state-id',
      userId: 'user-id',
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      currentLevel: 1,
      status: LearningTopicStatus.ACTIVE,
      streakCounter: 0,
      totalAnswered: 1,
      totalCorrect: 0,
      lastActivityAt: now,
      masteredAt: null,
      createdAt: now,
      updatedAt: now,
    } as LearningTopicState;
    const firstAnswer = {
      id: 'answer-id',
      sessionItemId: 'item-1',
      attemptNumber: 1,
      selectedOption: 'B',
      isCorrect: false,
      elapsedSeconds: 12,
      createdAt: now,
    } as LearningAnswer;
    const currentItem = {
      id: 'item-1',
      sessionId: 'session-id',
      sequence: 1,
      source: LearningQuestionSource.CURATED,
      questionId: 'question-id',
      generatedQuestionId: null,
      question: {
        id: 'question-id',
        question_text: 'What does Gauss Law relate?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        solution: 'Net flux relates to enclosed charge.',
        bloom_level: 'Remember',
        difficulty: 'Easy',
        concept_tags: ['flux'],
        common_errors: [],
      },
      generatedQuestion: null,
      resolvedAt: null,
      answers: [firstAnswer],
      createdAt: now,
      updatedAt: now,
    } as unknown as LearningSessionItem;
    const pendingItem = {
      ...currentItem,
      id: 'item-2',
      sequence: 2,
      questionId: 'question-2',
      answers: [],
    } as unknown as LearningSessionItem;
    const session = {
      id: 'session-id',
      stateId: state.id,
      state,
      userId: 'user-id',
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      level: 1,
      bloomLevel: 'Recall',
      difficulty: 'Easy',
      status: LearningSessionStatus.ACTIVE,
      transition: LearningSessionTransition.NONE,
      totalQuestions: 2,
      currentSequence: 1,
      items: [pendingItem, currentItem],
      completedAt: null,
      startedAt: now,
      updatedAt: now,
    } as LearningSession;
    const { service } = createProjectionService({
      contentService: {
        toQuestionReference: jest.fn((item: LearningSessionItem) => ({
          source: LearningQuestionSource.CURATED,
          id: item.questionId ?? 'question-id',
          questionText: item.question!.question_text,
          options: item.question!.options,
          correctAnswer: item.question!.correct_answer,
          solution: item.question!.solution,
          hint: null,
          conceptTags: item.question!.concept_tags ?? [],
          commonErrors: item.question!.common_errors ?? [],
          bloomLevel: item.question!.bloom_level,
          difficulty: item.question!.difficulty,
        })),
      },
    });
    const privateService = service as unknown as {
      toSessionPayload: (session: LearningSession) => {
        currentItem: {
          id: string;
          attemptCount: number;
          requiresRetry: boolean;
          questionText: string;
        } | null;
        progress: Array<{
          id: string;
          sequence: number;
          status: 'CURRENT' | 'PENDING' | 'RESOLVED';
          attemptCount: number;
        }>;
      };
    };

    const payload = privateService.toSessionPayload(session);

    expect(payload.currentItem).toEqual(
      expect.objectContaining({
        id: 'item-1',
        questionText: 'What does Gauss Law relate?',
        attemptCount: 1,
        requiresRetry: true,
      }),
    );
    expect(JSON.stringify(payload.currentItem)).not.toContain(
      'Net flux relates to enclosed charge.',
    );
    expect(payload.progress).toEqual([
      expect.objectContaining({
        id: 'item-1',
        sequence: 1,
        status: 'CURRENT',
        attemptCount: 1,
      }),
      expect.objectContaining({
        id: 'item-2',
        sequence: 2,
        status: 'PENDING',
        attemptCount: 0,
      }),
    ]);
  });
});

describe('AdaptiveService row-level answer mutations', () => {
  function createQueryBuilder<T>(row: T) {
    return {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(async () => row),
    };
  }

  function createMutationHarness({
    selectedOption,
    priorAnswers = [],
    totalQuestions = 5,
  }: {
    selectedOption: string;
    priorAnswers?: LearningAnswer[];
    totalQuestions?: number;
  }) {
    const now = new Date('2026-07-28T00:00:00.000Z');
    const state = {
      id: 'state-id',
      userId: 'user-id',
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      currentLevel: 1,
      status: LearningTopicStatus.ACTIVE,
      streakCounter: 2,
      totalAnswered: 0,
      totalCorrect: 0,
      lastActivityAt: now,
      masteredAt: null,
      createdAt: now,
      updatedAt: now,
    } as LearningTopicState;
    const session = {
      id: 'session-id',
      stateId: state.id,
      userId: 'user-id',
      subject: 'Physics',
      chapter: 'Electrostatics',
      topic: 'Gauss Law',
      level: 1,
      bloomLevel: 'Recall',
      difficulty: 'Easy',
      status: LearningSessionStatus.ACTIVE,
      transition: LearningSessionTransition.NONE,
      totalQuestions,
      currentSequence: 1,
      completedAt: null,
      startedAt: now,
      updatedAt: now,
    } as LearningSession;
    const item = {
      id: 'item-id',
      sessionId: session.id,
      sequence: 1,
      source: LearningQuestionSource.CURATED,
      questionId: 'question-id',
      generatedQuestionId: null,
      question: {
        id: 'question-id',
        question_text: 'What does Gauss Law relate?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        solution: 'Flux is linked to enclosed charge.',
        bloom_level: 'Remember',
        difficulty: 'Easy',
        concept_tags: ['flux'],
        common_errors: [],
      },
      generatedQuestion: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    } as unknown as LearningSessionItem;
    const createdAnswer = {
      sessionItemId: item.id,
      attemptNumber: priorAnswers.length + 1,
      selectedOption,
      isCorrect: selectedOption === 'A',
      elapsedSeconds: null,
    } as LearningAnswer;

    const sessionsRepository = {
      createQueryBuilder: jest.fn(() => createQueryBuilder(session)),
      save: jest.fn(async (value: LearningSession) => value),
    };
    const statesRepository = {
      createQueryBuilder: jest.fn(() => createQueryBuilder(state)),
      save: jest.fn(async (value: LearningTopicState) => value),
    };
    const itemsRepository = {
      createQueryBuilder: jest.fn(() => createQueryBuilder(item)),
      findOne: jest.fn(async () => item),
      find: jest.fn(async () => [item]),
      save: jest.fn(async (value: LearningSessionItem) => value),
    };
    const answersRepository = {
      find: jest.fn(async () => priorAnswers),
      create: jest.fn(() => createdAnswer),
      save: jest.fn(async (value: LearningAnswer) => value),
    };
    const increment = jest.fn(async () => ({ affected: 1 }));
    const levelSyncQuery = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(async () => ({ affected: 1 })),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === LearningSession) return sessionsRepository;
        if (entity === LearningTopicState) return statesRepository;
        if (entity === LearningSessionItem) return itemsRepository;
        if (entity === LearningAnswer) return answersRepository;
        throw new Error('Unexpected repository request.');
      }),
      increment,
      createQueryBuilder: jest.fn(() => levelSyncQuery),
    };
    const contentService = {
      toQuestionReference: jest.fn(() => ({
        source: LearningQuestionSource.CURATED,
        id: 'question-id',
        questionText: 'What does Gauss Law relate?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        solution: 'Flux is linked to enclosed charge.',
        hint: null,
        conceptTags: ['flux'],
        commonErrors: [],
        bloomLevel: 'Remember',
        difficulty: 'Easy',
      })),
    } as unknown as AdaptiveContentService;
    const service = new AdaptiveService(
      {} as DataSource,
      contentService,
      {} as GenerationWorkerService,
      {} as TutorService,
      {} as AgentService,
      {} as MisconceptionsService,
      {} as Repository<LearningTopicState>,
      {} as Repository<LearningSession>,
      {} as Repository<Flashcard>,
      {} as Repository<FlashcardReview>,
      {} as Repository<Question>,
      {} as Repository<Topic>,
    );
    return {
      service: service as unknown as {
        applyAnswer: (
          manager: unknown,
          userId: string,
          sessionId: string,
          sessionItemId: string,
          input: { selectedOption: string },
        ) => Promise<{ kind: string }>;
      },
      manager,
      state,
      session,
      item,
      createdAnswer,
      answersRepository,
      statesRepository,
      sessionsRepository,
      itemsRepository,
      increment,
      levelSyncQuery,
    };
  }

  it('persists the answer and reinforces state after a first wrong answer', async () => {
    const harness = createMutationHarness({ selectedOption: 'B' });

    const result = await harness.service.applyAnswer(
      harness.manager,
      'user-id',
      'session-id',
      'item-id',
      { selectedOption: 'B' },
    );

    expect(result.kind).toBe('SOCRATIC_HINT');
    expect(harness.answersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionItemId: 'item-id',
        attemptNumber: 1,
        selectedOption: 'B',
        isCorrect: false,
      }),
    );
    expect(harness.answersRepository.save).toHaveBeenCalledWith(
      harness.createdAnswer,
    );
    expect(harness.state).toMatchObject({
      totalAnswered: 1,
      totalCorrect: 0,
      streakCounter: 0,
      currentLevel: 1,
      status: LearningTopicStatus.ACTIVE,
    });
    expect(harness.item.resolvedAt).toBeNull();
    expect(harness.session).toMatchObject({
      currentSequence: 1,
      status: LearningSessionStatus.ACTIVE,
    });
    expect(harness.statesRepository.save).toHaveBeenCalledWith(harness.state);
    expect(harness.itemsRepository.save).toHaveBeenCalledWith(harness.item);
    expect(harness.sessionsRepository.save).toHaveBeenCalledWith(
      harness.session,
    );
    expect(harness.increment).not.toHaveBeenCalled();
  });

  it('persists the answer, advances item progress, and awards XP after a correct answer', async () => {
    const harness = createMutationHarness({ selectedOption: 'A' });

    const result = await harness.service.applyAnswer(
      harness.manager,
      'user-id',
      'session-id',
      'item-id',
      { selectedOption: 'A' },
    );

    expect(result.kind).toBe('CORRECT');
    expect(harness.createdAnswer).toMatchObject({
      attemptNumber: 1,
      selectedOption: 'A',
      isCorrect: true,
    });
    expect(harness.state).toMatchObject({
      totalAnswered: 1,
      totalCorrect: 1,
      streakCounter: 3,
      currentLevel: 1,
    });
    expect(harness.item.resolvedAt).toBeInstanceOf(Date);
    expect(harness.session).toMatchObject({
      currentSequence: 2,
      status: LearningSessionStatus.ACTIVE,
    });
    expect(harness.increment).toHaveBeenCalledWith(
      User,
      { id: 'user-id' },
      'xp',
      10,
    );
    expect(harness.levelSyncQuery.update).toHaveBeenCalledWith(User);
    expect(harness.levelSyncQuery.where).toHaveBeenCalledWith('id = :userId', {
      userId: 'user-id',
    });
  });
});
