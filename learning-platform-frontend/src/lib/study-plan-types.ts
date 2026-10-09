/** Mirrors learning-platform-backend/src/study-plan/study-plan.types.ts (API payloads). */

export type TaskDisplayStatus = "PENDING" | "COMPLETED" | "SKIPPED" | "OVERDUE";

export interface StudyTaskView {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  subject: string;
  chapter: string;
  /** Chapter name the topic's questions are tagged with (for /learn links). */
  scopeChapter: string;
  topic: string;
  estMinutes: number;
  status: TaskDisplayStatus;
  completionSource: "MANUAL" | "AUTO" | null;
}

export interface PlanSummary {
  targetMonth: string;
  dailyMinutes: number;
  generatedAt: string;
  paceWarning: boolean;
  requiredMinutesPerDay: number;
  /** The target month or daily time changed since this plan was built. */
  stale: boolean;
}

export interface TaskTotals {
  total: number;
  completed: number;
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
  hasPlan: boolean;
  plan: PlanSummary | null;
}

export interface TodayView extends PlanEnvelope {
  date: string;
  tasks: StudyTaskView[];
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
  daysRemaining: number | null;
  subjects: Array<{
    subject: string;
    planned: number;
    completed: number;
    chapters: Array<{ chapter: string; planned: number; completed: number }>;
  }>;
  totals: TaskTotals;
  /** Every task in the plan across all months. */
  planTotals: TaskTotals;
  onTrack: { due: number; completedDue: number; percent: number };
}

export interface GenerateResult {
  plan: PlanSummary;
  planned: number;
  keptCompleted: number;
  unplacedTopics: number;
}

export type TaskAction = "complete" | "undo" | "skip";
