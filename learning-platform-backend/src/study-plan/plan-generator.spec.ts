import {
  estimateTopicMinutes,
  generatePlan,
  type GenerateInput,
  type PlanTopic,
} from './plan-generator';

let counter = 0;
function topic(
  subject: string,
  chapter: string,
  overrides: Partial<PlanTopic> = {},
): PlanTopic {
  counter += 1;
  return {
    subject,
    chapter,
    scopeChapter: chapter,
    topic: `${chapter} topic ${counter}`,
    chapterMinutes: 90,
    chapterTopicCount: 3, // 30 minutes each
    ...overrides,
  };
}

const input = (
  topics: PlanTopic[],
  overrides: Partial<GenerateInput> = {},
): GenerateInput => ({
  topics,
  startDate: '2026-10-09',
  endDate: '2026-10-31',
  dailyMinutes: 120,
  ...overrides,
});

describe('estimateTopicMinutes', () => {
  const est = (
    chapterMinutes: number | null,
    chapterTopicCount: number,
    daily = 120,
  ) => estimateTopicMinutes({ chapterMinutes, chapterTopicCount }, daily);

  it("splits the chapter's study time across its topics, rounded to 5", () => {
    expect(est(90, 3)).toBe(30);
    expect(est(100, 3)).toBe(35); // 33.3 -> 35
    expect(est(85, 4)).toBe(20); // 21.25 -> 20
  });

  it('uses 30 minutes when the chapter time or topic count is unknown', () => {
    expect(est(null, 3)).toBe(30);
    expect(est(90, 0)).toBe(30);
    expect(est(0, 3)).toBe(30);
  });

  it('keeps every topic between 15 and 90 minutes', () => {
    expect(est(30, 6)).toBe(15); // 5 -> 15
    expect(est(600, 2)).toBe(90); // 300 -> 90
  });

  it("never exceeds one day's budget, so every topic fits somewhere", () => {
    expect(est(600, 2, 45)).toBe(45);
    expect(est(600, 2, 30)).toBe(30);
  });
});

