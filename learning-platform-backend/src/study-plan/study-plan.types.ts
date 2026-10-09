/** Response shapes of the study-plan API. */

/** What the student sees. OVERDUE is derived: still pending and the day has passed. */
export type TaskDisplayStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'OVERDUE';

export interface StudyTaskView {
  id: string;
  /** `YYYY-MM-DD` */
  date: string;
  subject: string;
  chapter: string;
  /** Chapter name the topic's questions are tagged with (for /learn links). */
  scopeChapter: string;
  topic: string;
  estMinutes: number;
  status: TaskDisplayStatus;
  completionSource: 'MANUAL' | 'AUTO' | null;
}

export interface PlanSummary {
  targetMonth: string;
  dailyMinutes: number;
  generatedAt: string;
  /** The work did not fit the daily budget before the deadline. */
  paceWarning: boolean;
  requiredMinutesPerDay: number;
  /** The student changed their target month or daily time since this plan was built. */
  stale: boolean;
}

export interface TaskTotals {
  total: number;
  completed: number;
  /** completed / total, rounded; 0 when there are no tasks. */
  percent: number;
  estMinutes: number;
  completedMinutes: number;
}

export interface SubjectTaskTotals {
  subject: string;
  tasks: number;
  completed: number;
  estMinutes: number;
}

interface PlanEnvelope {
  /** False until the student has generated a plan. */
  hasPlan: boolean;
  plan: PlanSummary | null;
}

export interface TodayView extends PlanEnvelope {
  date: string;
  tasks: StudyTaskView[];
  /** Unfinished tasks from earlier days, oldest first. */
  overdue: StudyTaskView[];
  totals: TaskTotals;
}

export interface WeekView extends PlanEnvelope {
  weekStart: string;
  weekEnd: string;
  days: Array<{ date: string; tasks: StudyTaskView[] }>;
  subjects: SubjectTaskTotals[];
  totals: TaskTotals;
}

export interface MonthView extends PlanEnvelope {
  month: string;
  /** Days left in the plan's target month, counting from today (0 once it has ended). */
  daysRemaining: number | null;
  subjects: Array<{
    subject: string;
    planned: number;
    completed: number;
    chapters: Array<{ chapter: string; planned: number; completed: number }>;
  }>;
  totals: TaskTotals;
  /** Of the tasks due on or before today, how many are done. */
  onTrack: { due: number; completedDue: number; percent: number };
}

export interface GenerateResult {
  plan: PlanSummary;
  planned: number;
  /** Completed tasks kept from an earlier plan. */
  keptCompleted: number;
  /** Topics with no day left to go on (the target month is over). */
  unplacedTopics: number;
}
