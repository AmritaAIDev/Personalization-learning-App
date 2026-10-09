import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import { BookmarkedQuestion } from '../bookmarks/bookmarked-question.entity';
import { Question, QuestionPublicationStatus } from '../question.entity';
import { Topic, TopicLevel } from '../topics/topic.entity';
import { loadAnswerEvents } from './answer-events.query';
import { tally, type AnswerEvent } from './catalog.analytics';
import { findBySlug, slugify } from './catalog.slug';
import {
  COMPLETED_AT,
  chapterProgress,
  masteryLevel,
  topicProgress,
  type TopicProgress,
} from './catalog.progress';
import type { UpdateChapterMetaDto } from './catalog.dto';
import {
  ChapterMeta,
  ChapterMetaSource,
  ChapterMetaStatus,
} from './chapter-meta.entity';
import type {
  AdminChapterMetaRow,
  CatalogChapterDetail,
  CatalogChapterSummary,
  CatalogSubjectChapters,
  CatalogSubjectSummary,
  CatalogTopicDetail,
} from './catalog.types';

const TOPIC_PREVIEW_COUNT = 4;

export interface SubjectOutline {
  subject: { slug: string; name: string };
  chapters: Array<{ slug: string; name: string; unit: string | null }>;
}

interface ChapterNode {
  topic: Topic;
  subtopics: Topic[];
}

interface SubjectNode {
  topic: Topic;
  chapters: ChapterNode[];
}

interface CatalogContext {
  tree: SubjectNode[];
  meta: Map<string, ChapterMeta>;
  questionCounts: Map<string, number>;
  states: Map<string, LearningTopicState>;
  /** Graded answers from every source, indexed for chapter and topic lookups. */
  events: AnswerEvent[];
  chapterEvents: Map<string, AnswerEvent[]>;
  topicEvents: Map<string, AnswerEvent[]>;
}

interface BuiltChapter {
  summary: CatalogChapterSummary;
  topics: CatalogTopicDetail[];
}

const scopeKey = (subject: string, chapter: string, topic: string) =>
  `${subject}|${chapter}|${topic}`;

/**
 * Read model behind the Subjects / Chapter screens: the curriculum tree
 * (topics table) joined with published study-guide metadata, live question
 * counts and the student's own learning state. Nothing here is cached or
 * duplicated into new tables, so counts and progress are always current.
 */