describe('generatePlan', () => {
  it('plans nothing, with no warning, when there is nothing left to study', () => {
    expect(generatePlan(input([]))).toEqual({
      tasks: [],
      paceWarning: false,
      requiredMinutesPerDay: 0,
      totalMinutes: 0,
      days: 23,
      unplacedTopics: 0,
    });
  });

  it('places every topic exactly once, inside the date range, within the daily budget', () => {
    const topics = [
      ...Array.from({ length: 4 }, () => topic('Physics', 'Optics')),
      ...Array.from({ length: 4 }, () => topic('Chemistry', 'Solutions')),
      ...Array.from({ length: 4 }, () => topic('Mathematics', 'Vectors')),
    ];
    const plan = generatePlan(input(topics));
    expect(plan.paceWarning).toBe(false);
    expect(plan.tasks).toHaveLength(12);
    expect(new Set(plan.tasks.map((t) => t.topic)).size).toBe(12);
    for (const task of plan.tasks) {
      expect(task.date >= '2026-10-09' && task.date <= '2026-10-31').toBe(true);
    }
    const load = new Map<string, number>();
    for (const task of plan.tasks) {
      load.set(task.date, (load.get(task.date) ?? 0) + task.estMinutes);
    }
    for (const minutes of load.values()) {
      expect(minutes).toBeLessThanOrEqual(120);
    }
  });

  it('studies one subject per day and rotates between subjects', () => {
    const topics = [
      ...Array.from({ length: 3 }, () => topic('Physics', 'Optics')),
      ...Array.from({ length: 3 }, () => topic('Chemistry', 'Solutions')),
      ...Array.from({ length: 3 }, () => topic('Mathematics', 'Vectors')),
    ];
    const plan = generatePlan(input(topics, { endDate: '2026-10-20' }));
    const subjectsByDate = new Map<string, Set<string>>();
    for (const task of plan.tasks) {
      const set = subjectsByDate.get(task.date) ?? new Set<string>();
      set.add(task.subject);
      subjectsByDate.set(task.date, set);
    }
    for (const subjects of subjectsByDate.values()) {
      expect(subjects.size).toBe(1);
    }
    const order = [...subjectsByDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, subjects]) => [...subjects][0]);
    expect(order.slice(0, 3)).toEqual(['Physics', 'Chemistry', 'Mathematics']);
  });

  it("keeps each subject's topics in the order given", () => {
    const physics = Array.from({ length: 8 }, () => topic('Physics', 'Optics'));
    const plan = generatePlan(input(physics));
    const dates = plan.tasks.map((task) => task.date);
    expect(dates).toEqual([...dates].sort());
    expect(plan.tasks.map((t) => t.topic)).toEqual(physics.map((t) => t.topic));
  });

  it('fills a day to the budget but never splits a topic', () => {
    // 4 topics x 30 min with a 100 min budget: 3 fit (90), the 4th goes next day
    const topics = Array.from({ length: 4 }, () => topic('Physics', 'Optics'));
    const plan = generatePlan(input(topics, { dailyMinutes: 100 }));
    expect(plan.tasks.filter((t) => t.date === '2026-10-09')).toHaveLength(3);
    expect(plan.tasks.filter((t) => t.date === '2026-10-10')).toHaveLength(1);
  });

  it('warns when the work cannot fit, says what would fit, and still drops nothing', () => {
    const topics = Array.from({ length: 30 }, () =>
      topic('Physics', 'Mechanics'),
    ); // 900 minutes
    const plan = generatePlan(
      input(topics, { startDate: '2026-10-25', endDate: '2026-10-31' }),
    ); // 7 days x 120 = 840 minutes
    expect(plan.paceWarning).toBe(true);
    expect(plan.totalMinutes).toBe(900);
    expect(plan.requiredMinutesPerDay).toBe(130); // 900 / 7 = 128.6 -> 130
    expect(plan.tasks).toHaveLength(30);
    expect(plan.unplacedTopics).toBe(0);
  });

  it('keeps the syllabus order by date even when work overflows', () => {
    const topics = Array.from({ length: 40 }, () =>
      topic('Physics', 'Mechanics'),
    );
    const plan = generatePlan(
      input(topics, { startDate: '2026-10-29', endDate: '2026-10-31' }),
    );
    expect(plan.paceWarning).toBe(true);
    expect(plan.tasks).toHaveLength(40);
    const byTopic = plan.tasks.map((t) => t.date);
    expect(byTopic).toEqual([...byTopic].sort());
    expect(plan.tasks.map((t) => t.topic)).toEqual(topics.map((t) => t.topic));
  });

  it('reports unplaced topics when no days are left, instead of inventing dates', () => {
    const topics = [topic('Physics', 'Optics'), topic('Physics', 'Optics')];
    const plan = generatePlan(
      input(topics, { startDate: '2026-11-01', endDate: '2026-10-31' }),
    );
    expect(plan.tasks).toEqual([]);
    expect(plan.unplacedTopics).toBe(2);
    expect(plan.paceWarning).toBe(true);
    expect(plan.days).toBe(0);
  });

  it('plans a single day when start and end are the same', () => {
    const plan = generatePlan(
      input([topic('Physics', 'Optics')], {
        startDate: '2026-10-31',
        endDate: '2026-10-31',
      }),
    );
    expect(plan.tasks.map((t) => t.date)).toEqual(['2026-10-31']);
  });

  it('does not stack new topics on a day already full of kept work', () => {
    const plan = generatePlan(
      input([topic('Physics', 'Optics'), topic('Physics', 'Optics')], {
        startDate: '2026-10-09',
        endDate: '2026-10-12',
        reservedByDate: { '2026-10-09': 120, '2026-10-10': 90 },
      }),
    );
    // day 1 is full; day 2 has room for exactly one 30-minute topic
    expect(plan.tasks.map((t) => t.date)).toEqual(['2026-10-10', '2026-10-11']);
    expect(plan.paceWarning).toBe(false);
  });

  it('counts kept work when deciding whether the plan fits', () => {
    const plan = generatePlan(
      input([topic('Physics', 'Optics')], {
        startDate: '2026-10-09',
        endDate: '2026-10-09',
        reservedByDate: { '2026-10-09': 110 },
      }),
    );
    expect(plan.paceWarning).toBe(true);
    expect(plan.tasks).toHaveLength(1);
  });

  it('copes with more subjects than days', () => {
    const topics = [
      topic('Physics', 'Optics'),
      topic('Chemistry', 'Solutions'),
      topic('Mathematics', 'Vectors'),
    ];
    const plan = generatePlan(
      input(topics, { startDate: '2026-10-30', endDate: '2026-10-31' }),
    );
    expect(plan.tasks).toHaveLength(3);
    expect(plan.unplacedTopics).toBe(0);
  });

  it('carries the chapter and the content-side chapter name into each task', () => {
    const plan = generatePlan(
      input([
        topic('Physics', 'Electrostatics', {
          scopeChapter: 'Electric Charges and Fields',
          topic: "Gauss's Law",
        }),
      ]),
    );
    expect(plan.tasks[0]).toMatchObject({
      subject: 'Physics',
      chapter: 'Electrostatics',
      scopeChapter: 'Electric Charges and Fields',
      topic: "Gauss's Law",
      estMinutes: 30,
    });
  });

  it('is deterministic', () => {
    const topics = Array.from({ length: 15 }, (_, index) =>
      topic(['Physics', 'Chemistry', 'Mathematics'][index % 3], 'Ch'),
    );
    expect(generatePlan(input(topics))).toEqual(generatePlan(input(topics)));
  });
});

