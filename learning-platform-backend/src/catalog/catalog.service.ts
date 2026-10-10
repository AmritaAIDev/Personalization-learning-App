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
import { buildAliasResolver, type AliasResolver } from './catalog-aliases';
import { tally, type AnswerEvent } from './catalog.analytics';
import { findBySlug, slugify } from './catalog.slug';
import {
  COMPLETED_AT,
  chapterProgress,
  masteryLevel,
  countStatuses,
  rollUpLearningStatus,
  sumCounts,
  topicLearningStatus,
  topicProgress,
  type TopicProgress,
} from './catalog.progress';
import { includeForClass } from '../study-plan/plan-topics';
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
  PlanTopicRow,
  SyllabusProgress,
  SyllabusSubjectProgress,
} from './catalog.types';

const TOPIC_PREVIEW_COUNT = 4;

export interface SubjectOutline {
  subject: { slug: string; name: string };
  chapters: Array<{ slug: string; name: string; unit: string | null }>;
  /** Maps content-side chapter names (and alias URL slugs) onto these chapters. */
  aliases: AliasResolver;
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
  aliases: AliasResolver;
  /**
   * The chapter name a topic's questions are actually tagged with, for
   * /learn links (the learning engine matches questions by that exact name).
   */
  scopeChapters: Map<string, string>;
  /** Topics found in published questions, for chapters whose tree has none. */
  derivedTopics: Map<string, string[]>;
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

  /**
   * The one definition of "how much of the syllabus is done". Counts teachable
   * topics (those with a published question) and classifies each as Completed /
   * In Progress / Pending from the student's graded answers. The dashboard, the
   * Progress screen and the study plan all read this, so they cannot disagree.
   */
  async getSyllabusProgress(userId: string): Promise<SyllabusProgress> {
    const ctx = await this.loadContext(userId);
    const subjects = ctx.tree.map((subject): SyllabusSubjectProgress => {
      const chapters = subject.chapters.map((chapter) =>
        this.buildChapter(ctx, subject, chapter),
      );
      const teachable = chapters.flatMap((chapter) =>
        chapter.topics.filter((topic) => topic.questionCount > 0),
      );
      return {
        slug: slugify(subject.topic.name),
        name: subject.topic.name,
        chapters: chapters.length,
        comingSoonChapters: chapters.filter(
          (chapter) => chapter.summary.teachableTopics === 0,
        ).length,
        ...countStatuses(teachable.map((topic) => topic.learningStatus)),
      };
    });
    return { overall: sumCounts(subjects), subjects };
  }

  /**
   * Every teachable topic in syllabus order, with the student's status on it,
   * for the study planner. Uses the same topic list as the chapter pages, so a
   * chapter whose tree node has no sub-topics (Electrostatics) is still
   * planned from its questions' topics.
   */
  async getPlanTopics(userId: string): Promise<PlanTopicRow[]> {
    const ctx = await this.loadContext(userId);
    return ctx.tree.flatMap((subject) => {
      const chapters = subject.chapters
        .map((node, order) => ({
          node,
          order,
          meta: ctx.meta.get(node.topic.id),
          built: this.buildChapter(ctx, subject, node),
        }))
        // Class 11 chapters first, then Class 12; unknown level last; stable.
        .sort(
          (a, b) =>
            (a.meta?.classLevel ?? 99) - (b.meta?.classLevel ?? 99) ||
            a.order - b.order,
        );
      return chapters.flatMap(({ node, meta, built }) => {
        const teachable = built.topics.filter(
          (topic) => topic.questionCount > 0,
        );
        return teachable.map((topic) => ({
          subject: subject.topic.name,
          chapter: node.topic.name,
          scopeChapter: topic.scopeChapter,
          topic: topic.name,
          classLevel: meta?.classLevel ?? null,
          chapterMinutes: meta?.studyMinutes ?? null,
          chapterTopicCount: teachable.length,
          learningStatus: topic.learningStatus,
        }));
      });
    });
  }

