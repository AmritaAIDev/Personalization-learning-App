import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { LearningAnswer } from '../adaptive/learning-answer.entity';
import { GeneratedLearningQuestion } from '../adaptive/generated-learning-question.entity';
import { DiagnosticAnswer } from '../diagnostics/diagnostic-answer.entity';
import { PracticeAnswer } from '../practice/practice-answer.entity';
import { PracticeAttemptStatus } from '../practice/practice.types';
import { Question } from '../question.entity';
import { MisconceptionsService } from '../misconceptions/misconceptions.service';
import { NotebookConceptService } from './notebook-concept.service';
import { NotebookConceptSummary } from './notebook-concept-summary.entity';
import { NotebookMistakeReview } from './notebook-mistake-review.entity';
import {
  FsrsGrade,
  intervalDaysFromStability,
  nextFsrsState,
} from '../adaptive/fsrs.util';
import { FlashcardRating } from '../adaptive/adaptive.types';
import type {
  NotebookConceptGroup,
  NotebookConceptsResponse,
  NotebookMistakeCard,
  NotebookMistakesResponse,
  NotebookMistakeSource,
} from './notebook.types';

const RATING_TO_GRADE: Record<FlashcardRating, FsrsGrade> = {
  [FlashcardRating.AGAIN]: 1,
  [FlashcardRating.HARD]: 2,
  [FlashcardRating.GOOD]: 3,
  [FlashcardRating.EASY]: 4,
};

const DEFAULT_LIMIT = 24;
const CONCEPT_GROUP_LIMIT = 100;
/**
 * A first notebook load after several new mistakes can invalidate many topic
 * summaries at once. Bounding how many groups synthesise concurrently keeps a
 * burst from firing a dozen parallel DeepSeek calls (cost + rate-limit) while
 * still enriching cached/singleton groups with no real wait.
 */
const CONCEPT_SUMMARY_CONCURRENCY = 3;

type QuestionLike = {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  questionText: string;
  selectedOption: string | null;
  correctOption: string;
  solution: string;
  misconception: string;
  conceptTags: string[];
  difficulty: string;
  bloomLevel: string;
};

@Injectable()
export class NotebookService {
  private readonly logger = new Logger(NotebookService.name);

  constructor(
    @InjectRepository(PracticeAnswer)
    private readonly practiceAnswerRepository: Repository<PracticeAnswer>,
    @InjectRepository(LearningAnswer)
    private readonly learningAnswerRepository: Repository<LearningAnswer>,
    @InjectRepository(DiagnosticAnswer)
    private readonly diagnosticAnswerRepository: Repository<DiagnosticAnswer>,
    @InjectRepository(NotebookConceptSummary)
    private readonly conceptSummaryRepository: Repository<NotebookConceptSummary>,
    @InjectRepository(NotebookMistakeReview)
    private readonly mistakeReviewRepository: Repository<NotebookMistakeReview>,
    private readonly conceptService: NotebookConceptService,
    private readonly misconceptionsService: MisconceptionsService,
  ) {}

  async getMistakes(
    userId: string,
    limit = DEFAULT_LIMIT,
  ): Promise<NotebookMistakesResponse> {
    const cards = await this.buildCards(userId, limit);
    return {
      cards,
      total: cards.length,
      summary: {
        practiceMistakes: cards.filter((card) => card.source === 'PRACTICE')
          .length,
        adaptiveMistakes: cards.filter((card) => card.source === 'ADAPTIVE')
          .length,
        diagnosticMistakes: cards.filter((card) => card.source === 'DIAGNOSTIC')
          .length,
        weakTopics: this.getWeakTopics(cards),
      },
    };
  }

