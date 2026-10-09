import {
  buildMonthView,
  buildTodayView,
  buildWeekView,
  displayStatus,
  totalsOf,
  toTaskView,
  type TaskRecord,
} from './plan-views';
import type { PlanSummary } from './study-plan.types';

const TODAY = '2026-10-09'; // a Friday

let id = 0;
function task(overrides: Partial<TaskRecord> = {}): TaskRecord {
  id += 1;
  return {
    id: `t${id}`,
    date: TODAY,
    subject: 'Physics',
    chapter: 'Optics',
    scopeChapter: 'Optics',
    topic: `Topic ${id}`,
    estMinutes: 30,
    status: 'PENDING',
    completionSource: null,
    ...overrides,
  };
}

const PLAN: PlanSummary = {
  targetMonth: '2026-12',
  dailyMinutes: 120,
  generatedAt: '2026-10-01T00:00:00.000Z',
  paceWarning: false,
  requiredMinutesPerDay: 60,
  stale: false,
};

describe('displayStatus', () => {
  it('shows a pending task from an earlier day as OVERDUE, but not one for today or later', () => {
    expect(
      displayStatus({ status: 'PENDING', date: '2026-10-08' }, TODAY),
    ).toBe('OVERDUE');
    expect(displayStatus({ status: 'PENDING', date: TODAY }, TODAY)).toBe(
      'PENDING',
    );
    expect(
      displayStatus({ status: 'PENDING', date: '2026-10-10' }, TODAY),
    ).toBe('PENDING');
  });

  it('never marks done or skipped tasks overdue', () => {
    expect(
      displayStatus({ status: 'COMPLETED', date: '2026-09-01' }, TODAY),
    ).toBe('COMPLETED');
    expect(
      displayStatus({ status: 'SKIPPED', date: '2026-09-01' }, TODAY),
    ).toBe('SKIPPED');
  });
});

describe('totalsOf', () => {
  it('counts done over total and minutes, leaving skipped tasks out entirely', () => {
    const views = [
      task({ status: 'COMPLETED', estMinutes: 45 }),
      task({ status: 'COMPLETED', estMinutes: 15 }),
      task({ status: 'PENDING', estMinutes: 30 }),
      task({ status: 'SKIPPED', estMinutes: 60 }),
    ].map((t) => toTaskView(t, TODAY));
    expect(totalsOf(views)).toEqual({
      total: 3,
      completed: 2,
      percent: 67,
      estMinutes: 90,
      completedMinutes: 60,
    });
  });

  it('is all zeros, not NaN, with no tasks', () => {
    expect(totalsOf([])).toEqual({
      total: 0,
      completed: 0,
      percent: 0,
      estMinutes: 0,
      completedMinutes: 0,
    });
  });
});

describe('buildTodayView', () => {
  it("reports today's progress as completed / total and lists overdue work separately", () => {
    const tasks = [
      task({ status: 'COMPLETED' }),
      task({ status: 'COMPLETED' }),
      task({ status: 'COMPLETED' }),
      task({ status: 'PENDING' }),
      task({ status: 'PENDING' }),
      task({ date: '2026-10-07', status: 'PENDING' }),
      task({ date: '2026-10-08', status: 'PENDING' }),
      task({ date: '2026-10-10', status: 'PENDING' }),
    ];
    const view = buildTodayView(tasks, PLAN, TODAY);
    expect(view.tasks).toHaveLength(5);
    expect(view.totals).toMatchObject({ total: 5, completed: 3, percent: 60 });
    expect(view.overdue.map((t) => t.date)).toEqual([
      '2026-10-07',
      '2026-10-08',
    ]);
    expect(view.overdue.every((t) => t.status === 'OVERDUE')).toBe(true);
  });

  it('says there is no plan yet instead of showing an empty one as 0%', () => {
    const view = buildTodayView([], null, TODAY);
    expect(view.hasPlan).toBe(false);
    expect(view.plan).toBeNull();
    expect(view.tasks).toEqual([]);
  });
});