  /**
   * Question-side chapter names that are taught in the other class, so a
   * Class 11 student's mock test can leave out Class 12 chapters (and the
   * reverse). Droppers, students with no class and chapters with no class
   * level yet are never excluded.
   */
  async getChaptersOutsideClass(
    userId: string,
    className: string | null,
  ): Promise<Set<string>> {
    if (className !== '11' && className !== '12') return new Set();
    const rows = await this.getPlanTopics(userId);
    return new Set(
      rows
        .filter((row) => !includeForClass(row.classLevel, className))
        .map((row) => row.scopeChapter),
    );
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
    const chapterNodes = subject.chapters.map((node) => ({
      name: node.topic.name,
      node,
    }));
    // A link built from the content-side name (e.g. the learning workspace
    // breadcrumb for "Electric Charges and Fields") resolves to its tree chapter.
    const aliasTarget = ctx.aliases.chapterForSlug(
      subject.topic.name,
      chapterSlug,
    );
    const chapter = (
      findBySlug(chapterNodes, chapterSlug) ??
      (aliasTarget ? findBySlug(chapterNodes, aliasTarget) : undefined)
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
      .andWhere('question.chapter IN (:...chapters)', {
        chapters: ctx.aliases.sources(subject.topic.name, chapter.topic.name),
      })
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
    const ctx = await this.loadContext(null, true);
    return ctx.tree.flatMap((subject) =>
      subject.chapters.map((chapter) => {
        const meta = ctx.meta.get(chapter.topic.id);
        return {
          topicId: chapter.topic.id,
          subject: subject.topic.name,
          chapter: chapter.topic.name,
          unit: meta?.unit ?? null,
          classLevel: meta?.classLevel ?? null,
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
        classLevel: null,
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
    if (dto.classLevel !== undefined) row.classLevel = dto.classLevel;
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
      dto.classLevel !== undefined ||
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
      classLevel: saved.classLevel,
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
      aliases: ctx.aliases,
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
    // Topics normally come from the tree. A chapter whose tree node has no
    // sub-topics (the older, name-aliased chapters) falls back to the topics its
    // published questions use, so it can still be studied from here.
    const topicNames =
      chapter.subtopics.length > 0
        ? chapter.subtopics.map((subtopic) => subtopic.name)
        : (ctx.derivedTopics.get(`${subjectName}|${chapter.topic.name}`) ?? []);
    const topics: CatalogTopicDetail[] = topicNames.map((topicName) => {
      const key = scopeKey(subjectName, chapter.topic.name, topicName);
      const progress: TopicProgress = topicProgress(
        ctx.states.get(key),
        tally(ctx.topicEvents.get(key) ?? []),
      );
      return {
        name: topicName,
        learningStatus: topicLearningStatus(progress),
        scopeChapter: ctx.scopeChapters.get(key) ?? chapter.topic.name,
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
    // Only topics with published questions can be studied, so only they count.
    const teachable = topics.filter((topic) => topic.questionCount > 0);

    return {
      topics,
      summary: {
        teachableTopics: teachable.length,
        completedTopics: teachable.filter(
          (topic) => topic.learningStatus === 'COMPLETED',
        ).length,
        learningStatus: rollUpLearningStatus(
          teachable.map((topic) => topic.learningStatus),
        ),
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

  /**
   * `userId` null loads no per-student state. `includeAll` keeps non-syllabus
   * tree nodes (only the admin review list wants those).
   */
  private async loadContext(
    userId: string | null,
    includeAll = false,
  ): Promise<CatalogContext> {
    const [rows, metaRows, countRows, stateRows, rawEvents] = await Promise.all(
      [
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
      ],
    );

    const subjects = rows.filter((r) => r.level === TopicLevel.SUBJECT);
    const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));
    const aliases = buildAliasResolver(
      rows
        .filter((r) => r.level === TopicLevel.CHAPTER && r.parent)
        .map((r) => ({
          subject: subjectNameById.get(r.parent?.id ?? '') ?? '',
          chapter: r.name,
        })),
    );

    // Everything content-side is folded onto its tree chapter name once, here,
    // so every later join is a plain exact-name lookup.
    const questionCounts = new Map<string, number>();
    const scopeChapters = new Map<string, string>();
    const scopeCounts = new Map<string, number>();
    const derived = new Map<string, Map<string, number>>();
    for (const r of countRows) {
      const chapter = aliases.canonical(r.subject, r.chapter);
      const key = scopeKey(r.subject, chapter, r.topic);
      const count = Number(r.count);
      questionCounts.set(key, (questionCounts.get(key) ?? 0) + count);
      // Remember the content-side chapter name holding most of this topic's
      // questions: /learn matches questions by that exact name.
      if (count > (scopeCounts.get(key) ?? 0)) {
        scopeCounts.set(key, count);
        scopeChapters.set(key, r.chapter);
      }
      const chapterKey = `${r.subject}|${chapter}`;
      const topicMap = derived.get(chapterKey) ?? new Map<string, number>();
      topicMap.set(r.topic, (topicMap.get(r.topic) ?? 0) + count);
      derived.set(chapterKey, topicMap);
    }
    const derivedTopics = new Map(
      [...derived].map(([chapterKey, topicMap]) => [
        chapterKey,
        [...topicMap]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([name]) => name),
      ]),
    );
    const states = new Map<string, LearningTopicState>();
    for (const s of stateRows) {
      const key = scopeKey(
        s.subject,
        aliases.canonical(s.subject, s.chapter),
        s.topic,
      );
      states.set(key, s);
      if (!scopeChapters.has(key)) scopeChapters.set(key, s.chapter);
    }
    const events = rawEvents.map((event) => ({
      ...event,
      chapter: aliases.canonical(event.subject, event.chapter),
      sourceChapter: event.chapter,
    }));

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

    const meta = new Map(metaRows.map((m) => [m.topicId, m]));
    // The tree can also hold leftover non-syllabus nodes (the dev demo seed's
    // "Units & Math", "Current Elec." ...). Students only browse chapters that
    // are part of the syllabus (have a study-guide row) or have real questions;
    // the admin review list (userId null) still shows every node.
    const isBrowsable = (subjectName: string, chapter: Topic) =>
      includeAll ||
      meta.has(chapter.id) ||
      derivedTopics.has(`${subjectName}|${chapter.name}`);

    return {
      tree: subjects.map((subject) => ({
        topic: subject,
        chapters: (chaptersByParent.get(subject.id) ?? [])
          .filter((chapter) => isBrowsable(subject.name, chapter))
          .map((chapter) => ({
            topic: chapter,
            subtopics: subtopicsByParent.get(chapter.id) ?? [],
          })),
      })),
      meta,
      questionCounts,
      states,
      aliases,
      scopeChapters,
      derivedTopics,
      events,
      chapterEvents,
      topicEvents,
    };
  }
}
