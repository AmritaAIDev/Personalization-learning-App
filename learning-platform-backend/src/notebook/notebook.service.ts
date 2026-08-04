import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { LearningAnswer } from '../adaptive/learning-answer.entity';
import { GeneratedLearningQuestion } from '../adaptive/generated-learning-question.entity';
import { PracticeAnswer } from '../practice/practice-answer.entity';
import { PracticeAttemptStatus } from '../practice/practice.types';
import { Question } from '../question.entity';
import { NotebookConceptService } from './notebook-concept.service';
import { NotebookConceptSummary } from './notebook-concept-summary.entity';
import type {
  NotebookConceptGroup,
  NotebookConceptsResponse,
  NotebookMistakeCard,
  NotebookMistakesResponse,
  NotebookMistakeSource,
} from './notebook.types';

const DEFAULT_LIMIT = 24;
const CONCEPT_GROUP_LIMIT = 100;

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
    @InjectRepository(NotebookConceptSummary)
    private readonly conceptSummaryRepository: Repository<NotebookConceptSummary>,
    private readonly conceptService: NotebookConceptService,
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
    const enriched = await Promise.all(
      groups.map((group) => this.enrichGroup(userId, group)),
    );
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
      },
    };
  }

  private async buildCards(
    userId: string,
    limit: number,
  ): Promise<NotebookMistakeCard[]> {
    const [practiceAnswers, adaptiveAnswers] = await Promise.all([
      this.getPracticeMistakes(userId, limit),
      this.getAdaptiveMistakes(userId, limit),
    ]);
    const practiceCards = practiceAnswers.map((answer) =>
      this.toPracticeCard(answer),
    );
    const adaptiveCards = adaptiveAnswers
      .map((answer) => this.toAdaptiveCard(answer))
      .filter((card): card is NotebookMistakeCard => card !== null);
    return this.dedupeLatest([...practiceCards, ...adaptiveCards])
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
    'conceptLabel' | 'misconceptionSummary' | 'summarySource'
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
      'conceptLabel' | 'misconceptionSummary' | 'summarySource'
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
      'conceptLabel' | 'misconceptionSummary' | 'summarySource'
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

  private toPracticeCard(answer: PracticeAnswer): NotebookMistakeCard {
    return this.toCard(
      `practice:${answer.id}`,
      'PRACTICE',
      this.fromCuratedQuestion(answer.question, answer.selectedOption),
      answer.updatedAt,
    );
  }

  private toAdaptiveCard(answer: LearningAnswer): NotebookMistakeCard | null {
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
    );
  }

  private toCard(
    id: string,
    source: NotebookMistakeSource,
    question: QuestionLike,
    occurredAt: Date,
  ): NotebookMistakeCard {
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
      dueReviewAt: this.getDueReviewAt(occurredAt).toISOString(),
      reviewState:
        this.getDueReviewAt(occurredAt).getTime() <= Date.now()
          ? 'DUE'
          : 'UPCOMING',
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