  /**
   * Concept-level notebook: every wrong answer is clubbed by topic, and each
   * group carries an LLM-synthesised recurring-gap summary when one is useful.
   * Summaries are cached per (user, topic) and invalidated by a hash of the
   * constituent misconceptions, so the model is only called when the set of
   * mistakes in a topic actually changes.
   */
  async getConceptGroups(userId: string): Promise<NotebookConceptsResponse> {
    const cards = await this.buildCards(userId, CONCEPT_GROUP_LIMIT);
    const groups = this.groupByTopic(cards);
    const [enriched, dominantByTopic] = await Promise.all([
      this.enrichGroupsBounded(userId, groups),
      this.misconceptionsService
        .getDominantByTopic(
          userId,
          groups.map((group) => ({
            subject: group.subject,
            topic: group.topic,
          })),
        )
        .catch(() => new Map<string, { text: string; count: number }>()),
    ]);
    for (const group of enriched) {
      group.dominantMisconception =
        dominantByTopic.get(`${group.subject}|${group.topic}`) ?? null;
    }
    enriched.sort((left, right) => right.mistakeCount - left.mistakeCount);
    return {
      groups: enriched,
      total: cards.length,
      groupCount: enriched.length,
      summary: {
        practiceMistakes: cards.filter((card) => card.source === 'PRACTICE')
          .length,
        adaptiveMistakes: cards.filter((card) => card.source === 'ADAPTIVE')
          .length,
        diagnosticMistakes: cards.filter((card) => card.source === 'DIAGNOSTIC')
          .length,
      },
    };
  }

