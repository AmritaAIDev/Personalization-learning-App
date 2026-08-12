import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import {
  Question,
  QuestionPublicationStatus,
  QuestionSource,
} from './question.entity';
import { QuestionReport, QuestionReportStatus } from './question-report.entity';
import { GeneratedLearningQuestion } from './adaptive/generated-learning-question.entity';
import {
  GeneratedLearningQuestionStatus,
  LearningQuestionSource,
} from './adaptive/adaptive.types';
import type {
  ReportQuestionDto,
  ResolveQuestionReportDto,
} from './questions.dto';

export interface QuestionFilters {
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  bloom_level?: string;
}

export interface AdminQuestionFilters extends QuestionFilters {
  status?: QuestionPublicationStatus;
  source?: QuestionSource;
  limit?: number;
}

export interface QuestionReportFilters {
  status?: QuestionReportStatus;
  limit?: number;
}

export type QuestionReportWithPreview = QuestionReport & {
  questionPreview: { text: string; chapter: string; topic: string } | null;
};

export interface PublicQuestion {
  id: string;
  questionId: string;
  subject: string;
  chapter: string;
  topic: string;
  subtopic: string | null;
  questionText: string;
  options: string[];
  bloomLevel: string;
  difficulty: string;
  marks: number;
  estimatedTimeSec: number;
}

export interface QuestionCatalogEntry {
  subject: string;
  chapter: string;
  topic: string;
  questionCount: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  readyForPractice: boolean;
}

interface GeneratedQuestionDraftInput {
  createdByUserId: string;
  subject: string;
  chapter: string;
  topic: string;
  bloomLevel: string;
  difficulty: string;
  generated: {
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  };
}

interface PublicationUpdate {
  action: 'PUBLISH' | 'ARCHIVE';
  reviewNotes?: string;
}

/**
 * Serves the reviewed question bank stored in PostgreSQL.
 *
 * Generated questions are persisted as drafts and remain invisible to learners
 * until an administrator explicitly publishes them.
 */
