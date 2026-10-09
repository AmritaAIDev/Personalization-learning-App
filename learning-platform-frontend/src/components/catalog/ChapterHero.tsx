"use client";

import { Clock, HelpCircle, Layers3 } from "lucide-react";
import {
  CHAPTER_STATUS,
  formatStudyTime,
  pluralize,
} from "@/lib/catalog";
import type { CatalogChapterDetail } from "@/lib/catalog-types";
import { getSubjectTheme } from "@/lib/subject-theme";
import MasteryStars from "./MasteryStars";
import ProgressRing from "./ProgressRing";

export default function ChapterHero({
  detail,
}: {
  detail: CatalogChapterDetail;
}) {
  const { chapter, meta } = detail;
  const theme = getSubjectTheme(chapter.subject);
  const studyTime = formatStudyTime(chapter.studyMinutes);

  return (
    <section
      className="overflow-hidden rounded-[1.75rem] p-5 text-white shadow-[0_18px_44px_rgba(20,20,30,0.12)] sm:p-7"
      style={{ background: theme.gradient }}
      aria-labelledby="chapter-hero-heading"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 md:max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]">
            <span className="rounded-full bg-white/15 px-2.5 py-1">
              {chapter.subject}
            </span>
            {chapter.unit ? (
              <span className="rounded-full bg-white/15 px-2.5 py-1">
                {chapter.unit}
              </span>
            ) : null}
            {chapter.difficulty ? (
              <span className="rounded-full bg-white/15 px-2.5 py-1">
                {chapter.difficulty}
              </span>
            ) : null}
          </div>
          <h1
            id="chapter-hero-heading"
            className="mt-3 font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
          >
            {chapter.name}
          </h1>
          {meta?.overview ? (
            <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
              {meta.overview}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-6 text-white/80">
              The study guide for this chapter is being prepared. You can still
              learn and practise every topic below.
            </p>
          )}
          <ul className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            {studyTime ? (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {studyTime}
              </li>
            ) : null}
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {pluralize(chapter.questionCount, "question")}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
              {pluralize(chapter.topicCount, "topic")}
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white/12 p-4 backdrop-blur-sm md:flex-col md:gap-2">
          <ProgressRing
            value={chapter.score}
            size={92}
            stroke={7}
            label="Chapter score"
            tone="text-white"
            trackTone="text-white/25"
            valueTone="text-white"
          />
          <div className="md:text-center">
            <p className="font-heading text-sm font-bold">
              {CHAPTER_STATUS[chapter.status].label}
            </p>
            <p className="text-xs text-white/75">
              {chapter.masteredTopics}/{chapter.topicCount} topics mastered
            </p>
            {chapter.mastery ? (
              <div className="mt-1.5 md:flex md:justify-center">
                <MasteryStars
                  mastery={chapter.mastery}
                  showNext
                  tone="text-white"
                  labelTone="text-white"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
