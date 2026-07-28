import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningAnswer } from '../adaptive/learning-answer.entity';
import { GeneratedLearningQuestion } from '../adaptive/generated-learning-question.entity';
import { PracticeAnswer } from '../practice/practice-answer.entity';
import { PracticeAttemptStatus } from '../practice/practice.types';
import { Question } from '../question.entity';
import type {
  NotebookMistakeCard,
  NotebookMistakesResponse,
  NotebookMistakeSource,
} from './notebook.types';

const DEFAULT_LIMIT = 24;

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
  constructor(
    @InjectRepository(PracticeAnswer)
    private readonly practiceAnswerRepository: Repository<PracticeAnswer>,
    @InjectRepository(LearningAnswer)
    private readonly learningAnswerRepository: Repository<LearningAnswer>,
  ) {}

  async getMistakes(
    userId: string,
    limit = DEFAULT_LIMIT,
  ): Promise<NotebookMistakesResponse> {
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

    const cards = this.dedupeLatest([...practiceCards, ...adaptiveCards])
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      )
      .slice(0, limit);

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
