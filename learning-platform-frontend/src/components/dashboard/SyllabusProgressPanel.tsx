"use client";

import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import { subjectHref } from "@/lib/catalog";
import type { SyllabusProgress } from "@/lib/catalog-types";
import { getSubjectTheme } from "@/lib/subject-theme";

/**
 * "Overall Syllabus Progress - 42% Completed", with each subject's bar. All of
 * it comes from the one shared definition (completed teachable topics over all
 * teachable topics), and every row opens the Subject > Chapter > Topic drill-down.
 */
export default function SyllabusProgressPanel({
  progress,
  loading,
  error,
  onRetry,
}: {
  progress: SyllabusProgress | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const overall = progress?.overall;

  return (
    <section
      aria-labelledby="syllabus-progress-heading"
      className="min-w-0 rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_10px_28px_rgba(20,20,30,0.04)] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            Syllabus
          </p>
          <h2
            id="syllabus-progress-heading"
            className="mt-1 font-heading text-xl font-bold tracking-tight text-ink"
          >
            Overall Syllabus Progress
          </h2>
        </div>
        <Link
          href="/subjects"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-hairline px-4 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
        >
          Subject, chapter, topic
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 space-y-3" role="status" aria-label="Loading syllabus progress">
          <div className="h-8 w-1/3 rounded skeleton" />
          <div className="h-3 rounded-full skeleton" />
          <div className="h-16 rounded-xl skeleton" />
        </div>
      ) : null}

      {error && !progress ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger-tint px-4 py-3 text-sm text-danger" role="alert">
          <span className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-9 items-center rounded-full bg-danger px-4 text-xs font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : null}

      {progress && overall && overall.total === 0 ? (
        <p className="mt-5 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-soft">
          No topics are ready to study yet. Progress appears here as soon as
          the first practice questions are published.
        </p>
      ) : null}

      {progress && overall && overall.total > 0 ? (
        <>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-heading text-4xl font-bold tracking-tight text-ink">
              {overall.percent}%
            </p>
            <p className="text-sm font-semibold text-ink-soft">Completed</p>
          </div>
          <div
            className="mt-3 h-3 overflow-hidden rounded-full bg-canvas"
            role="progressbar"
            aria-label="Overall syllabus completed"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={overall.percent}
          >
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-700 motion-reduce:transition-none"
              style={{ width: `${overall.percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            <strong className="text-ink">{overall.completed}</strong> of{" "}
            {overall.total} topics completed ·{" "}
            <strong className="text-ink">{overall.total - overall.completed}</strong>{" "}
            remaining
            {overall.inProgress > 0 ? ` (${overall.inProgress} in progress)` : ""}
          </p>

          <ul className="mt-5 space-y-3">
            {progress.subjects
              .filter((subject) => subject.total > 0)
              .map((subject) => {
                const theme = getSubjectTheme(subject.name);
                return (
                  <li key={subject.slug}>
                    <Link
                      href={subjectHref(subject.slug)}
                      className="group block rounded-xl px-1 py-1 transition hover:bg-canvas"
                    >
                      <span className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-semibold text-ink">
                          {subject.name}
                        </span>
                        <span className="shrink-0 font-heading font-bold text-ink">
                          {subject.percent}%
                        </span>
                      </span>
                      <span
                        className="mt-1.5 block h-2 overflow-hidden rounded-full bg-canvas"
                        role="progressbar"
                        aria-label={`${subject.name} completed`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={subject.percent}
                      >
                        <span
                          className={`block h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${theme.accent}`}
                          style={{ width: `${subject.percent}%` }}
                        />
                      </span>
                      <span className="mt-1 block text-xs text-ink-mute">
                        {subject.completed} completed · {subject.total - subject.completed}{" "}
                        remaining
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </>
      ) : null}
    </section>
  );
}
