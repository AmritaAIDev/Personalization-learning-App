import {
  buildChapterAnalytics,
  buildSubjectAnalytics,
  normalizeBloom,
  skillBand,
  weekStart,
  weeklyTrend,
  type AnswerEvent,
  type OutlineChapter,
} from './catalog.analytics';

const NOW = new Date('2026-10-09T10:00:00Z'); // a Friday; its Monday is 2026-10-05

const ev = (
  chapter: string,
  topic: string,
  bloom: string | null,
  isCorrect: boolean,
  at = '2026-10-06T09:00:00Z',
): AnswerEvent => ({
  subject: 'Physics',
  chapter,
  topic,
  bloom,
  isCorrect,
  answeredAt: new Date(at),
});

const OUTLINE: OutlineChapter[] = [
  { slug: 'optics', name: 'Optics', unit: 'Optics' },
  { slug: 'waves', name: 'Waves', unit: 'Oscillations & Waves' },
  { slug: 'kinematics', name: 'Kinematics', unit: 'Mechanics' },
];

/**
 * Hand-calculated dataset:
 *   Optics  - Lenses:     Remember T, Remember T, Understand F
 *             Refraction: Apply F, Apply F, Analyze T
 *   Waves   - Doppler:    Remember T (last week), Apply T
 *   (+ a Gravitation answer that is outside this subject's outline)
 */
const EVENTS: AnswerEvent[] = [
  ev('Optics', 'Lenses', 'Remember', true),
  ev('Optics', 'Lenses', 'remember', true), // case-insensitive
  ev('Optics', 'Lenses', 'Understand', false),
  ev('Optics', 'Refraction', 'Apply', false),
  ev('Optics', 'Refraction', 'Apply', false),
  ev('Optics', 'Refraction', 'Analyze', true),
  ev('Waves', 'Doppler Effect', 'Remember', true, '2026-09-29T09:00:00Z'),
  ev('Waves', 'Doppler Effect', 'Apply', true, '2026-10-08T09:00:00Z'),
  ev('Gravitation', 'Orbits', 'Apply', false),
];

const SUBJECT = { slug: 'physics', name: 'Physics' };

describe('buildSubjectAnalytics', () => {
  const result = buildSubjectAnalytics(SUBJECT, OUTLINE, EVENTS, NOW);

  it('ignores answers from chapters outside the subject outline', () => {
    expect(result.overall).toEqual({ answered: 8, correct: 5, accuracy: 63 });
  });

  it('splits recall (Remember+Understand) from application (the rest)', () => {
    expect(result.recall).toEqual({ answered: 4, correct: 3, accuracy: 75 });
    expect(result.application).toEqual({
      answered: 4,
      correct: 2,
      accuracy: 50,
    });
  });

  it('reports the four Compass Bloom levels with bands and mastery', () => {
    expect(result.bloom.map((b) => b.level)).toEqual([
      'Remember',
      'Understand',
      'Apply',
      'Analyze',
    ]);
    const byLevel = Object.fromEntries(result.bloom.map((b) => [b.level, b]));
    expect(byLevel.Remember).toMatchObject({
      answered: 3,
      correct: 3,
      accuracy: 100,
      band: 'Strong',
    });
    expect(byLevel.Remember.mastery?.label).toBe('Master');
    expect(byLevel.Understand).toMatchObject({ accuracy: 0, band: 'Weak' });
    expect(byLevel.Apply).toMatchObject({ accuracy: 33, band: 'Weak' });
    expect(byLevel.Analyze).toMatchObject({ accuracy: 100, band: 'Strong' });
  });

  it('derives Compass insight cards from the Bloom spread', () => {
    expect(result.insights).toEqual({
      strongestBloom: { level: 'Remember', accuracy: 100 }, // ties keep the earlier level
      weakestBloom: { level: 'Understand', accuracy: 0 },
      focus: 'Practice more Understand level questions',
      tip: 'Focus on Apply level questions to boost your score.', // 63% is in 40-69
    });
  });

  it('gives each skill card its detail and Compass tip', () => {
    const skills = Object.fromEntries(result.skills.map((s) => [s.key, s]));
    expect(skills.accuracy).toMatchObject({
      accuracy: 63,
      detail: '5/8 correct',
      tip: 'Strong accuracy — aim for 80%+.',
    });
    expect(skills.recall).toMatchObject({
      accuracy: 75,
      detail: '3/4 recall questions',
      tip: 'Good recall! Try harder derivations.',
    });
    expect(skills.application).toMatchObject({
      accuracy: 50,
      detail: '2/4 application questions',
      tip: 'Solve 5 application problems daily.',
    });
  });

  it('computes mastery from overall accuracy', () => {
    expect(result.mastery).toEqual({
      label: 'Advanced',
      stars: 4,
      next: { label: 'Master', pointsNeeded: 17 },
    });
  });

  it('lists every outline chapter, with null (not 0%) where nothing was answered', () => {
    expect(result.chapters.map((c) => [c.slug, c.accuracy])).toEqual([
      ['optics', 50],
      ['waves', 100],
      ['kinematics', null],
    ]);
    expect(result.chaptersCompleted).toBe(2);
  });

  it('rolls chapters up into units for the radar', () => {
    expect(result.units).toEqual([
      { name: 'Optics', chapters: 1, answered: 6, correct: 3, accuracy: 50 },
      {
        name: 'Oscillations & Waves',
        chapters: 1,
        answered: 2,
        correct: 2,
        accuracy: 100,
      },
      {
        name: 'Mechanics',
        chapters: 1,
        answered: 0,
        correct: 0,
        accuracy: null,
      },
    ]);
  });

  it('picks strong (70+) and weak (<50) topics with chapter links', () => {
    expect(result.strongTopics).toEqual([
      {
        chapter: 'Waves',
        chapterSlug: 'waves',
        scopeChapter: 'Waves',
        topic: 'Doppler Effect',
        answered: 2,
        correct: 2,
        accuracy: 100,
      },
    ]);
    // Lenses is 67% (neither); Refraction is 33% (weak)
    expect(result.weakTopics.map((t) => [t.topic, t.accuracy])).toEqual([
      ['Refraction', 33],
    ]);
  });

  it('buckets answers into the last 8 weeks, oldest first', () => {
    expect(result.trend).toHaveLength(8);
    const last = result.trend[7];
    expect(last).toEqual({
      weekStart: '2026-10-05',
      answered: 7,
      correct: 4,
      accuracy: 57,
    });
    expect(result.trend[6]).toEqual({
      weekStart: '2026-09-28',
      answered: 1,
      correct: 1,
      accuracy: 100,
    });
    expect(result.trend[0]).toMatchObject({ answered: 0, accuracy: null });
  });

  it('has guidance-friendly empty output for a student with no answers', () => {
    const empty = buildSubjectAnalytics(SUBJECT, OUTLINE, [], NOW);
    expect(empty.hasData).toBe(false);
    expect(empty.overall.accuracy).toBeNull();
    expect(empty.mastery).toBeNull();
    expect(empty.insights).toEqual({
      strongestBloom: null,
      weakestBloom: null,
      focus: null,
      tip: null,
    });
    expect(
      empty.skills.every((s) => s.accuracy === null && s.tip === null),
    ).toBe(true);
    expect(empty.chaptersCompleted).toBe(0);
    expect(empty.strongTopics).toEqual([]);
    expect(empty.trend.every((p) => p.accuracy === null)).toBe(true);
  });

  it('does not repeat the strongest level as the weakest when only one level has data', () => {
    const single = buildSubjectAnalytics(
      SUBJECT,
      OUTLINE,
      [ev('Optics', 'Lenses', 'Apply', true)],
      NOW,
    );
    expect(single.insights.strongestBloom).toEqual({
      level: 'Apply',
      accuracy: 100,
    });
    expect(single.insights.weakestBloom).toBeNull();
    expect(single.insights.focus).toBeNull();
  });
});

