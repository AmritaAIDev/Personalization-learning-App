import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
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
import { scoreQuestionQuality } from './question-quality.util';
import { PracticeAnswer } from './practice/practice-answer.entity';
import { DiagnosticAnswer } from './diagnostics/diagnostic-answer.entity';
import { MockTestAnswer } from './mock-tests/mock-test-answer.entity';
import {
  CreateQuestionDto,
  type ReportQuestionDto,
  type ResolveQuestionReportDto,
  type UpdateQuestionDto,
} from './questions.dto';

export interface QuestionFilters {
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  bloom_level?: string;
  limit?: number;
}

const DEFAULT_QUESTION_BANK_LIMIT = 200;

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
    /** AI-suggested tags for the reviewer to confirm/edit — never auto-published. */
    concept_tags?: string[];
    common_errors?: string[];
  };
}

/**
 * Deterministic starting point for a generated draft's marks, scaled by
 * difficulty — a reviewer-editable suggestion, not a graded judgement.
 */
function suggestMarks(difficulty: string): number {
  return { Easy: 3, Medium: 4, Hard: 5 }[difficulty] ?? 4;
}

interface PublicationUpdate {
  action: 'PUBLISH' | 'ARCHIVE';
  reviewNotes?: string;
}

export interface RowValidationResult {
  row: number;
  valid: boolean;
  errors: string[];
}

export interface BulkImportCommitResult {
  inserted: number;
  failed: { row: number; errors: string[] }[];
}

export interface DifficultyCalibrationRow {
  id: string;
  question_id: string;
  subject: string;
  chapter: string;
  topic: string;
  question_text: string;
  difficulty: string;
  quality_score: number;
  sampleSize: number;
  observedAccuracy: number;
  expectedRange: [number, number];
  mismatched: boolean;
}

/**
 * A tagged difficulty is only ever a guess at creation time (by an admin or
 * a model). These are the accuracy bands a correctly-tagged question is
 * expected to fall into once enough students have actually answered it —
 * anything outside its band is flagged for a human to re-tag or retire.
 */
