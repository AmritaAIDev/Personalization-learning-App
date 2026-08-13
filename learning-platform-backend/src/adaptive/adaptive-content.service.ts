import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { DataSource, In, Repository } from 'typeorm';
import {
  AgentService,
  GeneratedLearningQuestionPayload,
} from '../agent/agent.service';
import { Question, QuestionPublicationStatus } from '../question.entity';
import {
  MIN_SERVABLE_QUALITY_SCORE,
  scoreQuestionQuality,
} from '../question-quality.util';
import {
  BloomLevel,
  bloomLevelAliases,
  DifficultyLevel,
  GeneratedLearningQuestionStatus,
  GenerationJobStatus,
  LearningCoordinate,
  LearningQuestionSource,
  LEARNING_LEVEL_COUNT,
  LEARNING_QUESTIONS_PER_SESSION,
  coordinateForLevel,
} from './adaptive.types';
import { Flashcard } from './flashcard.entity';
import { GeneratedLearningQuestion } from './generated-learning-question.entity';
import { GenerationJob } from './generation-job.entity';
import { LearningSessionItem } from './learning-session-item.entity';

export interface LearningScope {
  subject: string;
  chapter: string;
  topic: string;
}

export interface LearningQuestionReference {
  source: LearningQuestionSource;
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  solution: string;
  hint: string | null;
  conceptTags: string[];
  commonErrors: string[];
  bloomLevel: string;
  difficulty: string;
}

export interface PoolAvailability {
  available: number;
  job: GenerationJob | null;
  missing: number;
}

/**
 * Owns the database-backed question pool. Public curated questions and
 * private generated questions are selected only on the server and projected
 * into a single internal representation for the learning engine.
 */
@Injectable()
export class AdaptiveContentService {
  private readonly logger = new Logger(AdaptiveContentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly agentService: AgentService,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(GeneratedLearningQuestion)
    private readonly generatedQuestionsRepository: Repository<GeneratedLearningQuestion>,
    @InjectRepository(GenerationJob)
    private readonly jobsRepository: Repository<GenerationJob>,
    @InjectRepository(Flashcard)
    private readonly flashcardsRepository: Repository<Flashcard>,
  ) {}

  async selectQuestionSet(
    userId: string,
    scope: LearningScope,
    coordinate: LearningCoordinate,
    count = LEARNING_QUESTIONS_PER_SESSION,
  ): Promise<LearningQuestionReference[]> {
    const used = await this.getUsedQuestionIds(userId, scope, coordinate);
    const [generated, curated] = await Promise.all([
      this.generatedQuestionsRepository.find({
        where: {
          userId,
          subject: scope.subject,
          chapter: scope.chapter,
          topic: scope.topic,
          bloomLevel: In(bloomLevelAliases(coordinate.bloomLevel)),
          difficulty: coordinate.difficulty,
          status: GeneratedLearningQuestionStatus.READY,
        },
        order: { createdAt: 'ASC' },
      }),
      this.questionsRepository.find({
        where: {
          subject: scope.subject,
          chapter: scope.chapter,
          topic: scope.topic,
          bloom_level: In(bloomLevelAliases(coordinate.bloomLevel)),
          difficulty: coordinate.difficulty,
          status: QuestionPublicationStatus.PUBLISHED,
        },
        order: { created_at: 'ASC' },
      }),
    ]);

    const candidates: LearningQuestionReference[] = [
      ...generated.map((question) => this.toGeneratedReference(question)),
      ...curated.map((question) => this.toCuratedReference(question)),
    ].filter((question) =>
      question.source === LearningQuestionSource.CURATED
        ? !used.curated.has(question.id)
        : !used.generated.has(question.id),
    );
    if (candidates.length < count) return [];
    return this.shuffle(candidates).slice(0, count);
  }

