import { apiFetch } from "./api";
import { learningUrl } from "./learning";
import { formatDailyMinutes } from "./personalization";
import type {
  GenerateResult,
  PlanSummary,
  StudyTaskView,
  TaskAction,
} from "./study-plan-types";

/** Fired whenever the plan changes, so every panel showing it reloads. */
export const PLAN_UPDATED_EVENT = "jee-ai:study-plan-updated";

export function notifyPlanUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PLAN_UPDATED_EVENT));
  }
}

/** Builds or rebuilds the plan for the signed-in student. */
export async function generatePlanRequest(): Promise<GenerateResult> {
  const result = await apiFetch<GenerateResult>("/api/study-plan/generate", {
    method: "POST",
  });
  notifyPlanUpdated();
  return result;
}

export async function updateTaskRequest(
  taskId: string,
  action: TaskAction,
): Promise<StudyTaskView> {
  const task = await apiFetch<StudyTaskView>(
    `/api/study-plan/tasks/${encodeURIComponent(taskId)}`,
    { method: "PATCH", body: JSON.stringify({ action }) },
  );
  notifyPlanUpdated();
  return task;
}

/** Opens the topic in the learning workspace, using the name its questions are tagged with. */
export function taskLearnHref(task: StudyTaskView): string {
  return learningUrl({
    subject: task.subject,
    chapter: task.scopeChapter,
    topic: task.topic,
  });
}

export function isDone(task: Pick<StudyTaskView, "status">): boolean {
  return task.status === "COMPLETED";
}

/**
 * Completed by the student's own answers (not ticked), so it cannot be
 * un-ticked: it would flip straight back.
 */
export function isAutoCompleted(
  task: Pick<StudyTaskView, "status" | "completionSource">,
): boolean {
  return task.status === "COMPLETED" && task.completionSource === "AUTO";
}

/** "83 days left", "1 day left", "Last day", "Ended". */
export function daysLeftLabel(days: number | null): string {
  if (days === null) return "";
  if (days < 0) return "Ended";
  if (days === 0) return "Last day";
  return `${days} ${days === 1 ? "day" : "days"} left`;
}

/** A plain-words note when the plan cannot fit the student's daily time; null when it can. */
export function paceNote(plan: PlanSummary): string | null {
  if (!plan.paceWarning) return null;
  return `At ${formatDailyMinutes(plan.dailyMinutes)} a day you will not finish everything by your target month. About ${formatDailyMinutes(plan.requiredMinutesPerDay)} a day would fit.`;
}

/** "3/5 tasks completed - 60%"-style headline for a day. */
export function progressHeadline(totals: {
  completed: number;
  total: number;
  percent: number;
}): string {
  return `${totals.completed}/${totals.total} ${totals.total === 1 ? "task" : "tasks"} completed - ${totals.percent}%`;
}
