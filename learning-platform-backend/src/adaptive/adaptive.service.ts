import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Question, QuestionPublicationStatus } from '../question.entity';
import { Topic } from '../topics/topic.entity';
import { User } from '../users/user.entity';
import { AgentService } from '../agent/agent.service';
import {
  AskTutorDto,
  CreateLearningSessionDto,
  FlashcardQueryDto,
  GenerateFlashcardsDto,
  ReviewFlashcardDto,
  SubmitLearningAnswerDto,
} from './adaptive.dto';
import {
  AdaptiveContentService,
  LearningQuestionReference,
  LearningScope,
} from './adaptive-content.service';
import {
  FlashcardRating,
  FlashcardStatus,
  GeneratedLearningQuestionStatus,
  LearningQuestionSource,
  LearningSessionStatus,
  LearningSessionTransition,
  LearningTopicStatus,
  LEARNING_LEVEL_COUNT,
  LEARNING_QUESTIONS_PER_SESSION,
  coordinateForLevel,
  nextCoordinate,
} from './adaptive.types';
import { Flashcard } from './flashcard.entity';
import { FlashcardReview } from './flashcard-review.entity';
import { GeneratedLearningQuestion } from './generated-learning-question.entity';
import { GenerationWorkerService } from './generation-worker.service';
import { LearningAnswer } from './learning-answer.entity';
import { LearningSessionItem } from './learning-session-item.entity';
import { LearningSession } from './learning-session.entity';
import { LearningTopicState } from './learning-topic-state.entity';
import { TutorService } from './tutor.service';
import {
  resolveCoordinateCompletion,
  resolveSecondFailure,
} from './mastery-routing';
import {
  describeLearningStage,
  describeSavedPlacement,
  inferInitialPlacement,
  type PlacementSummary,
} from './placement-engine';

type PublicState = {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  currentLevel: number;
  currentCoordinate: ReturnType<typeof coordinateForLevel>;
  status: LearningTopicStatus;
  totalAnswered: number;
  totalCorrect: number;
  masteryPercent: number;
  lastActivityAt: Date;
  masteredAt: Date | null;
  stageLabel: string;
  nextFocus: string;
};

type PublicSessionPayload = {
  state: PublicState;
  placement: PlacementSummary;
  session: {
    id: string;
    status: LearningSessionStatus;
    transition: LearningSessionTransition;
    level: number;
    coordinate: ReturnType<typeof coordinateForLevel>;
    totalQuestions: number;
    currentSequence: number;
    startedAt: Date;
    completedAt: Date | null;
  };
  currentItem: {
    id: string;
    sequence: number;
    questionText: string;
    options: string[];
    bloomLevel: string;
    difficulty: string;
    attemptCount: number;
    requiresRetry: boolean;
  } | null;
  progress: Array<{
    id: string;
    sequence: number;
    status: 'CURRENT' | 'PENDING' | 'RESOLVED';
    attemptCount: number;
  }>;
};

type AnswerMutation = {
  kind:
    | 'CORRECT'
    | 'SOCRATIC_HINT'
    | 'DEMOTED'
    | 'ROUTED'
    | 'ADVANCED'
    | 'MASTERED'
    | 'REINFORCE';
  sessionId: string;
  session: LearningSession;
  question: LearningQuestionReference;
  selectedOption: string;
  sessionItemId: string;
  shouldExplainSecondFailure: boolean;
  prefetchScope: LearningScope | null;
  prefetchLevel: number | null;
  route: LearningScope | null;
};

