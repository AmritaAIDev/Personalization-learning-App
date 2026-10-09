import type { PlanTopicRow } from '../catalog/catalog.types';
import { includeForClass, selectTopicsToPlan, topicKey } from './plan-topics';

function row(overrides: Partial<PlanTopicRow> = {}): PlanTopicRow {
  return {
    subject: 'Physics',
    chapter: 'Optics',
    scopeChapter: 'Optics',
    topic: 'Lenses',
    classLevel: 12,
    chapterMinutes: 90,
    chapterTopicCount: 3,
    learningStatus: 'PENDING',
    ...overrides,
  };
}

describe('includeForClass', () => {
  it.each([
    [11, '11', true],
    [12, '11', false],
    [12, '12', true],
    [11, '12', false],
    [11, 'Dropper', true],
    [12, 'Dropper', true],
    [11, null, true],
    [12, null, true],
  ])('class level %s for a %s student -> %s', (level, className, expected) => {
    expect(includeForClass(level, className)).toBe(expected);
  });

  it('never hides a chapter that has no class level yet', () => {
    for (const className of ['11', '12', 'Dropper', null]) {
      expect(includeForClass(null, className)).toBe(true);
    }
  });
});

describe('selectTopicsToPlan', () => {
  const rows = [
    row({ topic: 'A', classLevel: 11 }),
    row({ topic: 'B', classLevel: 12 }),
    row({ topic: 'C', classLevel: 12, learningStatus: 'COMPLETED' }),
    row({ topic: 'D', classLevel: 12, learningStatus: 'IN_PROGRESS' }),
    row({ topic: 'E', classLevel: null }),
  ];

  it('drops topics the student has already completed through their answers', () => {
    const names = selectTopicsToPlan(rows, 'Dropper', new Set()).map(
      (t) => t.topic,
    );
    expect(names).toEqual(['A', 'B', 'D', 'E']);
  });

  it('applies the class filter and keeps the given order', () => {
    expect(
      selectTopicsToPlan(rows, '11', new Set()).map((t) => t.topic),
    ).toEqual(['A', 'E']);
    expect(
      selectTopicsToPlan(rows, '12', new Set()).map((t) => t.topic),
    ).toEqual(['B', 'D', 'E']);
  });

  it('skips topics already ticked off in the plan being rebuilt', () => {
    const done = new Set([topicKey('Physics', 'Optics', 'B')]);
    expect(
      selectTopicsToPlan(rows, 'Dropper', done).map((t) => t.topic),
    ).toEqual(['A', 'D', 'E']);
  });

  it('carries everything the planner needs, including the content-side chapter name', () => {
    const [planned] = selectTopicsToPlan(
      [
        row({
          chapter: 'Electrostatics',
          scopeChapter: 'Electric Charges and Fields',
          topic: "Gauss's Law",
          chapterMinutes: 120,
          chapterTopicCount: 4,
        }),
      ],
      null,
      new Set(),
    );
    expect(planned).toEqual({
      subject: 'Physics',
      chapter: 'Electrostatics',
      scopeChapter: 'Electric Charges and Fields',
      topic: "Gauss's Law",
      chapterMinutes: 120,
      chapterTopicCount: 4,
    });
  });
});