@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Topic) private readonly topics: Repository<Topic>,
    @InjectRepository(ChapterMeta)
    private readonly chapterMeta: Repository<ChapterMeta>,
    @InjectRepository(LearningTopicState)
    private readonly topicStates: Repository<LearningTopicState>,
    @InjectRepository(Question)
    private readonly questions: Repository<Question>,
    @InjectRepository(BookmarkedQuestion)
    private readonly bookmarks: Repository<BookmarkedQuestion>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getSubjects(userId: string): Promise<CatalogSubjectSummary[]> {
    const ctx = await this.loadContext(userId);
    return ctx.tree.map((subject) => {
      const built = subject.chapters.map((chapter) =>
        this.buildChapter(ctx, subject, chapter),
      );
      // Pooled accuracy over every answer in the subject: the same figure the
      // subject analytics page shows.
      const averageScore = tally(
        ctx.events.filter((event) => event.subject === subject.topic.name),
      ).accuracy;
      return {
        slug: slugify(subject.topic.name),
        name: subject.topic.name,
        chapterCount: built.length,
        chaptersCompleted: built.filter(
          (c) => c.summary.score !== null && c.summary.score >= COMPLETED_AT,
        ).length,
        mastery: masteryLevel(averageScore),
        chaptersStarted: built.filter((c) => c.summary.status !== 'NOT_STARTED')
          .length,
        chaptersMastered: built.filter((c) => c.summary.status === 'MASTERED')
          .length,
        topicCount: built.reduce((sum, c) => sum + c.summary.topicCount, 0),
        questionCount: built.reduce(
          (sum, c) => sum + c.summary.questionCount,
          0,
        ),
        averageScore,
      };
    });
  }

  async getSubjectChapters(
    userId: string,
    subjectSlug: string,
  ): Promise<CatalogSubjectChapters> {
    const ctx = await this.loadContext(userId);
    const subject = this.requireSubject(ctx, subjectSlug);
    const chapters = subject.chapters.map(
      (chapter) => this.buildChapter(ctx, subject, chapter).summary,
    );
    const unitCounts = new Map<string, number>();
    for (const chapter of chapters) {
      if (chapter.unit) {
        unitCounts.set(chapter.unit, (unitCounts.get(chapter.unit) ?? 0) + 1);
      }
    }
    return {
      subject: {
        slug: slugify(subject.topic.name),
        name: subject.topic.name,
      },
      units: [...unitCounts].map(([name, count]) => ({ name, count })),
      chapters,
    };
  }

  async getChapterDetail(
    userId: string,
    subjectSlug: string,
    chapterSlug: string,
  ): Promise<CatalogChapterDetail> {
    const ctx = await this.loadContext(userId);
    const subject = this.requireSubject(ctx, subjectSlug);
    const chapter = findBySlug(
      subject.chapters.map((node) => ({ name: node.topic.name, node })),
      chapterSlug,
    )?.node;
    if (!chapter) throw new NotFoundException('Chapter not found.');

    const built = this.buildChapter(ctx, subject, chapter);
    const meta = ctx.meta.get(chapter.topic.id);
    const published =
      meta?.status === ChapterMetaStatus.PUBLISHED && meta.overview;
    const bookmarkedCount = await this.bookmarks
      .createQueryBuilder('bookmark')
      .innerJoin('bookmark.question', 'question')
      .where('bookmark.userId = :userId', { userId })
      .andWhere('question.subject = :subject', {
        subject: subject.topic.name,
      })
      .andWhere('question.chapter = :chapter', { chapter: chapter.topic.name })
      .getCount();

    return {
      chapter: built.summary,
      meta:
        meta && published
          ? {
              overview: meta.overview,
              objectives: meta.objectives,
              keyFormulas: meta.keyFormulas,
              difficulty: meta.difficulty,
              studyMinutes: meta.studyMinutes,
              jeeWeightageNote: meta.jeeWeightageNote,
            }
          : null,
      topics: built.topics,
      bookmarkedCount,
    };
  }

  /** Admin review list: every chapter with its study-guide state. */
  async listChapterMetaForReview(): Promise<AdminChapterMetaRow[]> {
    const ctx = await this.loadContext(null);
    return ctx.tree.flatMap((subject) =>
      subject.chapters.map((chapter) => {
        const meta = ctx.meta.get(chapter.topic.id);
        return {
          topicId: chapter.topic.id,
          subject: subject.topic.name,
          chapter: chapter.topic.name,
          unit: meta?.unit ?? null,
          source: meta?.source ?? null,
          status: meta?.status ?? null,
          hasOverview: Boolean(meta?.overview?.trim()),
          updatedAt: meta?.updatedAt ?? null,
        };
      }),
    );
  }

  /**
   * Admin edit / publish of one chapter's study guide. Touching any content
   * field marks the row ADMIN-owned so the seed never overwrites it again.
   */
  async updateChapterMeta(
    topicId: string,
    dto: UpdateChapterMetaDto,
  ): Promise<AdminChapterMetaRow> {
    const topic = await this.topics.findOne({
      where: { id: topicId, level: TopicLevel.CHAPTER },
      relations: { parent: true },
    });
    if (!topic) throw new NotFoundException('Chapter not found.');

    const row =
      (await this.chapterMeta.findOne({ where: { topicId } })) ??
      this.chapterMeta.create({
        topicId,
        unit: null,
        overview: null,
        objectives: [],
        keyFormulas: [],
        difficulty: null,
        studyMinutes: null,
        jeeWeightageNote: null,
        source: ChapterMetaSource.ADMIN,
        status: ChapterMetaStatus.DRAFT,
      });

    const cleanList = (values: string[]) => [
      ...new Set(values.map((v) => v.trim()).filter(Boolean)),
    ];
    if (dto.unit !== undefined) row.unit = dto.unit.trim();
    if (dto.overview !== undefined) row.overview = dto.overview.trim() || null;
    if (dto.objectives !== undefined)
      row.objectives = cleanList(dto.objectives);
    if (dto.keyFormulas !== undefined) {
      row.keyFormulas = cleanList(dto.keyFormulas);
    }
    if (dto.difficulty !== undefined) row.difficulty = dto.difficulty;
    if (dto.studyMinutes !== undefined) row.studyMinutes = dto.studyMinutes;
    if (dto.jeeWeightageNote !== undefined) {
      row.jeeWeightageNote = dto.jeeWeightageNote.trim() || null;
    }

    const contentTouched =
      dto.unit !== undefined ||
      dto.overview !== undefined ||
      dto.objectives !== undefined ||
      dto.keyFormulas !== undefined ||
      dto.difficulty !== undefined ||
      dto.studyMinutes !== undefined;
    if (contentTouched) row.source = ChapterMetaSource.ADMIN;

    if (dto.status !== undefined) {
      if (
        dto.status === ChapterMetaStatus.PUBLISHED &&
        (!row.overview?.trim() || row.objectives.length === 0)
      ) {
        throw new BadRequestException(
          'A chapter needs an overview and at least one objective before it can be published.',
        );
      }
      row.status = dto.status;
    }
    // Publishing content that has since been blanked out is never allowed.
    if (
      row.status === ChapterMetaStatus.PUBLISHED &&
      (!row.overview?.trim() || row.objectives.length === 0)
    ) {
      throw new BadRequestException(
        'A published chapter must keep an overview and at least one objective.',
      );
    }

    const saved = await this.chapterMeta.save(row);
    return {
      topicId,
      subject: topic.parent?.name ?? '',
      chapter: topic.name,
      unit: saved.unit,
      source: saved.source,
      status: saved.status,
      hasOverview: Boolean(saved.overview?.trim()),
      updatedAt: saved.updatedAt,
    };
  }

  /** Subject + chapter list (slugs, names, units) without any student data. */
  async getSubjectOutline(subjectSlug: string): Promise<SubjectOutline> {
    const ctx = await this.loadContext(null);
    const subject = this.requireSubject(ctx, subjectSlug);
    return {
      subject: { slug: slugify(subject.topic.name), name: subject.topic.name },
      chapters: subject.chapters.map((chapter) => ({
        slug: slugify(chapter.topic.name),
        name: chapter.topic.name,
        unit: ctx.meta.get(chapter.topic.id)?.unit ?? null,
      })),
    };
  }

  private requireSubject(ctx: CatalogContext, slug: string): SubjectNode {
    const subject = findBySlug(
      ctx.tree.map((node) => ({ name: node.topic.name, node })),
      slug,
    )?.node;
    if (!subject) throw new NotFoundException('Subject not found.');
    return subject;
  }

  private buildChapter(
    ctx: CatalogContext,
    subject: SubjectNode,
    chapter: ChapterNode,
  ): BuiltChapter {
    const subjectName = subject.topic.name;
    const topics: CatalogTopicDetail[] = chapter.subtopics.map((subtopic) => {
      const key = scopeKey(subjectName, chapter.topic.name, subtopic.name);
      const progress: TopicProgress = topicProgress(
        ctx.states.get(key),
        tally(ctx.topicEvents.get(key) ?? []),
      );
      return {
        name: subtopic.name,
        status: progress.status,
        score: progress.score,
        answered: progress.answered,
        questionCount: ctx.questionCounts.get(key) ?? 0,
      };
    });
    // Pooled accuracy over all the chapter's answers (even ones whose topic is
    // not in the tree), identical to the chapter row on the analytics page.
    const progress = chapterProgress(
      topics,
      tally(ctx.chapterEvents.get(`${subjectName}|${chapter.topic.name}`) ?? [])
        .accuracy,
    );
    const meta = ctx.meta.get(chapter.topic.id);
    const published =
      meta?.status === ChapterMetaStatus.PUBLISHED && Boolean(meta.overview);

    return {
      topics,
      summary: {
        slug: slugify(chapter.topic.name),
        name: chapter.topic.name,
        subject: subjectName,
        subjectSlug: slugify(subjectName),
        unit: meta?.unit ?? null,
        topicCount: topics.length,
        topicPreview: topics.slice(0, TOPIC_PREVIEW_COUNT).map((t) => t.name),
        questionCount: topics.reduce((sum, t) => sum + t.questionCount, 0),
        difficulty: published ? (meta?.difficulty ?? null) : null,
        studyMinutes: published ? (meta?.studyMinutes ?? null) : null,
        hasMeta: published,
        ...progress,
      },
    };
  }

  /** `userId` null loads no per-student state (admin review). */
  private async loadContext(userId: string | null): Promise<CatalogContext> {
    const [rows, metaRows, countRows, stateRows, events] = await Promise.all([
      this.topics.find({
        where: {
          level: In([
            TopicLevel.SUBJECT,
            TopicLevel.CHAPTER,
            TopicLevel.SUB_TOPIC,
          ]),
        },
        relations: { parent: true },
        order: { createdAt: 'ASC', name: 'ASC' },
      }),
      this.chapterMeta.find(),
      this.questions
        .createQueryBuilder('question')
        .select('question.subject', 'subject')
        .addSelect('question.chapter', 'chapter')
        .addSelect('question.topic', 'topic')
        .addSelect('COUNT(*)', 'count')
        .where('question.status = :status', {
          status: QuestionPublicationStatus.PUBLISHED,
        })
        .groupBy('question.subject')
        .addGroupBy('question.chapter')
        .addGroupBy('question.topic')
        .getRawMany<{
          subject: string;
          chapter: string;
          topic: string;
          count: string;
        }>(),
      userId
        ? this.topicStates.find({ where: { userId } })
        : Promise.resolve([] as LearningTopicState[]),
      userId
        ? loadAnswerEvents(this.dataSource, userId, null, null)
        : Promise.resolve([] as AnswerEvent[]),
    ]);

    const chapterEvents = new Map<string, AnswerEvent[]>();
    const topicEvents = new Map<string, AnswerEvent[]>();
    for (const event of events) {
      const chapterKey = `${event.subject}|${event.chapter}`;
      chapterEvents.set(chapterKey, [
        ...(chapterEvents.get(chapterKey) ?? []),
        event,
      ]);
      const topicKey = scopeKey(event.subject, event.chapter, event.topic);
      topicEvents.set(topicKey, [...(topicEvents.get(topicKey) ?? []), event]);
    }

    const subjects = rows.filter((r) => r.level === TopicLevel.SUBJECT);
    const chaptersByParent = new Map<string, Topic[]>();
    const subtopicsByParent = new Map<string, Topic[]>();
    for (const row of rows) {
      const parentId = row.parent?.id;
      if (!parentId) continue;
      const bucket =
        row.level === TopicLevel.CHAPTER
          ? chaptersByParent
          : row.level === TopicLevel.SUB_TOPIC
            ? subtopicsByParent
            : null;
      bucket?.set(parentId, [...(bucket.get(parentId) ?? []), row]);
    }

    return {
      tree: subjects.map((subject) => ({
        topic: subject,
        chapters: (chaptersByParent.get(subject.id) ?? []).map((chapter) => ({
          topic: chapter,
          subtopics: subtopicsByParent.get(chapter.id) ?? [],
        })),
      })),
      meta: new Map(metaRows.map((m) => [m.topicId, m])),
      questionCounts: new Map(
        countRows.map((r) => [
          scopeKey(r.subject, r.chapter, r.topic),
          Number(r.count),
        ]),
      ),
      states: new Map(
        stateRows.map((s) => [scopeKey(s.subject, s.chapter, s.topic), s]),
      ),
      events,
      chapterEvents,
      topicEvents,
    };
  }
}
