"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pluralize, scoreTone, subjectHref } from "@/lib/catalog";
import type { CatalogSubjectSummary } from "@/lib/catalog-types";
import { getSubjectTheme } from "@/lib/subject-theme";

export default function SubjectCard({
  subject,
}: {
  subject: CatalogSubjectSummary;
}) {
  const theme = getSubjectTheme(subject.name);
  const Icon = theme.icon;
  const startedPercent =
    subject.chapterCount > 0
      ? Math.round((subject.chaptersStarted / subject.chapterCount) * 100)
      : 0;

  return (
    <Link
      href={subjectHref(subject.slug)}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_10px_28px_rgba(20,20,30,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(20,20,30,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div
        className="flex items-center gap-3 p-5 text-white"
        style={{ background: theme.gradient }}
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-heading text-lg font-bold">
            {subject.name}
          </h2>
          <p className="text-xs text-white/80">
            {pluralize(subject.chapterCount, "chapter")} ·{" "}
            {pluralize(subject.topicCount, "topic")}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-ink-soft">
          <span>
            {subject.chaptersStarted}/{subject.chapterCount} chapters started
          </span>
          <span>{startedPercent}%</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas"
          role="progressbar"
          aria-label={`${subject.name} chapters started`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={startedPercent}
        >
          <span
            className={`block h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${theme.accent}`}
            style={{ width: `${startedPercent}%` }}
          />
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="min-w-0 rounded-xl bg-canvas px-2 py-2.5">
            <dt className="truncate text-[11px] font-medium text-ink-mute">
              Mastered
            </dt>
            <dd className="mt-0.5 font-heading text-lg font-bold text-ink">
              {subject.chaptersMastered}
            </dd>
          </div>
          <div className="min-w-0 rounded-xl bg-canvas px-2 py-2.5">
            <dt className="truncate text-[11px] font-medium text-ink-mute">
              Avg score
            </dt>
            <dd
              className={`mt-0.5 font-heading text-lg font-bold ${scoreTone(subject.averageScore)}`}
            >
              {subject.averageScore === null ? "—" : `${subject.averageScore}%`}
            </dd>
          </div>
          <div className="min-w-0 rounded-xl bg-canvas px-2 py-2.5">
            <dt className="truncate text-[11px] font-medium text-ink-mute">
              Questions
            </dt>
            <dd className="mt-0.5 font-heading text-lg font-bold text-ink">
              {subject.questionCount}
            </dd>
          </div>
        </dl>

        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Browse chapters
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
