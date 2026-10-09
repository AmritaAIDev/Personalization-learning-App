import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LearningTopicStatus } from '../adaptive/adaptive.types';
import { TopicLevel, type Topic } from '../topics/topic.entity';
import { CatalogService } from './catalog.service';
import {
  ChapterDifficulty,
  ChapterMetaSource,
  ChapterMetaStatus,
  type ChapterMeta,
} from './chapter-meta.entity';

function topic(
  id: string,
  name: string,
  level: TopicLevel,
  parent?: Topic,
): Topic {
  return { id, name, level, parent: parent ?? null } as unknown as Topic;
}

const physics = topic('s1', 'Physics', TopicLevel.SUBJECT);
const optics = topic('c1', 'Optics', TopicLevel.CHAPTER, physics);
const waves = topic('c2', 'Waves', TopicLevel.CHAPTER, physics);
const rows: Topic[] = [
  physics,
  optics,
  waves,
  topic('t1', 'Lenses', TopicLevel.SUB_TOPIC, optics),
  topic('t2', 'Refraction', TopicLevel.SUB_TOPIC, optics),
  topic('t3', 'Doppler Effect', TopicLevel.SUB_TOPIC, waves),
];

function meta(overrides: Partial<ChapterMeta> = {}): ChapterMeta {
  return {
    topicId: 'c1',
    unit: 'Optics',
    overview: 'Light and lenses.',
    objectives: ['Use the lens formula'],
    keyFormulas: ['1/f = 1/v - 1/u'],
    difficulty: ChapterDifficulty.HARD,
    studyMinutes: 110,
    jeeWeightageNote: null,
    source: ChapterMetaSource.COMPASS_IMPORT,
    status: ChapterMetaStatus.PUBLISHED,
    updatedAt: new Date('2026-10-09T00:00:00Z'),
    ...overrides,
  } as ChapterMeta;
}

