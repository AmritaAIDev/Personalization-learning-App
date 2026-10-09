"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarCheck, CircleAlert, Clock } from "lucide-react";
import TaskCheckbox from "@/components/ui/TaskCheckbox";
import { useAuth } from "@/context/AuthContext";
import { formatDailyMinutes, requestProfileSetup } from "@/lib/personalization";
import {
  generatePlanRequest,
  isAutoCompleted,
  isDone,
  progressHeadline,
  taskLearnHref,
  updateTaskRequest,
} from "@/lib/study-plan";
import type { StudyTaskView } from "@/lib/study-plan-types";
import { getSubjectTheme } from "@/lib/subject-theme";
import { useTodayPlan } from "@/lib/useStudyPlan";

/**
 * "Today's Progress: 3/5 tasks completed - 60%" with the day's tasks. Ticking a
 * task records that the student did it; it never changes topic mastery, which
 * only comes from real answers. A topic the student has really completed shows
 * as done and cannot be un-ticked.
 */
export default function TodayProgressCard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useTodayPlan();
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);

  const toggle = async (task: StudyTaskView, wantDone: boolean) => {
    setActionError(null);
    setPending((current) => new Set(current).add(task.id));
    try {
      await updateTaskRequest(task.id, wantDone ? "complete" : "undo");
    } catch (reason) {
      setActionError(
        reason instanceof Error ? reason.message : "That could not be saved.",
      );
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  };

  const build = async () => {
    setActionError(null);
    setBuilding(true);
    try {
      await generatePlanRequest();
    } catch (reason) {
      setActionError(
        reason instanceof Error
          ? reason.message
          : "Your plan could not be built. Please try again.",
      );
    } finally {
      setBuilding(false);
    }
  };

  const hasTarget = Boolean(user?.personalization.targetMonth);

  return (
    <section
      aria-labelledby="today-progress-heading"
      className="min-w-0 rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_10px_28px_rgba(20,20,30,0.04)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            Today
          </p>
          <h2
            id="today-progress-heading"
            className="mt-1 font-heading text-xl font-bold tracking-tight text-ink"
          >
            Today&apos;s Progress
          </h2>
        </div>
        <CalendarCheck className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
      </div>

      {loading ? (
        <div className="mt-5 space-y-3" role="status" aria-label="Loading today's plan">
          <div className="h-5 w-2/3 rounded skeleton" />
          <div className="h-2 rounded-full skeleton" />
          <div className="h-14 rounded-xl skeleton" />
        </div>
      ) : null}

      {error && !data ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger-tint px-4 py-3 text-sm text-danger" role="alert">
          <span className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex min-h-9 items-center rounded-full bg-danger px-4 text-xs font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : null}

      {data && !data.hasPlan ? (
        <div className="mt-5 rounded-2xl border border-dashed border-hairline bg-canvas p-5">
          <p className="text-sm leading-6 text-ink-soft">
            {hasTarget
              ? "You haven't built your study plan yet. It schedules your remaining topics, day by day, up to your target month."
              : "Set your target month and we'll build a day-by-day study plan for you."}
          </p>
          <button
            type="button"
            onClick={hasTarget ? () => void build() : requestProfileSetup}
            disabled={building}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60"
          >
            {hasTarget
              ? building
                ? "Building..."
                : "Build my plan"
              : "Set up my plan"}
          </button>
        </div>
      ) : null}

      {data?.hasPlan ? (
        <>
          <p
            className="mt-4 font-heading text-lg font-bold text-ink"
            aria-live="polite"
          >
            {data.totals.total === 0
              ? "No tasks planned for today"
              : progressHeadline(data.totals)}
          </p>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-canvas"
            role="progressbar"
            aria-label="Today's tasks completed"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={data.totals.percent}
          >
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-700 motion-reduce:transition-none"
              style={{ width: `${data.totals.percent}%` }}
            />
          </div>
          {data.totals.total > 0 ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-mute">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDailyMinutes(data.totals.completedMinutes)} done of{" "}
              {formatDailyMinutes(data.totals.estMinutes)} planned
            </p>
          ) : null}

          {actionError ? (
            <p className="mt-3 text-xs font-medium text-danger" role="alert">
              {actionError}
            </p>
          ) : null}

          {data.tasks.length === 0 ? (
            <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-soft">
              You&apos;re clear for today. Check{" "}
              <Link href="/plan" className="font-semibold text-primary hover:underline">
                your study plan
              </Link>{" "}
              for what&apos;s next.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.tasks.map((task) => {
                const done = isDone(task);
                const theme = getSubjectTheme(task.subject);
                return (
                  <li
                    key={task.id}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-hairline bg-canvas/60 px-3 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <TaskCheckbox
                        checked={done}
                        label={`${task.subject}: ${task.topic}`}
                        pending={pending.has(task.id)}
                        disabled={isAutoCompleted(task)}
                        onChange={(next) => void toggle(task, next)}
                      >
                        <span
                          className={`block truncate text-sm font-semibold ${done ? "text-ink-mute line-through" : "text-ink"}`}
                        >
                          {task.topic}
                        </span>
                        <span className="block truncate text-xs text-ink-mute">
                          <span className={`font-semibold ${theme.badge}`}>
                            {task.subject}
                          </span>{" "}
                          · {formatDailyMinutes(task.estMinutes)}
                          {isAutoCompleted(task)
                            ? " · completed from your practice"
                            : ""}
                        </span>
                      </TaskCheckbox>
                    </div>
                    {done ? null : (
                      <Link
                        href={taskLearnHref(task)}
                        className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-primary-tint px-3 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                        aria-label={`Start learning ${task.topic}`}
                      >
                        Start Learning
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {data.overdue.length > 0 ? (
            <p className="mt-4 text-xs text-ink-soft">
              <span className="font-bold text-warning">
                {data.overdue.length} overdue
              </span>{" "}
              from earlier days.{" "}
              <Link href="/plan" className="font-semibold text-primary hover:underline">
                See them in your plan
              </Link>
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