describe('generatePlan invariants over many random inputs', () => {
  // small seeded generator so a failure is reproducible
  let seed = 12345;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const pick = <T>(items: readonly T[]) =>
    items[Math.floor(random() * items.length)];

  it('never loses or duplicates a topic, and respects the budget when there is no warning', () => {
    for (let run = 0; run < 150; run += 1) {
      const subjects = ['Physics', 'Chemistry', 'Mathematics'].slice(
        0,
        1 + Math.floor(random() * 3),
      );
      const count = Math.floor(random() * 60);
      const topics = Array.from({ length: count }, () =>
        topic(pick(subjects), `Ch ${Math.floor(random() * 6)}`, {
          chapterMinutes:
            random() < 0.2 ? null : 30 + Math.floor(random() * 150),
          chapterTopicCount: 1 + Math.floor(random() * 6),
        }),
      );
      const daily = pick([30, 60, 90, 120, 180]);
      const days = 1 + Math.floor(random() * 40);
      const plan = generatePlan({
        topics,
        startDate: '2026-10-01',
        endDate: `2026-11-${String(Math.min(days, 28)).padStart(2, '0')}`,
        dailyMinutes: daily,
      });

      expect(plan.tasks.length + plan.unplacedTopics).toBe(topics.length);
      expect(new Set(plan.tasks.map((t) => t.topic)).size).toBe(
        plan.tasks.length,
      );
      // each subject's topics stay in the given order by date
      for (const subject of subjects) {
        const given = topics
          .filter((t) => t.subject === subject)
          .map((t) => t.topic);
        const placed = plan.tasks.filter((t) => t.subject === subject);
        expect(placed.map((t) => t.topic)).toEqual(given);
        const dates = placed.map((t) => t.date);
        expect(dates).toEqual([...dates].sort());
      }
      if (!plan.paceWarning) {
        const load = new Map<string, number>();
        for (const task of plan.tasks) {
          load.set(task.date, (load.get(task.date) ?? 0) + task.estMinutes);
        }
        for (const minutes of load.values()) {
          expect(minutes).toBeLessThanOrEqual(daily);
        }
      }
    }
  });
});