@Injectable()
export class AdaptiveService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly contentService: AdaptiveContentService,
    private readonly generationWorker: GenerationWorkerService,
    private readonly tutorService: TutorService,
    private readonly agentService: AgentService,
    @InjectRepository(LearningTopicState)
    private readonly statesRepository: Repository<LearningTopicState>,
    @InjectRepository(LearningSession)
    private readonly sessionsRepository: Repository<LearningSession>,
    @InjectRepository(Flashcard)
    private readonly flashcardsRepository: Repository<Flashcard>,
    @InjectRepository(FlashcardReview)
    private readonly flashcardReviewsRepository: Repository<FlashcardReview>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
  ) {}

  /**
   * Interactive concept breakdown for a topic. Prefers explicit `subtopic`
   * tags; falls back to `concept_tags` so most topics still surface an
   * explorable structure. Returns an empty set when nothing is available.
   */
  async getConceptBreakdown(scope: LearningScope): Promise<{
    source: 'subtopic' | 'concept' | 'none';
    items: Array<{
      name: string;
      questionCount: number;
      easy: number;
      medium: number;
      hard: number;
    }>;
  }> {
    type Row = {
      name: string;
      n: string;
      easy: string;
      medium: string;
      hard: string;
    };
    const params = [scope.subject, scope.chapter, scope.topic];
    const difficultySums = `
      COUNT(*)::int AS n,
      SUM(CASE WHEN q.difficulty = 'Easy' THEN 1 ELSE 0 END)::int AS easy,
      SUM(CASE WHEN q.difficulty = 'Medium' THEN 1 ELSE 0 END)::int AS medium,
      SUM(CASE WHEN q.difficulty = 'Hard' THEN 1 ELSE 0 END)::int AS hard`;

    const map = (rows: Row[]) =>
      rows.map((row) => ({
        name: row.name,
        questionCount: Number(row.n),
        easy: Number(row.easy),
        medium: Number(row.medium),
        hard: Number(row.hard),
      }));

    const subtopicRows = (await this.dataSource.query(
      `SELECT q.subtopic AS name, ${difficultySums}
       FROM questions q
       WHERE q.status = 'PUBLISHED' AND q.subject = $1 AND q.chapter = $2 AND q.topic = $3
         AND q.subtopic IS NOT NULL AND q.subtopic <> ''
       GROUP BY q.subtopic
       ORDER BY n DESC`,
      params,
    )) as unknown as Row[];
    if (subtopicRows.length > 0) {
      return { source: 'subtopic', items: map(subtopicRows) };
    }

    const conceptRows = (await this.dataSource.query(
      `SELECT tag AS name, ${difficultySums}
       FROM questions q, jsonb_array_elements_text(q.concept_tags) AS tag
       WHERE q.status = 'PUBLISHED' AND q.subject = $1 AND q.chapter = $2 AND q.topic = $3
       GROUP BY tag
       ORDER BY n DESC
       LIMIT 12`,
      params,
    )) as unknown as Row[];
    if (conceptRows.length > 0) {
      return { source: 'concept', items: map(conceptRows) };
    }

    return { source: 'none', items: [] };
  }

  async getQuestionCoverage(input: CreateLearningSessionDto) {
    return this.contentService.getCoverage(this.toScope(input));
  }

  async getPlacement(userId: string, input: CreateLearningSessionDto) {
    const scope = this.toScope(input);
    const state = await this.statesRepository.findOne({
      where: { userId, ...scope },
      select: { id: true, currentLevel: true },
    });
    return {
      needsDecision: !state,
      currentLevel: state?.currentLevel ?? null,
    };
  }

  async createOrResume(
    user: AuthenticatedUser,
    input: CreateLearningSessionDto,
  ): Promise<PublicSessionPayload> {
    const scope = this.toScope(input);
    const { state } = await this.getOrCreateState(user.id, scope);
    if (state.status === LearningTopicStatus.PAUSED_FOR_PREREQUISITE) {
      throw new ConflictException(
        'This topic is paused while its prerequisite is reinforced. Choose the suggested prerequisite to continue.',
      );
    }

    const existing = await this.sessionsRepository.findOne({
      where: { stateId: state.id, status: LearningSessionStatus.ACTIVE },
      order: { startedAt: 'DESC' },
    });
    if (existing) return this.getSession(user.id, existing.id);

    if (state.status === LearningTopicStatus.MASTERED) {
      throw new ConflictException(
        'This topic is already mastered. Use flashcards or a reviewed practice set to strengthen it further.',
      );
    }

    let coordinate = coordinateForLevel(state.currentLevel);
    let questions = await this.contentService.selectQuestionSet(
      user.id,
      scope,
      coordinate,
    );
    if (questions.length < LEARNING_QUESTIONS_PER_SESSION) {
      const readyFallback = await this.findNearestReadyQuestionSet(
        user.id,
        scope,
        coordinate.level,
      );
      if (readyFallback) {
        coordinate = coordinateForLevel(readyFallback.level);
        questions = readyFallback.questions;
        state.currentLevel = readyFallback.level;
        state.streakCounter = 0;
        state.status = LearningTopicStatus.ACTIVE;
        state.lastActivityAt = new Date();
        await this.statesRepository.save(state);
      }
    }
    if (questions.length < LEARNING_QUESTIONS_PER_SESSION) {
      questions = await this.contentService.selectCalibrationQuestionSet(
        user.id,
        scope,
      );
      if (questions.length >= LEARNING_QUESTIONS_PER_SESSION) {
        coordinate = coordinateForLevel(1);
        state.currentLevel = 1;
        state.streakCounter = 0;
        state.status = LearningTopicStatus.ACTIVE;
        state.lastActivityAt = new Date();
        await this.statesRepository.save(state);
      }
    }
    if (questions.length < LEARNING_QUESTIONS_PER_SESSION) {
      const availability = await this.contentService.ensurePool(
        user.id,
        scope,
        coordinate,
      );
      if (availability.job) {
        // First entry may require one on-demand batch. Subsequent coordinates
        // are prefetched on promotion and run through the durable queue.
        await this.generationWorker.processNow(availability.job.id);
        questions = await this.contentService.selectQuestionSet(
          user.id,
          scope,
          coordinate,
        );
      }
    }
    if (questions.length < LEARNING_QUESTIONS_PER_SESSION) {
      throw new ServiceUnavailableException(
        'This topic needs one ready five-question set before adaptive practice can begin. Add or generate reviewed questions for this topic.',
      );
    }

    const sessionId = await this.createSession(
      state,
      scope,
      coordinate.level,
      questions,
    );
    void this.prefetchPracticeContinuity(
      user.id,
      scope,
      coordinate.level,
    ).catch(() => undefined);
    return this.getSession(user.id, sessionId);
  }

  async getSession(
    userId: string,
    sessionId: string,
  ): Promise<PublicSessionPayload> {
    const session = await this.getOwnedSession(userId, sessionId, true);
    return this.toSessionPayload(session);
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    sessionItemId: string,
    input: SubmitLearningAnswerDto,
  ) {
    const mutation = await this.dataSource.transaction((manager) =>
      this.applyAnswer(manager, userId, sessionId, sessionItemId, input),
    );

    const tutorPending =
      mutation.kind === 'SOCRATIC_HINT' || mutation.shouldExplainSecondFailure;
    if (mutation.kind === 'SOCRATIC_HINT') {
      void this.tutorService.createSocraticHint(
        userId,
        mutation.session,
        mutation.sessionItemId,
        mutation.question,
        mutation.selectedOption,
      ).catch(() => undefined);
    }
    if (mutation.shouldExplainSecondFailure) {
      void this.tutorService.createAnswerExplanation(
        userId,
        mutation.session,
        mutation.sessionItemId,
        mutation.question,
        mutation.selectedOption,
      ).catch(() => undefined);
    }
    if (mutation.prefetchScope && mutation.prefetchLevel) {
      void this.prefetchPracticeContinuity(
        userId,
        mutation.prefetchScope,
        mutation.prefetchLevel,
      ).catch(() => undefined);
    }

    return {
      ...(await this.getSession(userId, sessionId)),
      feedback: {
        kind: mutation.kind,
        assistantMessage: null,
        tutorPending,
        route: mutation.route,
      },
    };
  }

  async getTutorConversation(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId, false);
    return this.tutorService.getConversationMessages(userId, session);
  }

  async askTutor(userId: string, sessionId: string, input: AskTutorDto) {
    const session = await this.getOwnedSession(userId, sessionId, true);
    const currentItem =
      session.items
        .slice()
        .sort((left, right) => left.sequence - right.sequence)
        .find((item) => item.sequence === session.currentSequence) ?? null;
    const question = currentItem
      ? this.contentService.toQuestionReference(currentItem)
      : null;
    const answerRevealed = Boolean(
      currentItem?.resolvedAt && (currentItem.answers?.length ?? 0) > 0,
    );
    const message = await this.tutorService.answerLearnerMessage(
      userId,
      session,
      currentItem?.id ?? null,
      question,
      answerRevealed,
      input.message,
    );
    return { message };
  }

  async getDashboard(userId: string) {
    const states = await this.statesRepository.find({
      where: { userId },
      order: { lastActivityAt: 'DESC' },
      take: 30,
    });
    const recentSessions = await this.sessionsRepository.find({
      where: {
        userId,
        status: In([
          LearningSessionStatus.COMPLETED,
          LearningSessionStatus.ROUTED,
        ]),
      },
      order: { completedAt: 'DESC' },
      take: 12,
    });
    return {
      activeTopics: states
        .filter((state) => state.status === LearningTopicStatus.ACTIVE)
        .slice(0, 4)
        .map((state) => this.toPublicState(state)),
      completedTopics: states
        .filter((state) => state.status === LearningTopicStatus.MASTERED)
        .map((state) => this.toPublicState(state)),
      history: recentSessions.map((session) => ({
        id: session.id,
        subject: session.subject,
        chapter: session.chapter,
        topic: session.topic,
        level: session.level,
        coordinate: coordinateForLevel(session.level),
        transition: session.transition,
        completedAt: session.completedAt,
      })),
      suggestions: await this.getSuggestedTopics(states),
    };
  }

  getFlashcards(userId: string, input: FlashcardQueryDto) {
    void userId;
    void input;
    return [];
  }

  async reviewFlashcard(
    userId: string,
    flashcardId: string,
    input: ReviewFlashcardDto,
  ) {
    const card = await this.flashcardsRepository.findOne({
      where: { id: flashcardId, status: FlashcardStatus.PUBLISHED },
    });
    if (!card) throw new NotFoundException('Flashcard not found.');
    const now = new Date();
    let review = await this.flashcardReviewsRepository.findOne({
      where: { userId, flashcardId },
    });
    const next = this.nextReviewSchedule(review, input.rating, now);
    if (!review) {
      review = this.flashcardReviewsRepository.create({
        userId,
        flashcardId,
        ...next,
      });
    } else {
      Object.assign(review, next);
    }
    const saved = await this.flashcardReviewsRepository.save(review);
    return this.toFlashcardPayload(card, saved);
  }

  async generateFlashcards(userId: string, input: GenerateFlashcardsDto) {
    void userId;
    const scope = this.toScope(input);
    const count = input.count ?? 6;
    const sourceMaterial = await this.buildFlashcardSourceMaterial(scope);
    const generated = await this.agentService.generateFlashcards({
      ...scope,
      count,
      sourceMaterial,
      excludedPrompts: input.excludedPrompts ?? [],
    });
    return generated.map((card, index) => ({
      id: `live-${Date.now()}-${index}`,
      ...scope,
      front: card.front,
      back: card.back,
      hint: card.hint,
      tags: card.tags,
      review: null,
    }));
  }

  private async applyAnswer(
    manager: EntityManager,
    userId: string,
    sessionId: string,
    sessionItemId: string,
    input: SubmitLearningAnswerDto,
  ): Promise<AnswerMutation> {
    const sessions = manager.getRepository(LearningSession);
    const states = manager.getRepository(LearningTopicState);
    const items = manager.getRepository(LearningSessionItem);
    const answers = manager.getRepository(LearningAnswer);
    const session = await sessions
      .createQueryBuilder('session')
      .setLock('pessimistic_write')
      .where('session.id = :sessionId', { sessionId })
      .andWhere('session.user_id = :userId', { userId })
      .getOne();
    if (!session) throw new NotFoundException('Learning session not found.');
    if (session.status !== LearningSessionStatus.ACTIVE) {
      throw new ConflictException('This learning session has already ended.');
    }
    const state = await states
      .createQueryBuilder('state')
      .setLock('pessimistic_write')
      .where('state.id = :stateId', { stateId: session.stateId })
      .getOne();
    if (!state) throw new NotFoundException('Learning state not found.');
    const lockedItem = await items
      .createQueryBuilder('item')
      .setLock('pessimistic_write')
      .where('item.id = :sessionItemId', { sessionItemId })
      .andWhere('item.session_id = :sessionId', { sessionId })
      .getOne();
    if (!lockedItem)
      throw new NotFoundException('Learning question not found.');
    // PostgreSQL cannot lock nullable outer-join targets. Lock the session item
    // first, then load its optional curated/generated reference within the same
    // transaction while that item row remains locked.
    const item = await items.findOne({
      where: { id: lockedItem.id },
      relations: { question: true, generatedQuestion: true },
    });
    if (!item) throw new NotFoundException('Learning question not found.');
    if (item.sequence !== session.currentSequence) {
      throw new ConflictException(
        'Answer the current question before moving ahead.',
      );
    }
    if (item.resolvedAt) {
      throw new ConflictException(
        'This learning question has already been resolved.',
      );
    }
    const question = this.contentService.toQuestionReference(item);
    if (!question.options.includes(input.selectedOption)) {
      throw new BadRequestException(
        'Selected option is not valid for this question.',
      );
    }
    const priorAnswers = await answers.find({
      where: { sessionItemId: item.id },
      order: { attemptNumber: 'ASC' },
    });
    if (priorAnswers.length >= 2) {
      throw new ConflictException(
        'Both allowed attempts have already been used.',
      );
    }

    const isCorrect = input.selectedOption === question.correctAnswer;
    const answer = answers.create({
      sessionItemId: item.id,
      attemptNumber: priorAnswers.length + 1,
      selectedOption: input.selectedOption,
      isCorrect,
      elapsedSeconds: input.elapsedSeconds ?? null,
    });
    await answers.save(answer);
    state.totalAnswered += 1;
    state.lastActivityAt = new Date();
    let kind: AnswerMutation['kind'];
    let prefetchLevel: number | null = null;
    let route: LearningScope | null = null;
    let shouldExplainSecondFailure = false;

    if (isCorrect) {
      state.totalCorrect += 1;
      state.streakCounter += 1;
      item.resolvedAt = new Date();
      session.currentSequence += 1;
      if (session.currentSequence > session.totalQuestions) {
        const completion = resolveCoordinateCompletion(
          state.currentLevel,
          state.streakCounter,
        );
        state.streakCounter = 0;
        session.status = LearningSessionStatus.COMPLETED;
        session.completedAt = new Date();
        session.transition = completion.transition;
        if (completion.transition === LearningSessionTransition.ADVANCED) {
          state.currentLevel = completion.nextLevel!;
          state.status = LearningTopicStatus.ACTIVE;
          kind = 'ADVANCED';
          prefetchLevel = completion.nextLevel;
        } else if (
          completion.transition === LearningSessionTransition.MASTERED
        ) {
          state.status = LearningTopicStatus.MASTERED;
          state.masteredAt = new Date();
          kind = 'MASTERED';
        } else {
          kind = 'REINFORCE';
          prefetchLevel = completion.nextLevel;
        }
      } else {
        kind = 'CORRECT';
      }
    } else if (priorAnswers.length === 0) {
      // A first miss resets the strict streak but deliberately keeps the answer
      // hidden. The tutor receives no key for this Socratic intervention.
      state.streakCounter = 0;
      kind = 'SOCRATIC_HINT';
    } else {
      shouldExplainSecondFailure = true;
      item.resolvedAt = new Date();
      state.streakCounter = 0;
      session.status = LearningSessionStatus.COMPLETED;
      session.completedAt = new Date();
      const prerequisiteScope =
        state.currentLevel === 1
          ? await this.findPrerequisiteScope(manager, {
              subject: session.subject,
              chapter: session.chapter,
              topic: session.topic,
            })
          : null;
      const failure = resolveSecondFailure(
        state.currentLevel,
        Boolean(prerequisiteScope),
      );
      session.transition = failure.transition;
      if (failure.transition === LearningSessionTransition.DEMOTED) {
        state.currentLevel = failure.nextLevel!;
        state.status = LearningTopicStatus.ACTIVE;
        kind = 'DEMOTED';
        prefetchLevel = failure.nextLevel;
      } else if (
        failure.transition === LearningSessionTransition.PREREQUISITE
      ) {
        route = prerequisiteScope;
        state.status = LearningTopicStatus.PAUSED_FOR_PREREQUISITE;
        session.status = LearningSessionStatus.ROUTED;
        kind = 'ROUTED';
      } else {
        state.status = LearningTopicStatus.ACTIVE;
        kind = 'REINFORCE';
        prefetchLevel = failure.nextLevel;
      }
    }

    await items.save(item);
    await states.save(state);
    await sessions.save(session);
    if (isCorrect) {
      await manager.increment(User, { id: userId }, 'xp', 10);
    }
    return {
      kind,
      sessionId,
      session,
      question,
      selectedOption: input.selectedOption,
      sessionItemId: item.id,
      shouldExplainSecondFailure,
      prefetchScope: {
        subject: session.subject,
        chapter: session.chapter,
        topic: session.topic,
      },
      prefetchLevel,
      route,
    };
  }

  private async getOrCreateState(
    userId: string,
    scope: LearningScope,
  ): Promise<{ state: LearningTopicState; placement: PlacementSummary }> {
    const existing = await this.statesRepository.findOne({
      where: { userId, ...scope },
    });
    if (existing) {
      return {
        state: existing,
        placement: describeSavedPlacement(existing.currentLevel, scope.topic),
      };
    }
    const placement = inferInitialPlacement(scope.topic, {
      sameChapterAnswered: 0,
      sameChapterCorrect: 0,
      sameChapterMastered: 0,
      sameSubjectAnswered: 0,
      sameSubjectCorrect: 0,
      sameSubjectMastered: 0,
      masteredPrerequisites: 0,
      averagePeerLevel: 0,
    });
    try {
      const state = await this.statesRepository.save(
        this.statesRepository.create({
          userId,
          ...scope,
          currentLevel: placement.level,
          status: LearningTopicStatus.ACTIVE,
          streakCounter: 0,
          totalAnswered: 0,
          totalCorrect: 0,
          lastActivityAt: new Date(),
          masteredAt: null,
        }),
      );
      return { state, placement };
    } catch {
      const raced = await this.statesRepository.findOne({
        where: { userId, ...scope },
      });
      if (raced) {
        return {
          state: raced,
          placement: describeSavedPlacement(raced.currentLevel, scope.topic),
        };
      }
      throw new ServiceUnavailableException(
        'Unable to initialize learning state.',
      );
    }
  }

  private async createSession(
    state: LearningTopicState,
    scope: LearningScope,
    level: number,
    questions: LearningQuestionReference[],
  ): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const coordinate = coordinateForLevel(level);
      const sessions = manager.getRepository(LearningSession);
      const items = manager.getRepository(LearningSessionItem);
      const session = await sessions.save(
        sessions.create({
          stateId: state.id,
          userId: state.userId,
          ...scope,
          level,
          bloomLevel: coordinate.bloomLevel,
          difficulty: coordinate.difficulty,
          status: LearningSessionStatus.ACTIVE,
          transition: LearningSessionTransition.NONE,
          totalQuestions: questions.length,
          currentSequence: 1,
          completedAt: null,
        }),
      );
      const records = questions.map((question, index) =>
        items.create({
          sessionId: session.id,
          sequence: index + 1,
          source: question.source,
          questionId:
            question.source === LearningQuestionSource.CURATED
              ? question.id
              : null,
          generatedQuestionId:
            question.source === LearningQuestionSource.AI_POOL
              ? question.id
              : null,
          resolvedAt: null,
        }),
      );
      await items.save(records);
      const generatedIds = questions
        .filter(
          (question) => question.source === LearningQuestionSource.AI_POOL,
        )
        .map((question) => question.id);
      if (generatedIds.length) {
        await manager
          .getRepository(GeneratedLearningQuestion)
          .update(
            { id: In(generatedIds) },
            { status: GeneratedLearningQuestionStatus.RESERVED },
          );
      }
      return session.id;
    });
  }

  private async getOwnedSession(
    userId: string,
    sessionId: string,
    withItems: boolean,
  ): Promise<LearningSession> {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId, userId },
      relations: withItems
        ? {
            state: true,
            items: {
              question: true,
              generatedQuestion: true,
              answers: true,
            },
          }
        : { state: true },
    });
    if (!session) throw new NotFoundException('Learning session not found.');
    return session;
  }

  private toSessionPayload(session: LearningSession): PublicSessionPayload {
    if (!session.state || !session.items) {
      throw new ServiceUnavailableException(
        'Learning session data is incomplete.',
      );
    }
    const items = session.items
      .slice()
      .sort((left, right) => left.sequence - right.sequence);
    const current =
      session.status === LearningSessionStatus.ACTIVE
        ? (items.find((item) => item.sequence === session.currentSequence) ??
          null)
        : null;
    const currentQuestion = current
      ? this.contentService.toQuestionReference(current)
      : null;
    return {
      state: this.toPublicState(session.state),
      placement: describeSavedPlacement(
        session.state.currentLevel,
        session.topic,
      ),
      session: {
        id: session.id,
        status: session.status,
        transition: session.transition,
        level: session.level,
        coordinate: coordinateForLevel(session.level),
        totalQuestions: session.totalQuestions,
        currentSequence: Math.min(
          session.currentSequence,
          session.totalQuestions,
        ),
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      },
      currentItem:
        current && currentQuestion
          ? {
              id: current.id,
              sequence: current.sequence,
              questionText: currentQuestion.questionText,
              options: currentQuestion.options,
              bloomLevel: currentQuestion.bloomLevel,
              difficulty: currentQuestion.difficulty,
              attemptCount: current.answers?.length ?? 0,
              requiresRetry:
                (current.answers?.length ?? 0) === 1 &&
                current.answers?.[0]?.isCorrect === false,
            }
          : null,
      progress: items.map((item) => ({
        id: item.id,
        sequence: item.sequence,
        status: item.resolvedAt
          ? 'RESOLVED'
          : current?.id === item.id
            ? 'CURRENT'
            : 'PENDING',
        attemptCount: item.answers?.length ?? 0,
      })),
    };
  }

  private toPublicState(state: LearningTopicState): PublicState {
    const stage = describeLearningStage(state.currentLevel);
    const progress =
      state.status === LearningTopicStatus.MASTERED
        ? 100
        : Math.round(((state.currentLevel - 1) / LEARNING_LEVEL_COUNT) * 100);
    return {
      id: state.id,
      subject: state.subject,
      chapter: state.chapter,
      topic: state.topic,
      currentLevel: state.currentLevel,
      currentCoordinate: coordinateForLevel(state.currentLevel),
      status: state.status,
      totalAnswered: state.totalAnswered,
      totalCorrect: state.totalCorrect,
      masteryPercent: progress,
      lastActivityAt: state.lastActivityAt,
      masteredAt: state.masteredAt,
      stageLabel: stage.stageLabel,
      nextFocus: stage.nextFocus,
    };
  }

  private async estimateInitialPlacement(
    userId: string,
    scope: LearningScope,
  ): Promise<PlacementSummary> {
    const sameSubject = await this.statesRepository.find({
      where: { userId, subject: scope.subject },
      order: { lastActivityAt: 'DESC' },
      take: 20,
    });
    const sameChapter = sameSubject.filter(
      (state) => state.chapter === scope.chapter && state.topic !== scope.topic,
    );
    const peerStates = sameSubject.filter(
      (state) => state.topic !== scope.topic,
    );
    const targetTopic = await this.topicsRepository.findOne({
      where: { name: scope.topic },
      relations: { prerequisites: true },
    });
    const prerequisiteNames =
      targetTopic?.prerequisites?.map((topic) => topic.name) ?? [];
    const masteredPrerequisites = prerequisiteNames.length
      ? await this.statesRepository.count({
          where: {
            userId,
            topic: In(prerequisiteNames),
            status: LearningTopicStatus.MASTERED,
          },
        })
      : 0;

    return inferInitialPlacement(scope.topic, {
      sameChapterAnswered: sameChapter.reduce(
        (sum, state) => sum + state.totalAnswered,
        0,
      ),
      sameChapterCorrect: sameChapter.reduce(
        (sum, state) => sum + state.totalCorrect,
        0,
      ),
      sameChapterMastered: sameChapter.filter(
        (state) => state.status === LearningTopicStatus.MASTERED,
      ).length,
      sameSubjectAnswered: peerStates.reduce(
        (sum, state) => sum + state.totalAnswered,
        0,
      ),
      sameSubjectCorrect: peerStates.reduce(
        (sum, state) => sum + state.totalCorrect,
        0,
      ),
      sameSubjectMastered: peerStates.filter(
        (state) => state.status === LearningTopicStatus.MASTERED,
      ).length,
      masteredPrerequisites,
      averagePeerLevel:
        peerStates.length > 0
          ? peerStates.reduce((sum, state) => sum + state.currentLevel, 0) /
            peerStates.length
          : 0,
    });
  }

  private async findPrerequisiteScope(
    manager: EntityManager,
    scope: LearningScope,
  ): Promise<LearningScope | null> {
    const topic = await manager.getRepository(Topic).findOne({
      where: { name: scope.topic },
      relations: { prerequisites: true },
    });
    const prerequisite = topic?.prerequisites?.[0];
    if (!prerequisite) return null;
    const sampleQuestion = await manager.getRepository(Question).findOne({
      where: {
        topic: prerequisite.name,
        status: QuestionPublicationStatus.PUBLISHED,
      },
      order: { created_at: 'ASC' },
    });
    if (!sampleQuestion) return null;
    return {
      subject: sampleQuestion.subject,
      chapter: sampleQuestion.chapter,
      topic: sampleQuestion.topic,
    };
  }

  private async prefetchNextCoordinate(
    userId: string,
    scope: LearningScope,
    level: number,
  ): Promise<void> {
    const following = nextCoordinate(level);
    if (!following) return;
    await this.prefetchCoordinate(userId, scope, following.level);
  }

  private async prefetchPracticeContinuity(
    userId: string,
    scope: LearningScope,
    level: number,
  ): Promise<void> {
    await this.prefetchCoordinate(userId, scope, level);
    await this.prefetchNextCoordinate(userId, scope, level);
  }

  private async findNearestReadyQuestionSet(
    userId: string,
    scope: LearningScope,
    preferredLevel: number,
  ): Promise<{ level: number; questions: LearningQuestionReference[] } | null> {
    const candidates = [
      ...Array.from(
        { length: preferredLevel - 1 },
        (_, index) => preferredLevel - index - 1,
      ),
      ...Array.from(
        { length: LEARNING_LEVEL_COUNT - preferredLevel },
        (_, index) => preferredLevel + index + 1,
      ),
    ];

    for (const level of candidates) {
      const questions = await this.contentService.selectQuestionSet(
        userId,
        scope,
        coordinateForLevel(level),
      );
      if (questions.length >= LEARNING_QUESTIONS_PER_SESSION) {
        return { level, questions };
      }
    }
    return null;
  }

  private async prefetchCoordinate(
    userId: string,
    scope: LearningScope,
    level: number,
  ): Promise<void> {
    const coordinate = coordinateForLevel(level);
    const pool = await this.contentService.ensurePool(
      userId,
      scope,
      coordinate,
    );
    if (pool.job) await this.generationWorker.processNow(pool.job.id);
  }

  private async getSuggestedTopics(states: LearningTopicState[]) {
    const completed = states.filter(
      (state) => state.status === LearningTopicStatus.MASTERED,
    );
    const activity = completed.length ? completed : states.slice(0, 3);
    if (activity.length === 0) return [];
    const completedTopics = completed.map((state) => state.topic);
    const chapters = [...new Set(activity.map((state) => state.chapter))];
    const rows = await this.questionsRepository
      .createQueryBuilder('question')
      .select('question.subject', 'subject')
      .addSelect('question.chapter', 'chapter')
      .addSelect('question.topic', 'topic')
      .addSelect('COUNT(question.id)', 'questionCount')
      .where('question.status = :status', {
        status: QuestionPublicationStatus.PUBLISHED,
      })
      .andWhere('question.chapter IN (:...chapters)', { chapters })
      .groupBy('question.subject')
      .addGroupBy('question.chapter')
      .addGroupBy('question.topic')
      .orderBy('COUNT(question.id)', 'DESC')
      .addOrderBy('question.topic', 'ASC')
      .limit(18)
      .getRawMany<{
        subject: string;
        chapter: string;
        topic: string;
        questionCount: string;
      }>();
    const graphTopics = completedTopics.length
      ? await this.topicsRepository.find({ relations: { prerequisites: true } })
      : [];
    const directlyUnlocked = new Set(
      graphTopics
        .filter((topic) =>
          topic.prerequisites?.some((prerequisite) =>
            completedTopics.includes(prerequisite.name),
          ),
        )
        .map((topic) => topic.name),
    );
    return rows
      .filter((row) => !completedTopics.includes(row.topic))
      .map((row) => ({
        subject: row.subject,
        chapter: row.chapter,
        topic: row.topic,
        questionCount: Number(row.questionCount),
        reason: directlyUnlocked.has(row.topic)
          ? 'Unlocked by a completed prerequisite'
          : `Related to your ${row.chapter} learning activity`,
      }))
      .slice(0, 3);
  }

  private async buildFlashcardSourceMaterial(
    scope: LearningScope,
  ): Promise<string> {
    const questions = await this.questionsRepository.find({
      where: {
        subject: scope.subject,
        chapter: scope.chapter,
        topic: scope.topic,
        status: QuestionPublicationStatus.PUBLISHED,
      },
      order: { created_at: 'ASC' },
      take: 12,
    });
    const blocks = [
      ...questions.map(
        (question) =>
          `Question concept: ${question.question_text}\nCorrect reasoning: ${question.solution}\nTags: ${(question.concept_tags ?? []).join(', ')}`,
      ),
    ];
    if (blocks.length === 0) {
      throw new ServiceUnavailableException(
        'This topic has no reviewed database material for grounded flashcard generation.',
      );
    }
    return blocks.join('\n\n');
  }

  private nextReviewSchedule(
    current: FlashcardReview | null,
    rating: FlashcardRating,
    now: Date,
  ) {
    const repetitions = current?.repetitions ?? 0;
    const interval = current?.intervalDays ?? 0;
    let nextRepetitions = repetitions;
    let intervalDays = interval;
    let dueAt: Date;
    switch (rating) {
      case FlashcardRating.AGAIN:
        nextRepetitions = 0;
        intervalDays = 0;
        dueAt = new Date(now.getTime() + 10 * 60 * 1000);
        break;
      case FlashcardRating.HARD:
        nextRepetitions = repetitions + 1;
        intervalDays = Math.max(1, Math.round(Math.max(interval, 1) * 1.2));
        dueAt = this.addDays(now, intervalDays);
        break;
      case FlashcardRating.GOOD:
        nextRepetitions = repetitions + 1;
        intervalDays =
          repetitions === 0
            ? 1
            : repetitions === 1
              ? 3
              : Math.max(4, interval * 2);
        dueAt = this.addDays(now, intervalDays);
        break;
      case FlashcardRating.EASY:
        nextRepetitions = repetitions + 1;
        intervalDays = repetitions === 0 ? 3 : Math.max(6, interval * 3);
        dueAt = this.addDays(now, intervalDays);
        break;
    }
    return {
      lastRating: rating,
      repetitions: nextRepetitions,
      intervalDays,
      dueAt,
      lastReviewedAt: now,
    };
  }

  private toFlashcardPayload(card: Flashcard, review: FlashcardReview | null) {
    return {
      id: card.id,
      subject: card.subject,
      chapter: card.chapter,
      topic: card.topic,
      front: card.front,
      back: card.back,
      hint: card.hint,
      tags: card.tags ?? [],
      review: review
        ? {
            lastRating: review.lastRating,
            repetitions: review.repetitions,
            intervalDays: review.intervalDays,
            dueAt: review.dueAt,
            lastReviewedAt: review.lastReviewedAt,
          }
        : null,
    };
  }

  private toScope(input: CreateLearningSessionDto): LearningScope {
    return {
      subject: input.subject.trim(),
      chapter: input.chapter.trim(),
      topic: input.topic.trim(),
    };
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