  async selectCalibrationQuestionSet(
    userId: string,
    scope: LearningScope,
    count = LEARNING_QUESTIONS_PER_SESSION,
  ): Promise<LearningQuestionReference[]> {
    const used = await this.getUsedQuestionIds(userId, scope);
    const [generated, curated] = await Promise.all([
      this.generatedQuestionsRepository.find({
        where: {
          userId,
          subject: scope.subject,
          chapter: scope.chapter,
          topic: scope.topic,
          status: GeneratedLearningQuestionStatus.READY,
        },
        order: { createdAt: 'ASC' },
      }),
      this.questionsRepository.find({
        where: {
          subject: scope.subject,
          chapter: scope.chapter,
          topic: scope.topic,
          status: QuestionPublicationStatus.PUBLISHED,
        },
        order: { created_at: 'ASC' },
      }),
    ]);
    const exactTopicCandidates = [
      ...generated.map((question) => this.toGeneratedReference(question)),
      ...curated.map((question) => this.toCuratedReference(question)),
    ].filter((question) =>
      question.source === LearningQuestionSource.CURATED
        ? !used.curated.has(question.id)
        : !used.generated.has(question.id),
    );
    if (exactTopicCandidates.length >= count) {
      return this.shuffle(exactTopicCandidates).slice(0, count);
    }

    const chapterQuestions = await this.questionsRepository.find({
      where: {
        subject: scope.subject,
        chapter: scope.chapter,
        status: QuestionPublicationStatus.PUBLISHED,
      },
      order: { created_at: 'ASC' },
      take: Math.max(count * 4, 20),
    });
    const chapterCandidates = chapterQuestions
      .map((question) => this.toCuratedReference(question))
      .filter((question) => !used.curated.has(question.id));
    if (chapterCandidates.length < count) return [];
    return this.shuffle(chapterCandidates).slice(0, count);
  }

  async getCoverage(scope: LearningScope): Promise<{
    subject: string;
    chapter: string;
    topic: string;
    coordinates: Array<{
      level: number;
      bloomLevel: string;
      difficulty: string;
      curatedPublished: number;
      generatedReady: number;
      totalReady: number;
      readyForSession: boolean;
    }>;
  }> {
    const coordinates = await Promise.all(
      Array.from({ length: LEARNING_LEVEL_COUNT }, (_, index) => index + 1).map(
        async (level) => {
          const coordinate = coordinateForLevel(level);
          const bloomAliases = bloomLevelAliases(coordinate.bloomLevel);
          const [curatedPublished, generatedReady] = await Promise.all([
            this.questionsRepository.count({
              where: {
                subject: scope.subject,
                chapter: scope.chapter,
                topic: scope.topic,
                bloom_level: In(bloomAliases),
                difficulty: coordinate.difficulty,
                status: QuestionPublicationStatus.PUBLISHED,
              },
            }),
            this.generatedQuestionsRepository.count({
              where: {
                subject: scope.subject,
                chapter: scope.chapter,
                topic: scope.topic,
                bloomLevel: In(bloomAliases),
                difficulty: coordinate.difficulty,
                status: GeneratedLearningQuestionStatus.READY,
              },
            }),
          ]);
          const totalReady = curatedPublished + generatedReady;
          return {
            level,
            bloomLevel: coordinate.bloomLevel,
            difficulty: coordinate.difficulty,
            curatedPublished,
            generatedReady,
            totalReady,
            readyForSession: totalReady >= LEARNING_QUESTIONS_PER_SESSION,
          };
        },
      ),
    );
    return {
      ...scope,
      coordinates,
    };
  }

