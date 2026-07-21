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
  FlashcardStatus,
  LearningQuestionSource,
} from './adaptive.types';
import { TutorService } from './tutor.service';
import { Question } from '../question.entity';
import { Topic } from '../topics/topic.entity';

describe('AdaptiveService flashcard reviews', () => {
  const card: Flashcard = {
    id: 'card-id',
    subject: 'Physics',
    chapter: 'Electrostatics',
    topic: "Coulomb's Law and Charge",
    front: 'State Coulomb’s law.',
    back: 'F = k|q₁q₂|/r².',
    hint: 'Use separation squared.',
    tags: ['formula'],
    source: 'CURATED',
    status: FlashcardStatus.PUBLISHED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createService(review: FlashcardReview | null): {
    service: AdaptiveService;
    save: jest.Mock;
  } {
    const save = jest.fn(async (value: FlashcardReview) => ({
      id: 'review-id',
      ...value,
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
      {} as Repository<LearningTopicState>,
      {} as Repository<LearningSession>,
      flashcards,
      reviews,
      {} as Repository<Question>,
      {} as Repository<Topic>,
    );
    return { service, save };
  }

  it('creates a short first interval for a good first review', async () => {
    const { service, save } = createService(null);
    const result = await service.reviewFlashcard('user-id', 'card-id', {
      rating: FlashcardRating.GOOD,
    });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ repetitions: 1, intervalDays: 1 }),
    );
    expect(result.review).toMatchObject({ repetitions: 1, intervalDays: 1 });
  });

  it('resets a difficult card to a ten-minute retry window', async () => {
    const existing = {
      id: 'review-id',
      userId: 'user-id',
      flashcardId: 'card-id',
      lastRating: FlashcardRating.GOOD,
      repetitions: 4,
      intervalDays: 8,
      dueAt: new Date(),
      lastReviewedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as FlashcardReview;
    const { service, save } = createService(existing);
    await service.reviewFlashcard('user-id', 'card-id', {
      rating: FlashcardRating.AGAIN,
    });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        repetitions: 0,
        intervalDays: 0,
        lastRating: FlashcardRating.AGAIN,
      }),
    );
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
    const tutor = {
      createAnswerExplanation,
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

    expect(createAnswerExplanation).toHaveBeenCalledWith(
      'user-id',
      expect.objectContaining({ id: 'session-id' }),
      'item-id',
      question,
      'B',
    );
  });
});
