import {
  addDays,
  dateRange,
  daysBetween,
  lastDayOfMonth,
  weekStart,
} from './plan-dates';
import type {
  MonthView,
  PlanSummary,
  StudyTaskView,
  SubjectTaskTotals,
  TaskDisplayStatus,
  TaskTotals,
  TodayView,
  WeekView,
} from './study-plan.types';

/** The stored fields of a task that the views need. */
export interface TaskRecord {
  id: string;
  date: string;
  subject: string;
  chapter: string;
  scopeChapter: string;
  topic: string;
  estMinutes: number;
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
  completionSource: 'MANUAL' | 'AUTO' | null;
}

export const percentOf = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

/** A pending task whose day has passed is OVERDUE. */
export function displayStatus(
  task: Pick<TaskRecord, 'status' | 'date'>,
  today: string,
): TaskDisplayStatus {
  if (task.status === 'PENDING' && task.date < today) return 'OVERDUE';
  return task.status;
}

export function toTaskView(task: TaskRecord, today: string): StudyTaskView {
  return {
    id: task.id,
    date: task.date,
    subject: task.subject,
    chapter: task.chapter,
    scopeChapter: task.scopeChapter,
    topic: task.topic,
    estMinutes: task.estMinutes,
    status: displayStatus(task, today),
    completionSource: task.completionSource,
  };
}

/** Skipped tasks are left out of progress: a skipped task is neither done nor owed. */
export function totalsOf(tasks: readonly StudyTaskView[]): TaskTotals {
  const counted = tasks.filter((task) => task.status !== 'SKIPPED');
  const done = counted.filter((task) => task.status === 'COMPLETED');
  return {
    total: counted.length,
    completed: done.length,
    percent: percentOf(done.length, counted.length),
    estMinutes: counted.reduce((sum, task) => sum + task.estMinutes, 0),
    completedMinutes: done.reduce((sum, task) => sum + task.estMinutes, 0),
  };
}

const byDateThenOrder = (a: StudyTaskView, b: StudyTaskView) =>
  a.date.localeCompare(b.date);

export function buildTodayView(
  tasks: readonly TaskRecord[],
  plan: PlanSummary | null,
  today: string,
): TodayView {
  const views = tasks
    .map((task) => toTaskView(task, today))
    .sort(byDateThenOrder);
  const todays = views.filter((view) => view.date === today);
  return {
    hasPlan: plan !== null,
    plan,
    date: today,
    tasks: todays,
    overdue: views.filter((view) => view.status === 'OVERDUE'),
    totals: totalsOf(todays),
  };
}

export function buildWeekView(
  tasks: readonly TaskRecord[],
  plan: PlanSummary | null,
  anyDayInWeek: string,
  today: string,
): WeekView {
  const start = weekStart(anyDayInWeek);
  const end = addDays(start, 6);
  const views = tasks
    .filter((task) => task.date >= start && task.date <= end)
    .map((task) => toTaskView(task, today));
  const subjects = new Map<string, SubjectTaskTotals>();
  for (const view of views.filter((v) => v.status !== 'SKIPPED')) {
    const entry = subjects.get(view.subject) ?? {
      subject: view.subject,
      tasks: 0,
      completed: 0,
      estMinutes: 0,
    };
    entry.tasks += 1;
    entry.estMinutes += view.estMinutes;
    if (view.status === 'COMPLETED') entry.completed += 1;
    subjects.set(view.subject, entry);
  }
  return {
    hasPlan: plan !== null,
    plan,
    weekStart: start,
    weekEnd: end,
    days: dateRange(start, end).map((date) => ({
      date,
      tasks: views.filter((view) => view.date === date),
    })),
    subjects: [...subjects.values()],
    totals: totalsOf(views),
  };
}

export function buildMonthView(
  tasks: readonly TaskRecord[],
  plan: PlanSummary | null,
  month: string,
  today: string,
): MonthView {
  const first = `${month}-01`;
  const last = lastDayOfMonth(month);
  const views = tasks
    .filter((task) => task.date >= first && task.date <= last)
    .map((task) => toTaskView(task, today));
  const counted = views.filter((view) => view.status !== 'SKIPPED');

  interface Counts {
    planned: number;
    completed: number;
  }
  const subjects = new Map<
    string,
    Counts & { chapters: Map<string, Counts> }
  >();
  for (const view of counted) {
    const subject = subjects.get(view.subject) ?? {
      planned: 0,
      completed: 0,
      chapters: new Map<string, Counts>(),
    };
    const chapter = subject.chapters.get(view.chapter) ?? {
      planned: 0,
      completed: 0,
    };
    subject.planned += 1;
    chapter.planned += 1;
    if (view.status === 'COMPLETED') {
      subject.completed += 1;
      chapter.completed += 1;
    }
    subject.chapters.set(view.chapter, chapter);
    subjects.set(view.subject, subject);
  }

  const due = counted.filter((view) => view.date <= today);
  const completedDue = due.filter((view) => view.status === 'COMPLETED').length;
  const targetEnd = plan ? lastDayOfMonth(plan.targetMonth) : null;
  return {
    hasPlan: plan !== null,
    plan,
    month,
    daysRemaining: targetEnd
      ? Math.max(0, daysBetween(today, targetEnd))
      : null,
    subjects: [...subjects].map(([subject, entry]) => ({
      subject,
      planned: entry.planned,
      completed: entry.completed,
      chapters: [...entry.chapters].map(([chapter, counts]) => ({
        chapter,
        ...counts,
      })),
    })),
    totals: totalsOf(views),
    planTotals: totalsOf(tasks.map((task) => toTaskView(task, today))),
    // Nothing due yet counts as on track, not 0%.
    onTrack: {
      due: due.length,
      completedDue,
      percent: due.length === 0 ? 100 : percentOf(completedDue, due.length),
    },
  };
}
