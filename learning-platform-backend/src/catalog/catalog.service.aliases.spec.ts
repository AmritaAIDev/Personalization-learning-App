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

function meta(overrides: Partial<ChapterMeta> = {}): ChapterMeta {
  return {
    topicId: 'c1',
    unit: 'Electrostatics',
    overview: 'Charges and fields.',
    objectives: ['State Coulomb law'],
    keyFormulas: [],
    difficulty: ChapterDifficulty.MEDIUM,
    studyMinutes: 90,
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

const physicsNode = topic('s1', 'Physics', TopicLevel.SUBJECT);
const electrostatics = topic(
  'c1',
  'Electrostatics',
  TopicLevel.CHAPTER,
  physicsNode,
);
// a leftover node from the dev demo seed: no study guide, no questions
const demoNode = topic('c9', 'Units & Math', TopicLevel.CHAPTER, physicsNode);

const questionRow = (chapter: string, topicName: string, count: number) => ({
  subject: 'Physics',
  chapter,
  topic: topicName,
  count: String(count),
});

const answer = (chapter: string, topicName: string, isCorrect: boolean) => ({
  subject: 'Physics',
  chapter,
  topic: topicName,
  bloom: 'Apply',
  is_correct: isCorrect,
  answered_at: '2026-10-06T09:00:00Z',
});

interface BuildOptions {
  tree?: Topic[];
  meta?: ChapterMeta[];
  questionRows?: Array<ReturnType<typeof questionRow>>;
  stateRows?: unknown[];
  answers?: Array<ReturnType<typeof answer>>;
}

function build(options: BuildOptions = {}) {
  const bookmarkChain = chain(0);
  const service = new CatalogService(
    {
      find: jest
        .fn()
        .mockResolvedValue(options.tree ?? [physicsNode, electrostatics]),
    } as never,
    {
      find: jest.fn().mockResolvedValue(options.meta ?? [meta()]),
    } as never,
    { find: jest.fn().mockResolvedValue(options.stateRows ?? []) } as never,
    {
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(chain(options.questionRows ?? [])),
    } as never,
    { createQueryBuilder: jest.fn().mockReturnValue(bookmarkChain) } as never,
    { query: jest.fn().mockResolvedValue(options.answers ?? []) } as never,
  );
  return { service, bookmarkChain };
}

describe('CatalogService: syllabus filtering', () => {
  it('hides leftover non-syllabus tree nodes from students but not from the admin list', async () => {
    const { service } = build({
      tree: [physicsNode, electrostatics, demoNode],
    });
    const student = await service.getSubjectChapters('u1', 'physics');
    expect(student.chapters.map((c) => c.name)).toEqual(['Electrostatics']);
    const admin = await service.listChapterMetaForReview();
    expect(admin.map((r) => r.chapter)).toEqual([
      'Electrostatics',
      'Units & Math',
    ]);
  });

  it('keeps a non-syllabus node visible once it has real published questions', async () => {
    const { service } = build({
      tree: [physicsNode, electrostatics, demoNode],
      questionRows: [questionRow('Units & Math', 'Vectors', 4)],
    });
    const result = await service.getSubjectChapters('u1', 'physics');
    expect(result.chapters.map((c) => c.name)).toEqual([
      'Electrostatics',
      'Units & Math',
    ]);
  });

  it('keeps the outline used by analytics free of the demo nodes too', async () => {
    const { service } = build({
      tree: [physicsNode, electrostatics, demoNode],
    });
    const outline = await service.getSubjectOutline('physics');
    expect(outline.chapters.map((c) => c.name)).toEqual(['Electrostatics']);
  });
});

describe('CatalogService: content tagged with the NCERT chapter names', () => {
  const questionRows = [
    questionRow('Electric Charges and Fields', "Gauss's Law", 7),
    questionRow('Electric Charges and Fields', "Coulomb's Law", 3),
    questionRow('Electrostatic Potential and Capacitance', 'Capacitors', 5),
  ];
  const answers = [
    answer('Electric Charges and Fields', "Gauss's Law", true),
    answer('Electric Charges and Fields', "Gauss's Law", true),
    answer('Electrostatic Potential and Capacitance', 'Capacitors', false),
    answer('Electrostatic Potential and Capacitance', 'Capacitors', true),
  ];

  it('folds questions, answers and progress onto the Electrostatics chapter', async () => {
    const { service } = build({ questionRows, answers });
    const { chapters } = await service.getSubjectChapters('u1', 'physics');
    expect(chapters).toHaveLength(1);
    expect(chapters[0]).toMatchObject({
      name: 'Electrostatics',
      questionCount: 15,
      topicCount: 3,
      score: 75, // 3 of 4 answers correct, across both aliased names
      status: 'MASTERED',
    });
  });

  it('lists the topics found in the questions when the tree chapter has none, linked to where the questions live', async () => {
    const { service } = build({ questionRows, answers });
    const detail = await service.getChapterDetail(
      'u1',
      'physics',
      'electrostatics',
    );
    expect(
      detail.topics.map((t) => [t.name, t.scopeChapter, t.questionCount]),
    ).toEqual([
      ["Gauss's Law", 'Electric Charges and Fields', 7],
      ['Capacitors', 'Electrostatic Potential and Capacitance', 5],
      ["Coulomb's Law", 'Electric Charges and Fields', 3],
    ]);
    expect(detail.topics[0]).toMatchObject({ status: 'ACTIVE', score: 100 });
  });

  it('opens the chapter from the content-side URL slug, e.g. a workspace breadcrumb', async () => {
    const { service } = build({ questionRows, answers });
    const detail = await service.getChapterDetail(
      'u1',
      'physics',
      'electric-charges-and-fields',
    );
    expect(detail.chapter.name).toBe('Electrostatics');
  });

  it('counts bookmarks under every name that folds into the chapter', async () => {
    const { service, bookmarkChain } = build({ questionRows, answers });
    await service.getChapterDetail('u1', 'physics', 'electrostatics');
    expect(bookmarkChain.andWhere).toHaveBeenCalledWith(
      'question.chapter IN (:...chapters)',
      {
        chapters: [
          'Electrostatics',
          'Electric Charges and Fields',
          'Electrostatic Potential and Capacitance',
        ],
      },
    );
  });

  it('uses the tree sub-topics when it has them and does not add derived ones', async () => {
    const lawTopic = topic(
      't1',
      "Gauss's Law",
      TopicLevel.SUB_TOPIC,
      electrostatics,
    );
    const { service } = build({
      tree: [physicsNode, electrostatics, lawTopic],
      questionRows,
      answers,
    });
    const detail = await service.getChapterDetail(
      'u1',
      'physics',
      'electrostatics',
    );
    expect(detail.topics.map((t) => t.name)).toEqual(["Gauss's Law"]);
    expect(detail.topics[0].scopeChapter).toBe('Electric Charges and Fields');
  });

  it('does not fold anything once the tree has a real chapter of that name', async () => {
    const real = topic(
      'c5',
      'Electric Charges and Fields',
      TopicLevel.CHAPTER,
      physicsNode,
    );
    const { service } = build({
      tree: [physicsNode, electrostatics, real],
      meta: [
        meta({ topicId: 'c1' }),
        meta({ topicId: 'c5', unit: 'Electrostatics' }),
      ],
      questionRows,
      answers,
    });
    const { chapters } = await service.getSubjectChapters('u1', 'physics');
    const byName = Object.fromEntries(chapters.map((c) => [c.name, c]));
    expect(byName['Electric Charges and Fields'].questionCount).toBe(10);
    // Electrostatics only absorbs the alias that is still unmatched
    expect(byName['Electrostatics'].questionCount).toBe(5);
  });
});

describe('CatalogService: getSyllabusProgress', () => {
  const optics = topic('c2', 'Optics', TopicLevel.CHAPTER, physicsNode);
  const waves = topic('c3', 'Waves', TopicLevel.CHAPTER, physicsNode);
  const tree = [
    physicsNode,
    electrostatics, // no sub-topics: topics come from its questions
    optics,
    topic('t1', 'Lenses', TopicLevel.SUB_TOPIC, optics),
    topic('t2', 'Refraction', TopicLevel.SUB_TOPIC, optics),
    waves,
    topic('t3', 'Doppler', TopicLevel.SUB_TOPIC, waves), // no questions yet
  ];
  const metaRows = [
    meta({ topicId: 'c1' }),
    meta({ topicId: 'c2', unit: 'Optics' }),
    meta({ topicId: 'c3', unit: 'Waves' }),
  ];
  const questionRows = [
    questionRow('Electric Charges and Fields', 'Gauss Law', 7),
    questionRow('Electric Charges and Fields', 'Coulomb Law', 3),
    questionRow('Optics', 'Lenses', 5),
    questionRow('Optics', 'Refraction', 5),
  ];
  const answers = [
    // Gauss Law: 5 answers, all correct -> Completed
    ...Array.from({ length: 5 }, () =>
      answer('Electric Charges and Fields', 'Gauss Law', true),
    ),
    // Lenses: 2 answers -> In Progress (too little evidence to complete)
    answer('Optics', 'Lenses', true),
    answer('Optics', 'Lenses', true),
  ];

  it('counts only teachable topics and classifies each from the answers', async () => {
    const { service } = build({ tree, meta: metaRows, questionRows, answers });
    const progress = await service.getSyllabusProgress('u1');
    expect(progress.overall).toEqual({
      total: 4, // Gauss, Coulomb, Lenses, Refraction (Doppler has no questions)
      completed: 1,
      inProgress: 1,
      pending: 2,
      percent: 25,
    });
    expect(progress.subjects).toHaveLength(1);
    expect(progress.subjects[0]).toMatchObject({
      slug: 'physics',
      chapters: 3,
      comingSoonChapters: 1, // Waves
      total: 4,
      completed: 1,
      percent: 25,
    });
  });

  it('scores a practice-only student with no learning state (never Pending)', async () => {
    const { service } = build({ tree, meta: metaRows, questionRows, answers });
    const detail = await service.getChapterDetail('u1', 'physics', 'optics');
    expect(detail.chapter).toMatchObject({
      teachableTopics: 2,
      completedTopics: 0,
      learningStatus: 'IN_PROGRESS',
    });
    expect(
      Object.fromEntries(detail.topics.map((t) => [t.name, t.learningStatus])),
    ).toEqual({ Lenses: 'IN_PROGRESS', Refraction: 'PENDING' });
  });

  it('rolls an Electrostatics chapter built from aliased questions up correctly', async () => {
    const { service } = build({ tree, meta: metaRows, questionRows, answers });
    const detail = await service.getChapterDetail(
      'u1',
      'physics',
      'electrostatics',
    );
    expect(detail.chapter).toMatchObject({
      teachableTopics: 2,
      completedTopics: 1,
      learningStatus: 'IN_PROGRESS',
    });
  });

  it('is zero everywhere for a brand-new student, without dividing by zero', async () => {
    const { service } = build({ tree, meta: metaRows, questionRows });
    const progress = await service.getSyllabusProgress('u1');
    expect(progress.overall).toMatchObject({
      total: 4,
      completed: 0,
      inProgress: 0,
      pending: 4,
      percent: 0,
    });
  });

  it('reports 0 of 0 when nothing is teachable yet', async () => {
    const { service } = build({ tree, meta: metaRows });
    const progress = await service.getSyllabusProgress('u1');
    expect(progress.overall).toEqual({
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      percent: 0,
    });
    expect(progress.subjects[0].comingSoonChapters).toBe(3);
  });
});
