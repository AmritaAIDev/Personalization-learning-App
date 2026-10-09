"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import {
  CHAPTER_STATUS,
  DIFFICULTY_TONE,
  chapterHref,
  formatStudyTime,
  pluralize,
  scoreTone,
} from "@/lib/catalog";
import type { CatalogChapterSummary } from "@/lib/catalog-types";
import { getSubjectTheme } from "@/lib/subject-theme";
import ChapterStatusPill from "./ChapterStatusPill";
import ProgressRing from "./ProgressRing";

const MAX_CHIPS = 4;

/**
 * One chapter on the subject page. The whole card is a single link to the
 * chapter hub (no nested interactive elements), so it is one clean tap
 * target on touch screens and one stop for keyboard users.
 */
export default function ChapterCard({
  chapter,
  index,
}: {
  chapter: CatalogChapterSummary;
  index: number;
}) {
  const theme = getSubjectTheme(chapter.subject);
  const studyTime = formatStudyTime(chapter.studyMinutes);
  const extraChips = Math.max(0, chapter.topicCount - MAX_CHIPS);
  const masteredLabel =
    chapter.topicCount > 0
      ? `${chapter.masteredTopics}/${chapter.topicCount} topics mastered`
      : "Topics coming soon";

  return (
    <Link
      href={chapterHref(chapter.subjectSlug, chapter.slug)}
      className="group flex min-w-0 flex-col rounded-2xl border border-hairline bg-surface p-4 shadow-[0_10px_28px_rgba(20,20,30,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_36px_rgba(20,20,30,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white"
            style={{ background: theme.gradient }}
          >
            Ch {String(index + 1).padStart(2, "0")}
          </span>
          {chapter.unit ? (
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-mute">
              {chapter.unit}
            </span>
          ) : null}
        </div>
        <ChapterStatusPill status={chapter.status} />
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-[2.75rem] font-heading text-base font-bold leading-snug text-ink">
        {chapter.name}
      </h3>

      {chapter.topicPreview.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Topics">
          {chapter.topicPreview.slice(0, MAX_CHIPS).map((topic) => (
            <li
              key={topic}
              className="max-w-full truncate rounded-full bg-canvas px-2.5 py-1 text-[11px] font-medium text-ink-soft"
            >
              {topic}
            </li>
          ))}
          {extraChips > 0 ? (
            <li className="rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold text-primary">
              +{extraChips}
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="mt-4 flex items-center gap-3 border-t border-hairline pt-4">
        <ProgressRing
          value={chapter.score}
          label={`${chapter.name} score`}
          tone={
            chapter.score === null
              ? "text-primary"
              : chapter.score >= 70
                ? "text-success"
                : chapter.score >= 40
                  ? "text-warning"
                  : "text-danger"
          }
          valueTone={scoreTone(chapter.score)}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-ink-soft">
            {masteredLabel}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-mute">
            <span>{pluralize(chapter.questionCount, "question")}</span>
            {studyTime ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {studyTime}
              </span>
            ) : null}
            {chapter.difficulty ? (
              <span
                className={`rounded-full px-2 py-0.5 font-bold ${DIFFICULTY_TONE[chapter.difficulty]}`}
              >
                {chapter.difficulty}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        {CHAPTER_STATUS[chapter.status].cta}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
