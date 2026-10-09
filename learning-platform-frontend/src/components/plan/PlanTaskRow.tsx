"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw, SkipForward } from "lucide-react";
import TaskCheckbox from "@/components/ui/TaskCheckbox";
import { formatDay } from "@/lib/month";
import { formatDailyMinutes } from "@/lib/personalization";
import { isAutoCompleted, isDone, taskLearnHref } from "@/lib/study-plan";
import type { StudyTaskView, TaskAction } from "@/lib/study-plan-types";
import { getSubjectTheme } from "@/lib/subject-theme";

/**
 * One study task: tick it, skip it (and bring it back), or start learning it.
 * Ticking records that the student did it; mastery only ever comes from answers.
 */
export default function PlanTaskRow({
  task,
  pending,
  onAction,
  showDate = false,
}: {
  task: StudyTaskView;
  pending: boolean;
  onAction: (task: StudyTaskView, action: TaskAction) => void;
  /** Show the day (used for overdue tasks, which come from earlier days). */
  showDate?: boolean;
}) {
  const done = isDone(task);
  const skipped = task.status === "SKIPPED";
  const overdue = task.status === "OVERDUE";
  const theme = getSubjectTheme(task.subject);

  return (
    <li className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-hairline bg-surface px-3 py-1.5">
      <div className="min-w-0 flex-1 basis-56">
        <TaskCheckbox
          checked={done}
          label={`${task.subject}: ${task.topic}`}
          pending={pending}
          disabled={isAutoCompleted(task) || skipped}
          onChange={(next) => onAction(task, next ? "complete" : "undo")}
        >
          <span
            className={`block truncate text-sm font-semibold ${done || skipped ? "text-ink-mute" : "text-ink"} ${done ? "line-through" : ""}`}
          >
            {task.topic}
          </span>
          <span className="block truncate text-xs text-ink-mute">
            <span className={`font-semibold ${theme.badge}`}>{task.subject}</span>
            {" · "}
            {task.chapter} · {formatDailyMinutes(task.estMinutes)}
            {showDate ? ` · ${formatDay(task.date)}` : ""}
            {isAutoCompleted(task) ? " · completed from your practice" : ""}
          </span>
        </TaskCheckbox>
      </div>

      {overdue ? (
        <span className="rounded-full bg-warning-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
          Overdue
        </span>
      ) : null}
      {skipped ? (
        <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-mute">
          Skipped
        </span>
      ) : null}

      <div className="flex shrink-0 items-center gap-1.5">
        {skipped ? (
          <button
            type="button"
            onClick={() => onAction(task, "undo")}
            disabled={pending}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-hairline px-3 text-xs font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary disabled:opacity-60"
            aria-label={`Restore ${task.topic}`}
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Restore
          </button>
        ) : null}
        {!done && !skipped ? (
          <>
            <button
              type="button"
              onClick={() => onAction(task, "skip")}
              disabled={pending}
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-hairline px-3 text-xs font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary disabled:opacity-60"
              aria-label={`Skip ${task.topic}`}
            >
              <SkipForward className="h-3 w-3" aria-hidden="true" />
              Skip
            </button>
            <Link
              href={taskLearnHref(task)}
              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-primary-tint px-3 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
              aria-label={`Start learning ${task.topic}`}
            >
              Start Learning
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </>
        ) : null}
      </div>
    </li>
  );
}