@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(GeneratedLearningQuestion)
    private readonly generatedQuestionsRepository: Repository<GeneratedLearningQuestion>,
    @InjectRepository(QuestionReport)
    private readonly questionReportsRepository: Repository<QuestionReport>,
  ) {}

  /** Fetch bank questions, optionally filtered by the tagged dimensions. */
  async findAll(filters: QuestionFilters = {}): Promise<Question[]> {
    const where: FindOptionsWhere<Question> = {
      status: QuestionPublicationStatus.PUBLISHED,
    };
    if (filters.subject) where.subject = filters.subject;
    if (filters.chapter) where.chapter = filters.chapter;
    if (filters.topic) where.topic = filters.topic;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.bloom_level) where.bloom_level = filters.bloom_level;

    return this.questionsRepository.find({
      where,
      order: { created_at: 'ASC' },
    });
  }

  /** Fetch a single bank question by its human-readable question_id. */
  async findByQuestionId(questionId: string): Promise<Question> {
    const question = await this.questionsRepository.findOne({
      where: { question_id: questionId },
    });
    if (!question) {
      throw new NotFoundException(`Question "${questionId}" not found.`);
    }
    return question;
  }

  async findPublishedByQuestionId(questionId: string): Promise<Question> {
    const question = await this.questionsRepository.findOne({
      where: {
        question_id: questionId,
        status: QuestionPublicationStatus.PUBLISHED,
      },
    });
    if (!question) {
      throw new NotFoundException('Published question not found.');
    }
    return question;
  }

  /** Full question records, including answer keys, for authenticated reviewers only. */
  async findAdminAll(filters: AdminQuestionFilters = {}): Promise<Question[]> {
    const where: FindOptionsWhere<Question> = {};
    if (filters.subject) where.subject = filters.subject;
    if (filters.chapter) where.chapter = filters.chapter;
    if (filters.topic) where.topic = filters.topic;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.bloom_level) where.bloom_level = filters.bloom_level;
    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;

    return this.questionsRepository.find({
      where,
      order: { updated_at: 'DESC' },
      take: filters.limit ?? 25,
    });
  }

  async searchCatalog(
    query: string | undefined,
    limit: number,
  ): Promise<QuestionCatalogEntry[]> {
    const builder = this.questionsRepository
      .createQueryBuilder('question')
      .select('question.subject', 'subject')
      .addSelect('question.chapter', 'chapter')
      .addSelect('question.topic', 'topic')
      .addSelect('COUNT(question.id)', 'questionCount')
      .addSelect(
        "SUM(CASE WHEN question.difficulty = 'Easy' THEN 1 ELSE 0 END)",
        'easyCount',
      )
      .addSelect(
        "SUM(CASE WHEN question.difficulty = 'Medium' THEN 1 ELSE 0 END)",
        'mediumCount',
      )
      .addSelect(
        "SUM(CASE WHEN question.difficulty = 'Hard' THEN 1 ELSE 0 END)",
        'hardCount',
      )
      .where('question.status = :status', {
        status: QuestionPublicationStatus.PUBLISHED,
      });

    const normalizedQuery = query?.trim();
    if (normalizedQuery) {
      const searchTerm = '%' + this.escapeLike(normalizedQuery) + '%';
      builder.andWhere(
        "(LOWER(question.subject) LIKE LOWER(:searchTerm) ESCAPE '\\' OR LOWER(question.chapter) LIKE LOWER(:searchTerm) ESCAPE '\\' OR LOWER(question.topic) LIKE LOWER(:searchTerm) ESCAPE '\\')",
        { searchTerm },
      );
    }

    const rows = await builder
      .groupBy('question.subject')
      .addGroupBy('question.chapter')
      .addGroupBy('question.topic')
      .orderBy('COUNT(question.id)', 'DESC')
      .addOrderBy('question.topic', 'ASC')
      .limit(limit)
      .getRawMany<{
        subject: string;
        chapter: string;
        topic: string;
        questionCount: string;
        easyCount: string;
        mediumCount: string;
        hardCount: string;
      }>();

    return rows.map((row) => {
      const easyCount = Number(row.easyCount);
      const mediumCount = Number(row.mediumCount);
      const hardCount = Number(row.hardCount);
      return {
        subject: row.subject,
        chapter: row.chapter,
        topic: row.topic,
        questionCount: Number(row.questionCount),
        easyCount,
        mediumCount,
        hardCount,
        readyForPractice: easyCount >= 5 && mediumCount >= 5 && hardCount >= 5,
      };
    });
  }

  async createGeneratedDraft(
    input: GeneratedQuestionDraftInput,
  ): Promise<Question> {
    const shortId = randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase();
    const now = new Date();
    const question = this.questionsRepository.create({
      question_id: 'AI-' + shortId,
      subject: input.subject,
      chapter: input.chapter,
      topic: input.topic,
      subtopic: null,
      question_text: input.generated.question_text.trim(),
      options: input.generated.options.map((option) => option.trim()),
      correct_answer: input.generated.correct_answer.trim(),
      solution: input.generated.explanation.trim(),
      bloom_level: input.bloomLevel,
      difficulty: input.difficulty,
      marks: 4,
      estimated_time_sec: input.difficulty === 'Hard' ? 150 : 90,
      concept_tags: [input.topic],
      common_errors: [],
      status: QuestionPublicationStatus.DRAFT,
      source: QuestionSource.AI_GENERATED,
      quality_score: this.scoreGeneratedQuestion(input.generated),
      created_by_user_id: input.createdByUserId,
      reviewed_by_user_id: null,
      reviewed_at: null,
      review_notes: null,
      published_at: null,
      created_at: now,
      updated_at: now,
    });
    return this.questionsRepository.save(question);
  }

  async updatePublication(
    questionId: string,
    reviewerId: string,
    input: PublicationUpdate,
  ): Promise<Question> {
    const question = await this.findByQuestionId(questionId);
    const now = new Date();
    question.status =
      input.action === 'PUBLISH'
        ? QuestionPublicationStatus.PUBLISHED
        : QuestionPublicationStatus.ARCHIVED;
    question.reviewed_by_user_id = reviewerId;
    question.reviewed_at = now;
    question.review_notes = input.reviewNotes?.trim() || null;
    question.published_at =
      input.action === 'PUBLISH' ? now : question.published_at;
    return this.questionsRepository.save(question);
  }

  /**
   * Never leak solutions or correct answers through a bank endpoint. Diagnostic
   * scoring is performed by DiagnosticsService after submission.
   */
  async findPublicAll(
    filters: QuestionFilters = {},
  ): Promise<PublicQuestion[]> {
    const questions = await this.findAll(filters);
    return questions.map((question) => this.toPublicQuestion(question));
  }

  async findPublicByQuestionId(questionId: string): Promise<PublicQuestion> {
    return this.toPublicQuestion(
      await this.findPublishedByQuestionId(questionId),
    );
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }

  private scoreGeneratedQuestion(
    generated: GeneratedQuestionDraftInput['generated'],
  ): number {
    const distinctOptions = new Set(
      generated.options.map((option) => option.trim().toLocaleLowerCase()),
    ).size;
    const hasUsefulExplanation = generated.explanation.trim().length >= 40;
    const hasGroundedPrompt = generated.question_text.trim().length >= 30;
    return Math.min(
      100,
      65 +
        (distinctOptions === 4 ? 15 : 0) +
        (hasUsefulExplanation ? 10 : 0) +
        (hasGroundedPrompt ? 10 : 0),
    );
  }

  /**
   * Records a student's report and, for AI-pool questions, immediately
   * excludes it from future selection (status -> REJECTED) since that pool
   * is served in real time and can't wait on human review. Curated
   * questions are left published — a single report shouldn't unpublish
   * shared content — but the report is queued for a reviewer to judge.
   */
  async reportQuestion(
    userId: string,
    dto: ReportQuestionDto,
  ): Promise<QuestionReport> {
    if (dto.questionSource === LearningQuestionSource.CURATED) {
      if (!dto.questionId) {
        throw new BadRequestException(
          'questionId is required when reporting a curated question.',
        );
      }
      const question = await this.questionsRepository.findOne({
        where: { id: dto.questionId },
      });
      if (!question) throw new NotFoundException('Question not found.');
    } else {
      if (!dto.generatedQuestionId) {
        throw new BadRequestException(
          'generatedQuestionId is required when reporting an AI-pool question.',
        );
      }
      const generated = await this.generatedQuestionsRepository.findOne({
        where: { id: dto.generatedQuestionId },
      });
      if (!generated) throw new NotFoundException('Question not found.');
      if (generated.status === GeneratedLearningQuestionStatus.READY) {
        generated.status = GeneratedLearningQuestionStatus.REJECTED;
        await this.generatedQuestionsRepository.save(generated);
      }
    }

    const report = this.questionReportsRepository.create({
      reportedByUserId: userId,
      questionSource: dto.questionSource,
      questionId: dto.questionId ?? null,
      generatedQuestionId: dto.generatedQuestionId ?? null,
      reason: dto.reason,
      details: dto.details?.trim() || null,
      status: QuestionReportStatus.OPEN,
    });
    return this.questionReportsRepository.save(report);
  }

  /**
   * Reviewer inventory of open (by default) student-reported questions,
   * enriched with a short preview of the reported question's own text so a
   * reviewer isn't stuck resolving a bare UUID.
   */
  async findReports(
    filters: QuestionReportFilters = {},
  ): Promise<QuestionReportWithPreview[]> {
    const reports = await this.questionReportsRepository.find({
      where: { status: filters.status ?? QuestionReportStatus.OPEN },
      order: { createdAt: 'DESC' },
      take: filters.limit ?? 25,
    });
    if (reports.length === 0) return [];

    const questionIds = reports
      .map((report) => report.questionId)
      .filter((id): id is string => id !== null);
    const generatedQuestionIds = reports
      .map((report) => report.generatedQuestionId)
      .filter((id): id is string => id !== null);

    const [questions, generatedQuestions] = await Promise.all([
      questionIds.length
        ? this.questionsRepository.find({ where: { id: In(questionIds) } })
        : Promise.resolve([]),
      generatedQuestionIds.length
        ? this.generatedQuestionsRepository.find({
            where: { id: In(generatedQuestionIds) },
          })
        : Promise.resolve([]),
    ]);
    const questionsById = new Map(
      questions.map((question) => [question.id, question]),
    );
    const generatedById = new Map(
      generatedQuestions.map((question) => [question.id, question]),
    );

    return reports.map((report) => {
      const question = report.questionId
        ? questionsById.get(report.questionId)
        : undefined;
      const generated = report.generatedQuestionId
        ? generatedById.get(report.generatedQuestionId)
        : undefined;
      return {
        ...report,
        questionPreview: question
          ? {
              text: question.question_text,
              chapter: question.chapter,
              topic: question.topic,
            }
          : generated
            ? {
                text: generated.questionText,
                chapter: generated.chapter,
                topic: generated.topic,
              }
            : null,
      };
    });
  }

  async resolveReport(
    reportId: string,
    reviewerId: string,
    input: ResolveQuestionReportDto,
  ): Promise<QuestionReport> {
    const report = await this.questionReportsRepository.findOne({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found.');
    report.status =
      input.action === 'RESOLVE'
        ? QuestionReportStatus.RESOLVED
        : QuestionReportStatus.DISMISSED;
    report.resolvedByUserId = reviewerId;
    report.resolvedAt = new Date();
    return this.questionReportsRepository.save(report);
  }

  private toPublicQuestion(question: Question): PublicQuestion {
    return {
      id: question.id,
      questionId: question.question_id,
      subject: question.subject,
      chapter: question.chapter,
      topic: question.topic,
      subtopic: question.subtopic,
      questionText: question.question_text,
      options: question.options,
      bloomLevel: question.bloom_level,
      difficulty: question.difficulty,
      marks: question.marks,
      estimatedTimeSec: question.estimated_time_sec,
    };
  }
}