  /** Schedules a durable job only when the exact coordinate does not have a full cache. */
  async ensurePool(
    userId: string,
    scope: LearningScope,
    coordinate: LearningCoordinate,
    requiredCount = LEARNING_QUESTIONS_PER_SESSION,
  ): Promise<PoolAvailability> {
    const available = await this.countAvailableQuestions(
      userId,
      scope,
      coordinate,
    );
    const missing = Math.max(0, requiredCount - available);
    if (missing === 0) {
      return { available, missing, job: null };
    }

    const existing = await this.jobsRepository.findOne({
      where: {
        userId,
        subject: scope.subject,
        chapter: scope.chapter,
        topic: scope.topic,
        targetLevel: coordinate.level,
        status: In([
          GenerationJobStatus.PENDING,
          GenerationJobStatus.PROCESSING,
          GenerationJobStatus.RETRYING,
        ]),
      },
      order: { createdAt: 'DESC' },
    });
    if (existing) return { available, missing, job: existing };

    const job = this.jobsRepository.create({
      userId,
      subject: scope.subject,
      chapter: scope.chapter,
      topic: scope.topic,
      targetLevel: coordinate.level,
      bloomLevel: coordinate.bloomLevel,
      difficulty: coordinate.difficulty,
      // Build an alternate pool rather than only one missing record. It gives
      // the next session variety and hides LLM latency after a promotion.
      requestedCount: Math.max(missing, LEARNING_QUESTIONS_PER_SESSION),
      generatedCount: 0,
      status: GenerationJobStatus.PENDING,
      attemptCount: 0,
      lastError: null,
      runAfter: new Date(),
      lockedAt: null,
      completedAt: null,
    });
    return { available, missing, job: await this.jobsRepository.save(job) };
  }