  /**
   * Enriches every topic group with a concept summary while never running more
   * than {@link CONCEPT_SUMMARY_CONCURRENCY} model calls at once. Order of the
   * returned array matches the input; the caller re-sorts afterwards.
   */
  private async enrichGroupsBounded(
    userId: string,
    groups: Omit<
      NotebookConceptGroup,
      | 'conceptLabel'
      | 'misconceptionSummary'
      | 'summarySource'
      | 'dominantMisconception'
    >[],
  ): Promise<NotebookConceptGroup[]> {
    const results = new Array<NotebookConceptGroup>(groups.length);
    let cursor = 0;
    const runWorker = async (): Promise<void> => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= groups.length) return;
        results[index] = await this.enrichGroup(userId, groups[index]);
      }
    };
    const workerCount = Math.min(CONCEPT_SUMMARY_CONCURRENCY, groups.length);
    await Promise.all(Array.from({ length: workerCount }, runWorker));
    return results;
  }

  private async buildCards(
    userId: string,
    limit: number,
  ): Promise<NotebookMistakeCard[]> {
    const [practiceAnswers, adaptiveAnswers, diagnosticAnswers, reviews] =
      await Promise.all([
        this.getPracticeMistakes(userId, limit),
        this.getAdaptiveMistakes(userId, limit),
        this.getDiagnosticMistakes(userId, limit),
        this.mistakeReviewRepository.find({ where: { userId } }),
      ]);
    const reviewByKey = new Map(
      reviews.map((review) => [
        `${review.source}:${review.questionId}`,
        review,
      ]),
    );
    const practiceCards = practiceAnswers.map((answer) =>
      this.toPracticeCard(answer, reviewByKey),
    );
    const adaptiveCards = adaptiveAnswers
      .map((answer) => this.toAdaptiveCard(answer, reviewByKey))
      .filter((card): card is NotebookMistakeCard => card !== null);
    const diagnosticCards = diagnosticAnswers.map((answer) =>
      this.toDiagnosticCard(answer, reviewByKey),
    );
    return this.dedupeLatest([
      ...practiceCards,
      ...adaptiveCards,
      ...diagnosticCards,
    ])
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      )
      .slice(0, limit);
  }

  private groupByTopic(
    cards: NotebookMistakeCard[],
  ): Omit<
    NotebookConceptGroup,
    | 'conceptLabel'
    | 'misconceptionSummary'
    | 'summarySource'
    | 'dominantMisconception'
  >[] {
    const buckets = new Map<string, NotebookMistakeCard[]>();
    for (const card of cards) {
      const key = `${card.subject}|${card.topic}`;
      const list = buckets.get(key);
      if (list) list.push(card);
      else buckets.set(key, [card]);
    }
    return Array.from(buckets.entries()).map(([key, groupCards]) => {
      const first = groupCards[0];
      const bloomLevels = Array.from(
        new Set(groupCards.map((card) => card.bloomLevel)),
      );
      const difficulties = Array.from(
        new Set(groupCards.map((card) => card.difficulty)),
      );
      const conceptTags = Array.from(
        new Set(groupCards.flatMap((card) => card.conceptTags)),
      ).slice(0, 6);
      const dueCount = groupCards.filter(
        (card) => card.reviewState === 'DUE',
      ).length;
      const lastOccurredAt = groupCards
        .map((card) => new Date(card.occurredAt).getTime())
        .reduce((max, value) => Math.max(max, value), 0);
      return {
        id: key,
        subject: first.subject,
        chapter: first.chapter,
        topic: first.topic,
        mistakeCount: groupCards.length,
        dueCount,
        lastOccurredAt: new Date(lastOccurredAt).toISOString(),
        bloomLevels,
        difficulties,
        conceptTags,
        cards: groupCards,
        practiceSimilar: {
          subject: first.subject,
          chapter: first.chapter,
          topic: first.topic,
        },
      };
    });
  }

  private async enrichGroup(
    userId: string,
    group: Omit<
      NotebookConceptGroup,
      | 'conceptLabel'
      | 'misconceptionSummary'
      | 'summarySource'
      | 'dominantMisconception'
    >,
  ): Promise<NotebookConceptGroup> {
    // Singletons are not worth a model call: use a deterministic label/summary
    // directly. The concept service still has its own fallback as a safety net.
    if (group.cards.length < 2) {
      const fallback = this.buildFallback(group);
      return {
        ...group,
        conceptLabel: fallback.conceptLabel,
        misconceptionSummary: fallback.misconceptionSummary,
        summarySource: 'FALLBACK',
        dominantMisconception: null,
      };
    }
    const sourceHash = this.hashGroup(group.cards);
    const cached = await this.conceptSummaryRepository.findOne({
      where: {
        userId,
        subject: group.subject,
        topic: group.topic,
      },
    });
    if (cached && cached.sourceHash === sourceHash) {
      return {
        ...group,
        conceptLabel: cached.conceptLabel,
        misconceptionSummary: cached.misconceptionSummary,
        summarySource: 'CACHE',
        dominantMisconception: null,
      };
    }
    const result = await this.conceptService.summariseGroup({
      topic: group.topic,
      chapter: group.chapter,
      subject: group.subject,
      cards: group.cards,
    });
    // Persist (or refresh) the cache so subsequent loads skip the model call.
    await this.persistSummary(userId, group, sourceHash, result);
    return {
      ...group,
      conceptLabel: result.conceptLabel,
      misconceptionSummary: result.misconceptionSummary,
      summarySource: result.source,
      dominantMisconception: null,
    };
  }

  private buildFallback(group: {
    topic: string;
    cards: NotebookMistakeCard[];
  }): { conceptLabel: string; misconceptionSummary: string } {
    const first = group.cards[0]?.misconception?.trim();
    const summary =
      first && first.length > 0
        ? first
        : `Review the core idea behind ${group.topic} and compare your reasoning with the worked solution.`;
    return { conceptLabel: group.topic, misconceptionSummary: summary };
  }

  private async persistSummary(
    userId: string,
    group: Omit<
      NotebookConceptGroup,
      | 'conceptLabel'
      | 'misconceptionSummary'
      | 'summarySource'
      | 'dominantMisconception'
    >,
    sourceHash: string,
    result: {
      conceptLabel: string;
      misconceptionSummary: string;
      source: 'LLM' | 'FALLBACK';
    },
  ): Promise<void> {
    try {
      const existing = await this.conceptSummaryRepository.findOne({
        where: { userId, subject: group.subject, topic: group.topic },
      });
      const row = this.conceptSummaryRepository.create({
        id: existing?.id,
        userId,
        subject: group.subject,
        chapter: group.chapter,
        topic: group.topic,
        conceptLabel: result.conceptLabel,
        misconceptionSummary: result.misconceptionSummary,
        sourceHash,
        summarySource: result.source,
      });
      if (existing) {
        row.createdAt = existing.createdAt;
        await this.conceptSummaryRepository.save(row);
      } else {
        await this.conceptSummaryRepository.save(row);
      }
    } catch (error) {
      // A cache write failure must never break the notebook view.
      this.logger.warn(
        `Could not persist concept summary for ${group.topic}: ${(error as Error).message}`,
      );
    }
  }

  private hashGroup(cards: NotebookMistakeCard[]): string {
    const signature = cards
      .map((card) => `${card.questionId}:${card.misconception}`)
      .sort()
      .join('|');
    return createHash('sha256').update(signature).digest('hex').slice(0, 40);
  }

  private getPracticeMistakes(userId: string, limit: number) {
    return this.practiceAnswerRepository
      .createQueryBuilder('answer')
      .innerJoinAndSelect('answer.attempt', 'attempt')
      .innerJoinAndSelect('answer.question', 'question')
      .where('attempt.user_id = :userId', { userId })
      .andWhere('attempt.status = :status', {
        status: PracticeAttemptStatus.SUBMITTED,
      })
      .andWhere('answer.is_correct = false')
      .orderBy('answer.updated_at', 'DESC')
      .take(limit)
      .getMany();
  }

  private getAdaptiveMistakes(userId: string, limit: number) {
    return this.learningAnswerRepository
      .createQueryBuilder('answer')
      .innerJoinAndSelect('answer.sessionItem', 'item')
      .innerJoinAndSelect('item.session', 'session')
      .leftJoinAndSelect('item.question', 'question')
      .leftJoinAndSelect('item.generatedQuestion', 'generatedQuestion')
      .where('session.user_id = :userId', { userId })
      .andWhere('answer.is_correct = false')
      .orderBy('answer.created_at', 'DESC')
      .take(limit)
      .getMany();
  }

  private getDiagnosticMistakes(userId: string, limit: number) {
    return this.diagnosticAnswerRepository
      .createQueryBuilder('answer')
      .innerJoinAndSelect('answer.attempt', 'attempt')
      .innerJoinAndSelect('answer.question', 'question')
      .where('attempt.user_id = :userId', { userId })
      .andWhere('answer.is_correct = false')
      .andWhere('answer.selected_option IS NOT NULL')
      .orderBy('answer.updated_at', 'DESC')
      .take(limit)
      .getMany();
  }

  private toDiagnosticCard(
    answer: DiagnosticAnswer,
    reviewByKey: Map<string, NotebookMistakeReview>,
  ): NotebookMistakeCard {
    return this.toCard(
      `diagnostic:${answer.id}`,
      'DIAGNOSTIC',
      this.fromCuratedQuestion(answer.question, answer.selectedOption),
      answer.updatedAt,
      reviewByKey,
    );
  }

  private toPracticeCard(
    answer: PracticeAnswer,
    reviewByKey: Map<string, NotebookMistakeReview>,
  ): NotebookMistakeCard {
    return this.toCard(
      `practice:${answer.id}`,
      'PRACTICE',
      this.fromCuratedQuestion(answer.question, answer.selectedOption),
      answer.updatedAt,
      reviewByKey,
    );
  }

  private toAdaptiveCard(
    answer: LearningAnswer,
    reviewByKey: Map<string, NotebookMistakeReview>,
  ): NotebookMistakeCard | null {
    const item = answer.sessionItem;
    const question = item.question
      ? this.fromCuratedQuestion(item.question, answer.selectedOption)
      : item.generatedQuestion
        ? this.fromGeneratedQuestion(
            item.generatedQuestion,
            answer.selectedOption,
          )
        : null;

    if (!question) return null;

    return this.toCard(
      `adaptive:${answer.id}`,
      'ADAPTIVE',
      question,
      answer.createdAt,
      reviewByKey,
    );
  }

  private toCard(
    id: string,
    source: NotebookMistakeSource,
    question: QuestionLike,
    occurredAt: Date,
    reviewByKey: Map<string, NotebookMistakeReview>,
  ): NotebookMistakeCard {
    const review = reviewByKey.get(`${source}:${question.id}`);
    const dueAt = review ? review.dueAt : this.getDueReviewAt(occurredAt);
    return {
      id,
      source,
      subject: question.subject,
      chapter: question.chapter,
      topic: question.topic,
      questionId: question.id,
      questionText: question.questionText,
      selectedOption: question.selectedOption,
      correctOption: question.correctOption,
      solution: question.solution,
      misconception: question.misconception,
      conceptTags: question.conceptTags,
      difficulty: question.difficulty,
      bloomLevel: question.bloomLevel,
      occurredAt: occurredAt.toISOString(),
      dueReviewAt: dueAt.toISOString(),
      reviewState: dueAt.getTime() <= Date.now() ? 'DUE' : 'UPCOMING',
      practiceSimilar: {
        subject: question.subject,
        chapter: question.chapter,
        topic: question.topic,
      },
    };
  }

  private fromCuratedQuestion(
    question: Question,
    selectedOption: string | null,
  ): QuestionLike {
    return {
      id: question.id,
      subject: question.subject,
      chapter: question.chapter,
      topic: question.topic,
      questionText: question.question_text,
      selectedOption,
      correctOption: question.correct_answer,
      solution: question.solution,
      misconception: this.getMisconception(question.common_errors),
      conceptTags: question.concept_tags ?? [],
      difficulty: question.difficulty,
      bloomLevel: question.bloom_level,
    };
  }

  private fromGeneratedQuestion(
    question: GeneratedLearningQuestion,
    selectedOption: string | null,
  ): QuestionLike {
    return {
      id: question.id,
      subject: question.subject,
      chapter: question.chapter,
      topic: question.topic,
      questionText: question.questionText,
      selectedOption,
      correctOption: question.correctAnswer,
      solution: question.solution,
      misconception: this.getMisconception(question.commonErrors),
      conceptTags: question.conceptTags ?? [],
      difficulty: question.difficulty,
      bloomLevel: question.bloomLevel,
    };
  }

  private getMisconception(commonErrors: string[] | null | undefined): string {
    const firstError = commonErrors?.find((error) => error.trim().length > 0);
    return (
      firstError ??
      'Review the concept behind this answer and compare your reasoning with the worked solution.'
    );
  }

  private getDueReviewAt(occurredAt: Date): Date {
    return new Date(occurredAt.getTime() + 24 * 60 * 60 * 1000);
  }

  private dedupeLatest(cards: NotebookMistakeCard[]): NotebookMistakeCard[] {
    const byQuestion = new Map<string, NotebookMistakeCard>();
    for (const card of cards) {
      const key = `${card.source}:${card.questionId}`;
      const existing = byQuestion.get(key);
      if (
        !existing ||
        new Date(card.occurredAt).getTime() >
          new Date(existing.occurredAt).getTime()
      ) {
        byQuestion.set(key, card);
      }
    }
    return Array.from(byQuestion.values());
  }

  /**
   * Rates a mistake's recall and advances its spaced-repetition schedule.
   * FSRS math duplicated from adaptive.service.ts's nextReviewSchedule()
   * rather than shared, so this can never regress the existing Flashcards
   * feature (see notebook-mistake-review.entity.ts's class comment).
   */
  async reviewMistake(
    userId: string,
    source: NotebookMistakeSource,
    questionId: string,
    rating: FlashcardRating,
  ): Promise<{
    source: NotebookMistakeSource;
    questionId: string;
    dueReviewAt: string;
    reviewState: 'UPCOMING';
    repetitions: number;
    intervalDays: number;
  }> {
    const now = new Date();
    let review = await this.mistakeReviewRepository.findOne({
      where: { userId, source, questionId },
    });
    const grade = RATING_TO_GRADE[rating];
    const elapsedDays = review
      ? Math.max(
          0,
          Math.floor(
            (now.getTime() - review.lastReviewedAt.getTime()) /
              (24 * 60 * 60 * 1000),
          ),
        )
      : 0;
    const state = nextFsrsState(
      review
        ? { difficulty: review.difficulty, stability: review.stability }
        : null,
      elapsedDays,
      grade,
    );
    const intervalDays = Math.max(
      0,
      Math.round(intervalDaysFromStability(state.stability)),
    );
    const next = {
      lastRating: rating,
      repetitions: (review?.repetitions ?? 0) + 1,
      intervalDays,
      difficulty: state.difficulty,
      stability: state.stability,
      dueAt: new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000),
      lastReviewedAt: now,
    };
    if (!review) {
      review = this.mistakeReviewRepository.create({
        userId,
        source,
        questionId,
        ...next,
      });
    } else {
      Object.assign(review, next);
    }
    const saved = await this.mistakeReviewRepository.save(review);
    return {
      source,
      questionId,
      dueReviewAt: saved.dueAt.toISOString(),
      reviewState: 'UPCOMING',
      repetitions: saved.repetitions,
      intervalDays: saved.intervalDays,
    };
  }

  private getWeakTopics(cards: NotebookMistakeCard[]): string[] {
    const counts = new Map<string, number>();
    for (const card of cards) {
      const key = `${card.subject} • ${card.chapter} • ${card.topic}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([topic]) => topic);
  }
}