function chain<T>(result: T) {
  const qb: Record<string, jest.Mock> = {};
  for (const name of [
    'select',
    'addSelect',
    'where',
    'andWhere',
    'groupBy',
    'addGroupBy',
    'innerJoin',
  ]) {
    qb[name] = jest.fn().mockReturnValue(qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(result);
  qb.getCount = jest.fn().mockResolvedValue(result);
  return qb;
}

describe('CatalogService', () => {
  const topics = { find: jest.fn(), findOne: jest.fn() };
  const chapterMeta = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((v: unknown) => v),
    save: jest.fn((v: ChapterMeta) =>
      Promise.resolve({ ...v, updatedAt: new Date() }),
    ),
  };
  const topicStates = { find: jest.fn() };
  const questions = { createQueryBuilder: jest.fn() };
  const bookmarks = { createQueryBuilder: jest.fn() };
  const dataSource = { query: jest.fn() };

  /** Graded answer rows as the SQL returns them. */
  const answerRows = (
    chapter: string,
    topic: string,
    total: number,
    correct: number,
  ) =>
    Array.from({ length: total }, (_, index) => ({
      subject: 'Physics',
      chapter,
      topic,
      bloom: 'Apply',
      is_correct: index < correct,
      answered_at: '2026-10-06T09:00:00Z',
    }));
  let service: CatalogService;

  beforeEach(() => {
    jest.resetAllMocks();
    chapterMeta.create.mockImplementation((v: unknown) => v);
    chapterMeta.save.mockImplementation((v: ChapterMeta) =>
      Promise.resolve({ ...v, updatedAt: new Date() }),
    );
    topics.find.mockResolvedValue(rows);
    chapterMeta.find.mockResolvedValue([meta()]);
    topicStates.find.mockResolvedValue([
      {
        subject: 'Physics',
        chapter: 'Optics',
        topic: 'Lenses',
        status: LearningTopicStatus.ACTIVE,
      },
    ]);
    // 10 graded answers in Optics / Lenses, 8 of them correct -> 80%
    dataSource.query.mockResolvedValue(answerRows('Optics', 'Lenses', 10, 8));
    questions.createQueryBuilder.mockReturnValue(
      chain([
        { subject: 'Physics', chapter: 'Optics', topic: 'Lenses', count: '12' },
        {
          subject: 'Physics',
          chapter: 'Optics',
          topic: 'Refraction',
          count: '3',
        },
      ]),
    );
    bookmarks.createQueryBuilder.mockReturnValue(chain(2));
    service = new CatalogService(
      topics as never,
      chapterMeta as never,
      topicStates as never,
      questions as never,
      bookmarks as never,
      dataSource as never,
    );
  });

  it('summarises subjects with live progress and counts', async () => {
    const [subject] = await service.getSubjects('u1');
    expect(subject).toMatchObject({
      slug: 'physics',
      chapterCount: 2,
      chaptersStarted: 1,
      chaptersMastered: 1,
      chaptersCompleted: 1,
      mastery: { label: 'Master', stars: 5, next: null },
      topicCount: 3,
      questionCount: 15,
      averageScore: 80,
    });
  });

  it('lists chapters with units and student progress', async () => {
    const result = await service.getSubjectChapters('u1', 'PHYSICS');
    expect(result.units).toEqual([{ name: 'Optics', count: 1 }]);
    const optic = result.chapters.find((c) => c.slug === 'optics');
    expect(optic).toMatchObject({
      status: 'MASTERED',
      mastery: { label: 'Master', stars: 5 },
      score: 80,
      hasMeta: true,
      difficulty: ChapterDifficulty.HARD,
      topicPreview: ['Lenses', 'Refraction'],
      questionCount: 15,
    });
    const wave = result.chapters.find((c) => c.slug === 'waves');
    expect(wave).toMatchObject({
      status: 'NOT_STARTED',
      hasMeta: false,
      difficulty: null,
      studyMinutes: null,
    });
  });

  it('scores a practice-only student who has no adaptive learning state', async () => {
    topicStates.find.mockResolvedValue([]);
    dataSource.query.mockResolvedValue(
      answerRows('Waves', 'Doppler Effect', 4, 1),
    );
    const result = await service.getSubjectChapters('u1', 'physics');
    expect(result.chapters.find((c) => c.slug === 'waves')).toMatchObject({
      score: 25,
      status: 'NEEDS_WORK',
      startedTopics: 1,
      mastery: { label: 'Developing', stars: 2 },
    });
    const [subject] = await service.getSubjects('u1');
    expect(subject).toMatchObject({ averageScore: 25, chaptersCompleted: 0 });
    const detail = await service.getChapterDetail('u1', 'physics', 'waves');
    expect(detail.topics[0]).toMatchObject({
      status: 'ACTIVE',
      score: 25,
      answered: 4,
    });
  });

  it('counts chapter answers even when no sub-topic matches them', async () => {
    dataSource.query.mockResolvedValue(
      answerRows('Optics', 'Untracked topic', 5, 5),
    );
    const result = await service.getSubjectChapters('u1', 'physics');
    expect(result.chapters.find((c) => c.slug === 'optics')).toMatchObject({
      score: 100,
      status: 'MASTERED',
    });
  });

  it('loads no answers for the admin review list', async () => {
    await service.listChapterMetaForReview();
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('hides unpublished study guides from students', async () => {
    chapterMeta.find.mockResolvedValue([
      meta({ status: ChapterMetaStatus.DRAFT }),
    ]);
    const detail = await service.getChapterDetail('u1', 'physics', 'optics');
    expect(detail.meta).toBeNull();
    expect(detail.chapter.hasMeta).toBe(false);
    expect(detail.chapter.difficulty).toBeNull();
  });

  it('returns chapter detail with topics and bookmark count', async () => {
    const detail = await service.getChapterDetail('u1', 'physics', 'Optics');
    expect(detail.meta?.keyFormulas).toEqual(['1/f = 1/v - 1/u']);
    expect(detail.topics.map((t) => t.name)).toEqual(['Lenses', 'Refraction']);
    expect(detail.topics[0]).toMatchObject({ status: 'ACTIVE', score: 80 });
    expect(detail.bookmarkedCount).toBe(2);
  });

  it('404s for unknown subjects and chapters', async () => {
    await expect(service.getSubjectChapters('u1', 'biology')).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.getChapterDetail('u1', 'physics', 'nope'),
    ).rejects.toThrow(NotFoundException);
  });

  describe('updateChapterMeta', () => {
    beforeEach(() => {
      topics.findOne.mockResolvedValue(optics);
    });

    it('404s when the id is not a chapter', async () => {
      topics.findOne.mockResolvedValue(null);
      await expect(service.updateChapterMeta('c9', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('marks edited rows ADMIN-owned and trims lists', async () => {
      chapterMeta.findOne.mockResolvedValue(
        meta({ status: ChapterMetaStatus.DRAFT }),
      );
      const result = await service.updateChapterMeta('c1', {
        objectives: [' A ', 'A', '', 'B'],
        jeeWeightageNote: '  ',
      });
      const saved = chapterMeta.save.mock.calls[0][0] as ChapterMeta;
      expect(saved.objectives).toEqual(['A', 'B']);
      expect(saved.jeeWeightageNote).toBeNull();
      expect(result.source).toBe(ChapterMetaSource.ADMIN);
    });

    it('refuses to publish without an overview and an objective', async () => {
      chapterMeta.findOne.mockResolvedValue(null);
      await expect(
        service.updateChapterMeta('c1', {
          status: ChapterMetaStatus.PUBLISHED,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(chapterMeta.save).not.toHaveBeenCalled();
    });

    it('publishes once the content is complete', async () => {
      chapterMeta.findOne.mockResolvedValue(null);
      const result = await service.updateChapterMeta('c1', {
        overview: 'Optics overview',
        objectives: ['Do things'],
        status: ChapterMetaStatus.PUBLISHED,
      });
      expect(result.status).toBe(ChapterMetaStatus.PUBLISHED);
      expect(result.hasOverview).toBe(true);
    });

    it('does not let a published row be blanked out', async () => {
      chapterMeta.findOne.mockResolvedValue(meta());
      await expect(
        service.updateChapterMeta('c1', { overview: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lists chapters for admin review with their meta state', async () => {
      const list = await service.listChapterMetaForReview();
      expect(list).toHaveLength(2);
      expect(list.find((r) => r.chapter === 'Waves')).toMatchObject({
        status: null,
        hasOverview: false,
      });
      expect(topicStates.find).not.toHaveBeenCalled();
    });
  });
});
