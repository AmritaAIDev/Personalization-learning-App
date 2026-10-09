import {
  ChapterDifficulty,
  ChapterMetaSource,
  ChapterMetaStatus,
} from './chapter-meta.entity';
import {
  buildChapterMetaPlan,
  mergeCompassChapters,
} from './chapter-meta.plan';
import type {
  AuthoredChapterMeta,
  ChapterRef,
  CompassChapter,
} from './chapter-meta.types';

const compass = (
  overrides: Partial<CompassChapter> & { subjectId: string; chapterId: number },
): CompassChapter => ({
  name: `Chapter ${overrides.chapterId}`,
  unit: 'Unit',
  topics: ['T1'],
  overview: `Overview ${overrides.chapterId}`,
  objectives: ['obj a'],
  keyFormulas: ['F = ma'],
  difficulty: 'Medium',
  studyTimeMinutes: 60,
  ...overrides,
});

const ref = (subject: ChapterRef['subject'], chapter: string): ChapterRef => ({
  subject,
  chapter,
});

const authored = (
  chapter: string,
  subject: ChapterRef['subject'] = 'Physics',
): AuthoredChapterMeta => ({
  subject,
  chapter,
  overview: `${chapter} overview`,
  objectives: ['learn it'],
  keyFormulas: ['E = mc^2'],
  difficulty: 'Easy',
  studyMinutes: 30,
});

describe('mergeCompassChapters', () => {
  it('joins overviews, unions objectives/formulas in order, picks the hardest difficulty and sums study time', () => {
    const merged = mergeCompassChapters([
      compass({
        subjectId: 'physics',
        chapterId: 2,
        overview: 'Second',
        objectives: ['shared', 'b-only'],
        keyFormulas: ['x = 2'],
        difficulty: 'Hard',
        studyTimeMinutes: 80,
      }),
      compass({
        subjectId: 'physics',
        chapterId: 1,
        overview: 'First',
        objectives: ['shared', 'a-only'],
        keyFormulas: ['x = 1'],
        difficulty: 'Easy',
        studyTimeMinutes: 60,
      }),
    ]);
    // chapterId order (1 then 2), regardless of input order
    expect(merged.overview).toBe('First Second');
    expect(merged.objectives).toEqual(['shared', 'a-only', 'b-only']);
    expect(merged.keyFormulas).toEqual(['x = 1', 'x = 2']);
    expect(merged.difficulty).toBe(ChapterDifficulty.HARD);
    expect(merged.studyMinutes).toBe(140);
  });

  it('deduplicates identical overviews', () => {
    const same = compass({ subjectId: 'physics', chapterId: 1 });
    const merged = mergeCompassChapters([same, { ...same, chapterId: 2 }]);
    expect(merged.overview).toBe('Overview 1');
  });

  it('throws when given no chapters', () => {
    expect(() => mergeCompassChapters([])).toThrow(/at least one chapter/);
  });
});

describe('buildChapterMetaPlan', () => {
  const baseInput = () => ({
    ourChapters: [ref('Physics', 'Alpha'), ref('Physics', 'Beta')],
    compass: [] as CompassChapter[],
    compassMap: {} as Record<string, ChapterRef | null>,
    units: { 'Physics|Alpha': 'Mechanics', 'Physics|Beta': 'Mechanics' },
    authored: [] as AuthoredChapterMeta[],
  });

  it('marks compass-mapped chapters PUBLISHED with sorted source ids', () => {
    const input = {
      ...baseInput(),
      compass: [
        compass({ subjectId: 'physics', chapterId: 2 }),
        compass({ subjectId: 'physics', chapterId: 1 }),
      ],
      compassMap: {
        'physics:1': ref('Physics', 'Alpha'),
        'physics:2': ref('Physics', 'Alpha'),
      },
    };
    const { rows, report } = buildChapterMetaPlan(input);
    const alpha = rows.find((r) => r.chapter === 'Alpha');
    expect(alpha?.status).toBe(ChapterMetaStatus.PUBLISHED);
    expect(alpha?.source).toBe(ChapterMetaSource.COMPASS_IMPORT);
    expect(alpha?.compassSources).toEqual(['physics:1', 'physics:2']);
    expect(report.mergedTargets).toEqual([
      { target: 'Physics|Alpha', sources: ['physics:1', 'physics:2'] },
    ]);
    expect(report.fromCompass).toBe(1);
    expect(report.errors).toEqual([]);
  });

  it('writes authored chapters as AI_DRAFT/DRAFT and unmapped ones as unit-only', () => {
    const input = { ...baseInput(), authored: [authored('Beta')] };
    const { rows, report } = buildChapterMetaPlan(input);
    const beta = rows.find((r) => r.chapter === 'Beta');
    const alpha = rows.find((r) => r.chapter === 'Alpha');
    expect(beta?.source).toBe(ChapterMetaSource.AI_DRAFT);
    expect(beta?.status).toBe(ChapterMetaStatus.DRAFT);
    expect(beta?.overview).toContain('overview');
    expect(alpha?.overview).toBeNull();
    expect(report.unitOnly).toEqual(['Physics|Alpha']);
    expect(report.authored).toBe(1);
    expect(report.planned).toBe(2);
    expect(report.errors).toEqual([]);
  });

  it('records skipped compass chapters mapped to null', () => {
    const input = {
      ...baseInput(),
      compass: [
        compass({
          subjectId: 'chemistry',
          chapterId: 4,
          name: 'Surface Chemistry',
        }),
      ],
      compassMap: { 'chemistry:4': null },
    };
    const { report } = buildChapterMetaPlan(input);
    expect(report.skippedCompass).toEqual(['chemistry:4 Surface Chemistry']);
    expect(report.errors).toEqual([]);
  });

  it.each([
    [
      'unmapped compass chapter',
      (i: ReturnType<typeof baseInput>) => ({
        ...i,
        compass: [compass({ subjectId: 'physics', chapterId: 9 })],
      }),
    ],
    [
      'compass target that is not our chapter',
      (i: ReturnType<typeof baseInput>) => ({
        ...i,
        compass: [compass({ subjectId: 'physics', chapterId: 1 })],
        compassMap: { 'physics:1': ref('Physics', 'Ghost') },
      }),
    ],
    [
      'authored target that is not our chapter',
      (i: ReturnType<typeof baseInput>) => ({
        ...i,
        authored: [authored('Ghost')],
      }),
    ],
    [
      'duplicate authored entry',
      (i: ReturnType<typeof baseInput>) => ({
        ...i,
        authored: [authored('Beta'), authored('Beta')],
      }),
    ],
    [
      'authored conflicting with compass data',
      (i: ReturnType<typeof baseInput>) => ({
        ...i,
        compass: [compass({ subjectId: 'physics', chapterId: 1 })],
        compassMap: { 'physics:1': ref('Physics', 'Beta') },
        authored: [authored('Beta')],
      }),
    ],
    [
      'missing unit',
      (i: ReturnType<typeof baseInput>) => ({
        ...i,
        units: { 'Physics|Alpha': 'Mechanics' },
      }),
    ],
  ])('reports an error for %s', (_label, mutate) => {
    const { report } = buildChapterMetaPlan(mutate(baseInput()));
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]).toMatch(/./);
  });

  it('survives a full round with clean fixtures', () => {
    const { rows, report } = buildChapterMetaPlan(baseInput());
    expect(rows).toHaveLength(2);
    expect(report.errors).toEqual([]);
    expect(report.fromCompass).toBe(0);
  });
});