describe('buildWeekView', () => {
  const tasks = [
    task({ date: '2026-10-04', subject: 'Physics' }), // Sunday of the previous week
    task({
      date: '2026-10-05',
      subject: 'Physics',
      status: 'COMPLETED',
      estMinutes: 45,
    }),
    task({ date: '2026-10-06', subject: 'Chemistry', estMinutes: 30 }),
    task({
      date: '2026-10-09',
      subject: 'Chemistry',
      status: 'COMPLETED',
      estMinutes: 30,
    }),
    task({ date: '2026-10-11', subject: 'Mathematics', estMinutes: 60 }), // Sunday, same week
    task({ date: '2026-10-12', subject: 'Physics' }), // next Monday
  ];

  it('covers Monday to Sunday of the week containing the given day', () => {
    const view = buildWeekView(tasks, PLAN, '2026-10-09', TODAY);
    expect(view.weekStart).toBe('2026-10-05');
    expect(view.weekEnd).toBe('2026-10-11');
    expect(view.days.map((d) => d.date)).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ]);
    expect(view.days.flatMap((d) => d.tasks)).toHaveLength(4);
  });

  it('totals the week and each subject with estimated time', () => {
    const view = buildWeekView(tasks, PLAN, '2026-10-11', TODAY);
    expect(view.totals).toMatchObject({
      total: 4,
      completed: 2,
      percent: 50,
      estMinutes: 165,
    });
    expect(
      Object.fromEntries(view.subjects.map((s) => [s.subject, s])),
    ).toEqual({
      Physics: { subject: 'Physics', tasks: 1, completed: 1, estMinutes: 45 },
      Chemistry: {
        subject: 'Chemistry',
        tasks: 2,
        completed: 1,
        estMinutes: 60,
      },
      Mathematics: {
        subject: 'Mathematics',
        tasks: 1,
        completed: 0,
        estMinutes: 60,
      },
    });
  });

  it('returns seven empty days when nothing is planned that week', () => {
    const view = buildWeekView([], PLAN, '2026-11-18', TODAY);
    expect(view.days).toHaveLength(7);
    expect(view.totals.total).toBe(0);
    expect(view.subjects).toEqual([]);
  });
});

describe('buildMonthView', () => {
  const tasks = [
    task({
      date: '2026-10-01',
      subject: 'Physics',
      chapter: 'Optics',
      status: 'COMPLETED',
    }),
    task({
      date: '2026-10-09',
      subject: 'Physics',
      chapter: 'Optics',
      status: 'PENDING',
    }),
    task({ date: '2026-10-20', subject: 'Physics', chapter: 'Waves' }),
    task({
      date: '2026-10-21',
      subject: 'Chemistry',
      chapter: 'Solutions',
      status: 'SKIPPED',
    }),
    task({ date: '2026-11-02', subject: 'Chemistry', chapter: 'Solutions' }),
  ];

  it("groups the month's tasks by subject and chapter as planned vs completed", () => {
    const view = buildMonthView(tasks, PLAN, '2026-10', TODAY);
    expect(view.totals).toMatchObject({ total: 3, completed: 1, percent: 33 });
    expect(view.subjects).toEqual([
      {
        subject: 'Physics',
        planned: 3,
        completed: 1,
        chapters: [
          { chapter: 'Optics', planned: 2, completed: 1 },
          { chapter: 'Waves', planned: 1, completed: 0 },
        ],
      },
    ]);
  });

  it('measures "on track" against only what was due by today', () => {
    const view = buildMonthView(tasks, PLAN, '2026-10', TODAY);
    expect(view.onTrack).toEqual({ due: 2, completedDue: 1, percent: 50 });
  });

  it('counts a month with nothing due yet as on track, not 0%', () => {
    const view = buildMonthView(tasks, PLAN, '2026-11', TODAY);
    expect(view.onTrack).toEqual({ due: 0, completedDue: 0, percent: 100 });
  });

  it('counts the days left in the target month, and 0 once it has ended', () => {
    expect(
      buildMonthView([], PLAN, '2026-12', '2026-10-09').daysRemaining,
    ).toBe(83);
    expect(
      buildMonthView([], PLAN, '2026-12', '2026-12-31').daysRemaining,
    ).toBe(0);
    expect(
      buildMonthView([], PLAN, '2026-12', '2027-02-01').daysRemaining,
    ).toBe(0);
    expect(buildMonthView([], null, '2026-12', TODAY).daysRemaining).toBeNull();
  });
});