describe('buildSubjectAnalytics with aliased chapters', () => {
  it('links topics back to the chapter name the questions are tagged with', () => {
    const aliased: AnswerEvent[] = [
      {
        ...ev('Electrostatics', "Gauss's Law", 'Apply', true),
        sourceChapter: 'Electric Charges and Fields',
      },
      {
        ...ev('Electrostatics', "Gauss's Law", 'Apply', true),
        sourceChapter: 'Electric Charges and Fields',
      },
    ];
    const result = buildSubjectAnalytics(
      SUBJECT,
      [
        {
          slug: 'electrostatics',
          name: 'Electrostatics',
          unit: 'Electrostatics',
        },
      ],
      aliased,
      NOW,
    );
    expect(result.strongTopics).toEqual([
      expect.objectContaining({
        chapter: 'Electrostatics',
        chapterSlug: 'electrostatics',
        scopeChapter: 'Electric Charges and Fields',
        topic: "Gauss's Law",
      }),
    ]);
  });
});

describe('buildChapterAnalytics', () => {
  it('summarises only the events it is given', () => {
    const optics = buildChapterAnalytics(
      EVENTS.filter((e) => e.chapter === 'Optics'),
    );
    expect(optics.overall).toEqual({ answered: 6, correct: 3, accuracy: 50 });
    expect(optics.hasData).toBe(true);
    expect(optics.insights.tip).toBe(
      'Focus on Apply level questions to boost your score.',
    );
  });

  it('counts an unclassified or Evaluate answer as application, not recall', () => {
    const result = buildChapterAnalytics([
      ev('Optics', 'Lenses', null, true),
      ev('Optics', 'Lenses', 'Evaluate', false),
    ]);
    expect(result.recall.answered).toBe(0);
    expect(result.application).toEqual({
      answered: 2,
      correct: 1,
      accuracy: 50,
    });
    expect(result.bloom.every((b) => b.answered === 0)).toBe(true);
  });
});

describe('helpers', () => {
  it('skillBand uses the Compass 70 / 40 cut-offs', () => {
    expect(skillBand(null)).toBeNull();
    expect(skillBand(70)).toBe('Strong');
    expect(skillBand(69)).toBe('Average');
    expect(skillBand(40)).toBe('Average');
    expect(skillBand(39)).toBe('Weak');
  });

  it('normalizeBloom is case-insensitive and rejects unknown levels', () => {
    expect(normalizeBloom(' analyze ')).toBe('Analyze');
    expect(normalizeBloom('Evaluate')).toBeNull();
    expect(normalizeBloom(null)).toBeNull();
  });

  it('weekStart returns the Monday 00:00 UTC of the week', () => {
    expect(weekStart(new Date('2026-10-11T23:59:59Z')).toISOString()).toBe(
      '2026-10-05T00:00:00.000Z',
    ); // Sunday
    expect(weekStart(new Date('2026-10-05T00:00:00Z')).toISOString()).toBe(
      '2026-10-05T00:00:00.000Z',
    ); // Monday
  });

  it('weeklyTrend honours the requested number of weeks', () => {
    expect(weeklyTrend([], NOW, 3)).toHaveLength(3);
  });
});