const EXPECTED_ACCURACY_RANGE: Record<string, [number, number]> = {
  Easy: [0.5, 1],
  Medium: [0.2, 0.9],
  Hard: [0, 0.7],
};

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
      take: filters.limit ?? DEFAULT_QUESTION_BANK_LIMIT,
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
      marks: suggestMarks(input.difficulty),
      estimated_time_sec: input.difficulty === 'Hard' ? 150 : 90,
      // AI-suggested, reviewer-editable — falls back to the topic name only
      // if the model returned no usable tags.
      concept_tags: input.generated.concept_tags?.length
        ? input.generated.concept_tags
        : [input.topic],
      common_errors: input.generated.common_errors ?? [],
      status: QuestionPublicationStatus.DRAFT,
      source: QuestionSource.AI_GENERATED,
      quality_score: scoreQuestionQuality(input.generated),
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
   * A hand-typed or bulk-imported curated question. Lands as DRAFT like every
   * other creation path (AI drafts included) — publishing is always a
   * separate, deliberate admin action.
   */
  async createCurated(
    createdByUserId: string,
    input: CreateQuestionDto,
  ): Promise<Question> {
    this.assertCorrectAnswerInOptions(input.options, input.correct_answer);
    const shortId = randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase();
    const question = this.questionsRepository.create({
      question_id: 'MAN-' + shortId,
      subject: input.subject,
      chapter: input.chapter,
      topic: input.topic,
      subtopic: input.subtopic?.trim() || null,
      question_text: input.question_text.trim(),
      options: input.options.map((option) => option.trim()),
      correct_answer: input.correct_answer.trim(),
      solution: input.solution.trim(),
      bloom_level: input.bloom_level,
      difficulty: input.difficulty,
      marks: input.marks,
      estimated_time_sec: input.estimated_time_sec,
      concept_tags: input.concept_tags ?? [],
      common_errors: input.common_errors ?? [],
      status: QuestionPublicationStatus.DRAFT,
      source: QuestionSource.CURATED,
      created_by_user_id: createdByUserId,
    });
    return this.questionsRepository.save(question);
  }

  /**
   * In-place correction (typo, answer-key fix, retagging). Does not touch
   * publication status — editing a PUBLISHED question keeps it published, this
   * is not a re-review workflow.
   */
  async updateQuestion(
    questionId: string,
    reviewerId: string,
    input: UpdateQuestionDto,
  ): Promise<Question> {
    const question = await this.findByQuestionId(questionId);
    const options = input.options ?? question.options;
    const correctAnswer = input.correct_answer ?? question.correct_answer;
    this.assertCorrectAnswerInOptions(options, correctAnswer);

    if (input.subject !== undefined) question.subject = input.subject;
    if (input.chapter !== undefined) question.chapter = input.chapter;
    if (input.topic !== undefined) question.topic = input.topic;
    if (input.subtopic !== undefined)
      question.subtopic = input.subtopic.trim() || null;
    if (input.question_text !== undefined)
      question.question_text = input.question_text.trim();
    if (input.options !== undefined)
      question.options = input.options.map((option) => option.trim());
    if (input.correct_answer !== undefined)
      question.correct_answer = input.correct_answer.trim();
    if (input.solution !== undefined) question.solution = input.solution.trim();
    if (input.bloom_level !== undefined)
      question.bloom_level = input.bloom_level;
    if (input.difficulty !== undefined) question.difficulty = input.difficulty;
    if (input.marks !== undefined) question.marks = input.marks;
    if (input.estimated_time_sec !== undefined)
      question.estimated_time_sec = input.estimated_time_sec;
    if (input.concept_tags !== undefined)
      question.concept_tags = input.concept_tags;
    if (input.common_errors !== undefined)
      question.common_errors = input.common_errors;

    question.reviewed_by_user_id = reviewerId;
    question.reviewed_at = new Date();
    return this.questionsRepository.save(question);
  }

  /**
   * Hard delete is only safe for a question no student has ever encountered.
   * Anything with attempt history must be archived instead, or the delete
   * would corrupt past students' analysis/review screens (practice, mock-test,
   * and diagnostic answers all hold a FK to this row).
   */
  async deleteQuestion(questionId: string): Promise<void> {
    const question = await this.findByQuestionId(questionId);
    const manager = this.questionsRepository.manager;
    const [practiceCount, diagnosticCount, mockTestCount] = await Promise.all([
      manager.count(PracticeAnswer, { where: { questionId: question.id } }),
      manager.count(DiagnosticAnswer, { where: { questionId: question.id } }),
      manager.count(MockTestAnswer, { where: { questionId: question.id } }),
    ]);
    const referenceCount = practiceCount + diagnosticCount + mockTestCount;
    if (referenceCount > 0) {
      throw new ConflictException(
        `This question is used in ${referenceCount} past attempt${referenceCount === 1 ? '' : 's'} — archive it instead of deleting.`,
      );
    }
    await this.questionsRepository.remove(question);
  }

  /**
   * Cross-checks each published question's tagged difficulty against how
   * students have actually performed on it, so a mistagged item (e.g.
   * "Easy" that almost nobody gets right) surfaces for a human to re-tag
   * rather than silently steering the adaptive engine's difficulty
   * targeting wrong forever. Read-only — nothing here mutates a tag
   * automatically; that's still an explicit edit via updateQuestion.
   */
  async getDifficultyCalibration(
    minSampleSize = 10,
  ): Promise<DifficultyCalibrationRow[]> {
    const rows = await this.questionsRepository.manager.query<
      Array<{
        id: string;
        question_id: string;
        subject: string;
        chapter: string;
        topic: string;
        question_text: string;
        difficulty: string;
        quality_score: number;
        total_answers: string;
        correct_answers: string;
      }>
    >(
      `SELECT q.id, q.question_id, q.subject, q.chapter, q.topic, q.question_text,
              q.difficulty, q.quality_score, s.total_answers, s.correct_answers
       FROM questions q
       JOIN (
         SELECT question_id,
                COUNT(*) FILTER (WHERE is_correct IS NOT NULL) AS total_answers,
                COUNT(*) FILTER (WHERE is_correct = true) AS correct_answers
         FROM (
           SELECT question_id, is_correct FROM practice_answers
           UNION ALL
           SELECT question_id, is_correct FROM diagnostic_answers
           UNION ALL
           SELECT question_id, is_correct FROM mock_test_answers
         ) all_answers
         GROUP BY question_id
       ) s ON s.question_id = q.id
       WHERE q.status = 'PUBLISHED' AND s.total_answers >= $1
       ORDER BY s.total_answers DESC`,
      [minSampleSize],
    );

    return rows.map((row) => {
      const sampleSize = Number(row.total_answers);
      const observedAccuracy = Number(row.correct_answers) / sampleSize;
      const expectedRange = EXPECTED_ACCURACY_RANGE[row.difficulty] ?? [0, 1];
      const mismatched =
        observedAccuracy < expectedRange[0] ||
        observedAccuracy > expectedRange[1];
      return {
        id: row.id,
        question_id: row.question_id,
        subject: row.subject,
        chapter: row.chapter,
        topic: row.topic,
        question_text: row.question_text,
        difficulty: row.difficulty,
        quality_score: row.quality_score,
        sampleSize,
        observedAccuracy,
        expectedRange,
        mismatched,
      };
    });
  }

  /** Validates one row without writing to the DB, for the bulk-import preview. */
  async validateQuestionRow(
    row: Record<string, unknown>,
    rowNumber: number,
  ): Promise<RowValidationResult> {
    const errors = await this.checkQuestionRow(row);
    return { row: rowNumber, valid: errors.length === 0, errors };
  }

  /** Inserts every valid row as a DRAFT curated question; invalid rows are skipped, not fatal to the batch. */
  async bulkImportQuestions(
    createdByUserId: string,
    rows: Record<string, unknown>[],
  ): Promise<BulkImportCommitResult> {
    let inserted = 0;
    const failed: { row: number; errors: string[] }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 1;
      const errors = await this.checkQuestionRow(rows[i]);
      if (errors.length > 0) {
        failed.push({ row: rowNumber, errors });
        continue;
      }
      await this.createCurated(
        createdByUserId,
        plainToInstance(CreateQuestionDto, rows[i]),
      );
      inserted += 1;
    }
    return { inserted, failed };
  }

  private async checkQuestionRow(
    row: Record<string, unknown>,
  ): Promise<string[]> {
    const instance = plainToInstance(CreateQuestionDto, row);
    const violations = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    const errors = violations.flatMap((violation) =>
      Object.values(violation.constraints ?? {}),
    );
    if (
      errors.length === 0 &&
      !instance.options?.includes(instance.correct_answer)
    ) {
      errors.push('correct_answer must be one of options');
    }
    return errors;
  }

  private assertCorrectAnswerInOptions(
    options: string[],
    correctAnswer: string,
  ): void {
    if (!options.includes(correctAnswer)) {
      throw new BadRequestException('correct_answer must be one of options.');
    }
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