  async claimNextJob(): Promise<GenerationJob | null> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(GenerationJob);
      const job = await repository
        .createQueryBuilder('job')
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .where(
          '(job.status IN (:...statuses) OR (job.status = :processing AND job.locked_at < :staleLock))',
          {
            statuses: [
              GenerationJobStatus.PENDING,
              GenerationJobStatus.RETRYING,
            ],
            processing: GenerationJobStatus.PROCESSING,
            staleLock: new Date(Date.now() - 5 * 60_000),
          },
        )
        .andWhere('job.run_after <= :now', { now: new Date() })
        .orderBy('job.created_at', 'ASC')
        .getOne();
      if (!job) return null;
      job.status = GenerationJobStatus.PROCESSING;
      job.lockedAt = new Date();
      job.attemptCount += 1;
      return repository.save(job);
    });
  }

  async claimJob(jobId: string): Promise<GenerationJob | null> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(GenerationJob);
      const job = await repository
        .createQueryBuilder('job')
        .setLock('pessimistic_write')
        .where('job.id = :jobId', { jobId })
        .andWhere('job.status IN (:...statuses)', {
          statuses: [GenerationJobStatus.PENDING, GenerationJobStatus.RETRYING],
        })
        .getOne();
      if (!job || job.runAfter.getTime() > Date.now()) return null;
      job.status = GenerationJobStatus.PROCESSING;
      job.lockedAt = new Date();
      job.attemptCount += 1;
      return repository.save(job);
    });
  }

  async generateForJob(job: GenerationJob): Promise<void> {
    const scope: LearningScope = {
      subject: job.subject,
      chapter: job.chapter,
      topic: job.topic,
    };
    const coordinate: LearningCoordinate = {
      level: job.targetLevel,
      bloomLevel: job.bloomLevel as BloomLevel,
      difficulty: job.difficulty as DifficultyLevel,
      label: `Level ${job.targetLevel}`,
    };
    const sourceMaterial = await this.buildSourceMaterial(scope);
    const generated = await this.agentService.generateLearningQuestionBatch({
      ...scope,
      bloomLevel: coordinate.bloomLevel,
      difficulty: coordinate.difficulty,
      count: job.requestedCount,
      sourceMaterial,
    });
    const persistedCount = await this.persistGeneratedQuestions(job, generated);
    job.status = GenerationJobStatus.COMPLETED;
    job.generatedCount = persistedCount;
    job.lastError = null;
    job.completedAt = new Date();
    job.lockedAt = null;
    await this.jobsRepository.save(job);
  }

  async markJobFailed(job: GenerationJob, error: unknown): Promise<void> {
    const message = this.toSafeErrorMessage(error);
    job.lastError = message;
    job.lockedAt = null;
    if (job.attemptCount >= 3) {
      job.status = GenerationJobStatus.FAILED;
      job.completedAt = new Date();
    } else {
      job.status = GenerationJobStatus.RETRYING;
      job.runAfter = new Date(Date.now() + job.attemptCount * 60_000);
    }
    await this.jobsRepository.save(job);
    this.logger.warn(`Generation job ${job.id} failed: ${message}`);
  }

  async reserveGeneratedQuestions(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.generatedQuestionsRepository.update(
      { id: In(ids), status: GeneratedLearningQuestionStatus.READY },
      { status: GeneratedLearningQuestionStatus.RESERVED },
    );
  }

  toQuestionReference(item: LearningSessionItem): LearningQuestionReference {
    if (item.source === LearningQuestionSource.CURATED && item.question) {
      return this.toCuratedReference(item.question);
    }
    if (
      item.source === LearningQuestionSource.AI_POOL &&
      item.generatedQuestion
    ) {
      return this.toGeneratedReference(item.generatedQuestion);
    }
    throw new ServiceUnavailableException(
      'A learning question is no longer available. Please start a fresh session.',
    );
  }

  private async countAvailableQuestions(
    userId: string,
    scope: LearningScope,
    coordinate: LearningCoordinate,
  ): Promise<number> {
    const used = await this.getUsedQuestionIds(userId, scope, coordinate);
    const [generated, curated] = await Promise.all([
      this.generatedQuestionsRepository.find({
        select: { id: true },
        where: {
          userId,
          subject: scope.subject,
          chapter: scope.chapter,
          topic: scope.topic,
          bloomLevel: In(bloomLevelAliases(coordinate.bloomLevel)),
          difficulty: coordinate.difficulty,
          status: GeneratedLearningQuestionStatus.READY,
        },
      }),
      this.questionsRepository.find({
        select: { id: true },
        where: {
          subject: scope.subject,
          chapter: scope.chapter,
          topic: scope.topic,
          bloom_level: In(bloomLevelAliases(coordinate.bloomLevel)),
          difficulty: coordinate.difficulty,
          status: QuestionPublicationStatus.PUBLISHED,
        },
      }),
    ]);
    return (
      generated.filter((question) => !used.generated.has(question.id)).length +
      curated.filter((question) => !used.curated.has(question.id)).length
    );
  }

  private async getUsedQuestionIds(
    userId: string,
    scope: LearningScope,
    coordinate?: LearningCoordinate,
  ): Promise<{ curated: Set<string>; generated: Set<string> }> {
    const builder = this.dataSource
      .getRepository(LearningSessionItem)
      .createQueryBuilder('item')
      .innerJoin('item.session', 'session')
      .select([
        'item.questionId AS "questionId"',
        'item.generatedQuestionId AS "generatedQuestionId"',
      ])
      .where('session.user_id = :userId', { userId })
      .andWhere('session.subject = :subject', { subject: scope.subject })
      .andWhere('session.chapter = :chapter', { chapter: scope.chapter })
      .andWhere('session.topic = :topic', { topic: scope.topic });
    if (coordinate) {
      builder
        .andWhere('session.bloom_level IN (:...bloomLevels)', {
          bloomLevels: bloomLevelAliases(coordinate.bloomLevel),
        })
        .andWhere('session.difficulty = :difficulty', {
          difficulty: coordinate.difficulty,
        });
    }
    const rows = await builder.getRawMany<{
      questionId: string | null;
      generatedQuestionId: string | null;
    }>();
    return {
      curated: new Set(
        rows
          .map((row) => row.questionId)
          .filter((id): id is string => typeof id === 'string'),
      ),
      generated: new Set(
        rows
          .map((row) => row.generatedQuestionId)
          .filter((id): id is string => typeof id === 'string'),
      ),
    };
  }

  private async buildSourceMaterial(scope: LearningScope): Promise<string> {
    const [questions, flashcards] = await Promise.all([
      this.questionsRepository.find({
        where: {
          subject: scope.subject,
          chapter: scope.chapter,
          topic: scope.topic,
          status: QuestionPublicationStatus.PUBLISHED,
        },
        order: { created_at: 'ASC' },
        take: 12,
      }),
      this.flashcardsRepository.find({
        where: {
          subject: scope.subject,
          chapter: scope.chapter,
          topic: scope.topic,
        },
        order: { createdAt: 'ASC' },
        take: 12,
      }),
    ]);
    const blocks = [
      ...questions.map(
        (question) =>
          `Question concept: ${question.question_text}\nCorrect reasoning: ${question.solution}\nTags: ${(question.concept_tags ?? []).join(', ')}`,
      ),
      ...flashcards.map(
        (card) =>
          `Flashcard: ${card.front}\nAnswer: ${card.back}\nTags: ${(card.tags ?? []).join(', ')}`,
      ),
    ];
    if (blocks.length === 0) {
      throw new ServiceUnavailableException(
        'This topic has no reviewed database material for grounded AI generation.',
      );
    }
    return blocks.join('\n\n');
  }

  /**
   * The AI pool is served to a student the moment a row lands here — there is
   * no reviewer in the loop the way there is for curated drafts. A question
   * scoring below MIN_SERVABLE_QUALITY_SCORE is dropped rather than saved, so
   * a low-effort generation never reaches a learner in the first place.
   */
  private async persistGeneratedQuestions(
    job: GenerationJob,
    generated: GeneratedLearningQuestionPayload[],
  ): Promise<number> {
    const servable = generated.filter(
      (question) =>
        scoreQuestionQuality(question) >= MIN_SERVABLE_QUALITY_SCORE,
    );
    const droppedCount = generated.length - servable.length;
    if (droppedCount > 0) {
      this.logger.warn(
        `Dropped ${droppedCount} AI-pool question(s) below the quality floor for job ${job.id}.`,
      );
    }
    const records = servable.map((question) =>
      this.generatedQuestionsRepository.create({
        userId: job.userId,
        generationJobId: job.id,
        subject: job.subject,
        chapter: job.chapter,
        topic: job.topic,
        bloomLevel: job.bloomLevel,
        difficulty: job.difficulty,
        questionText: question.question_text,
        options: question.options,
        correctAnswer: question.correct_answer,
        solution: question.explanation,
        hint: question.hint,
        conceptTags: question.concept_tags,
        commonErrors: question.common_errors,
        source: LearningQuestionSource.AI_POOL,
        status: GeneratedLearningQuestionStatus.READY,
      }),
    );
    await this.generatedQuestionsRepository.save(records);
    return records.length;
  }

  private toCuratedReference(question: Question): LearningQuestionReference {
    return {
      source: LearningQuestionSource.CURATED,
      id: question.id,
      questionText: question.question_text,
      options: question.options,
      correctAnswer: question.correct_answer,
      solution: question.solution,
      hint: null,
      conceptTags: question.concept_tags ?? [],
      commonErrors: question.common_errors ?? [],
      bloomLevel: question.bloom_level,
      difficulty: question.difficulty,
    };
  }

  private toGeneratedReference(
    question: GeneratedLearningQuestion,
  ): LearningQuestionReference {
    return {
      source: LearningQuestionSource.AI_POOL,
      id: question.id,
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      solution: question.solution,
      hint: question.hint,
      conceptTags: question.conceptTags ?? [],
      commonErrors: question.commonErrors ?? [],
      bloomLevel: question.bloomLevel,
      difficulty: question.difficulty,
    };
  }

  private shuffle<T>(values: T[]): T[] {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = randomInt(index + 1);
      [result[index], result[randomIndex]] = [
        result[randomIndex],
        result[index],
      ];
    }
    return result;
  }

  private toSafeErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message.slice(0, 500);
    return 'Unknown AI generation failure.';
  }
}
