"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Lock,
  Play,
  X,
} from "lucide-react";
import { learningUrl } from "@/lib/learning";
import type { JourneyNode, Subtopic } from "@/context/JourneyContext";

type TopicStatus = "completed" | "active" | "locked";

function topicStatus(topic: Subtopic, chapter: JourneyNode): TopicStatus {
  if (topic.state === "completed" || chapter.state === "completed")
    return "completed";
  if (topic.state === "locked" || chapter.state === "locked") return "locked";
  return "active";
}

function topicProgress(topic: Subtopic, status: TopicStatus): number {
  if (status === "completed") return 100;
  return typeof topic.score === "number"
    ? Math.max(0, Math.min(100, Math.round(topic.score)))
    : 0;
}

export default function SubjectCourseExplorer({
  subject,
  chapters,
  open,
  onClose,
}: {
  subject: string;
  chapters: JourneyNode[];
  open: boolean;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const totals = useMemo(() => {
    const total = chapters.reduce(
      (count, chapter) => count + (chapter.subtopics?.length || 1),
      0,
    );
    const completed = chapters.reduce(
      (count, chapter) =>
        count +
        (chapter.subtopics?.filter(
          (topic) => topicStatus(topic, chapter) === "completed",
        ).length ?? (chapter.state === "completed" ? 1 : 0)),
      0,
    );
    return { total, completed };
  }, [chapters]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  if (chapters.length === 0) {
    return createPortal(
      <section
        className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/35 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-explorer-heading"
      >
        <button
          type="button"
          aria-label="Close course map"
          className="absolute inset-0 cursor-default"
          onClick={onClose}
        />
        <div className="relative z-10 w-full max-w-xl rounded-[1.5rem] bg-surface p-6 shadow-[0_24px_80px_rgba(20,20,30,0.2)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                Selected course
              </p>
              <h2
                id="course-explorer-heading"
                className="mt-1 font-heading text-2xl font-semibold text-ink"
              >
                {subject}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full border border-hairline text-ink-mute transition hover:border-primary/25 hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-6 rounded-2xl border border-dashed border-hairline bg-canvas p-6 text-sm text-ink-soft">
            No published course units are available for {subject} yet.
          </p>
        </div>
      </section>,
      document.body,
    );
  }

  return createPortal(
    <section
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/35 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-explorer-heading"
    >
      <button
        type="button"
        aria-label="Close course map"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="animate-rise relative z-10 flex h-[min(860px,calc(100vh-1.5rem))] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] bg-surface shadow-[0_24px_80px_rgba(20,20,30,0.2)]">
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              Selected course
            </p>
            <h2
              id="course-explorer-heading"
              className="mt-1 truncate font-heading text-2xl font-semibold tracking-tight text-ink"
            >
              {subject} course map
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full bg-primary-tint px-3 py-1.5 text-xs font-semibold text-primary sm:inline-flex">
              {totals.completed}/{totals.total} topics completed
            </span>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full border border-hairline text-ink-mute transition hover:border-primary/25 hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="border-b border-hairline bg-canvas/70 p-5 lg:border-b-0 lg:border-r">
            <div className="rounded-2xl bg-surface p-4 shadow-[0_8px_24px_rgba(20,20,30,0.04)]">
              <p className="text-sm font-semibold text-ink">{subject}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-hairline">
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-700"
                  style={{
                    width: `${totals.total ? (totals.completed / totals.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <span className="rounded-xl bg-canvas px-3 py-2">
                  <span className="block font-heading text-lg font-semibold text-ink">
                    {chapters.length}
                  </span>
                  <span className="text-[11px] text-ink-mute">Chapters</span>
                </span>
                <span className="rounded-xl bg-canvas px-3 py-2">
                  <span className="block font-heading text-lg font-semibold text-ink">
                    {totals.total}
                  </span>
                  <span className="text-[11px] text-ink-mute">Topics</span>
                </span>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-ink p-4 text-white">
              <p className="text-[12px] text-white/55">Course rule</p>
              <p className="mt-1 text-sm leading-5 text-white/78">
                Pick a topic and the learning flow decides baseline, level,
                practice, and review from saved learner state.
              </p>
            </div>
          </aside>

          <div className="min-h-0 overflow-y-auto p-5 custom-scrollbar sm:p-6">
            <div className="space-y-3">
              {chapters.map((chapter, chapterIndex) => {
                const topics = chapter.subtopics?.length
                  ? chapter.subtopics
                  : [{ name: chapter.name, score: chapter.score ?? null }];
                const completed = topics.filter(
                  (topic) => topicStatus(topic, chapter) === "completed",
                ).length;
                const isOpen = expanded === chapter.id;
                return (
                  <article
                    key={chapter.id}
                    className={`overflow-hidden rounded-2xl border transition-[border-color,background-color,box-shadow] duration-300 ${isOpen ? "border-primary/25 bg-canvas/70 shadow-[0_12px_32px_rgba(20,20,30,0.05)]" : "border-hairline bg-white"}`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((current) =>
                          current === chapter.id ? null : chapter.id,
                        )
                      }
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-canvas"
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold ${chapter.state === "completed" ? "bg-primary text-white" : "bg-primary-tint text-primary"}`}
                      >
                        {String(chapterIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-ink">
                            {chapter.name}
                          </span>
                          {chapter.state === "completed" ? (
                            <Check className="h-4 w-4 shrink-0 text-primary" />
                          ) : null}
                        </span>
                        <span className="mt-1 block text-xs text-ink-mute">
                          {completed}/{topics.length} topics completed
                        </span>
                      </span>
                      <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-hairline sm:block">
                        <span
                          className="block h-full rounded-full bg-primary transition-[width] duration-500"
                          style={{
                            width: `${topics.length ? (completed / topics.length) * 100 : 0}%`,
                          }}
                        />
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-ink-mute transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen ? (
                      <div className="animate-rise border-t border-hairline px-4 py-2">
                        {topics.map((topic) => {
                          const status = topicStatus(topic, chapter);
                          const progress = topicProgress(topic, status);
                          const canOpen = status !== "locked";
                          // Open the topic overview, not a blind jump into
                          // practice — the explorer is for choosing where to go.
                          const href = learningUrl({
                            subject,
                            chapter: chapter.name,
                            topic: topic.name,
                          });
                          const icon =
                            status === "completed" ? (
                              <Check className="h-4 w-4" />
                            ) : status === "locked" ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            );
                          const statusText =
                            status === "completed"
                              ? "Completed"
                              : status === "locked"
                                ? "Locked"
                                : progress > 0
                                  ? `${progress}% in progress`
                                  : "Ready to begin";
                          const row = (
                            <span className="group flex min-w-0 items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-white">
                              <span
                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${status === "completed" ? "bg-primary-tint text-primary" : status === "locked" ? "bg-canvas text-ink-mute" : "bg-ink text-white"}`}
                              >
                                {icon}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-ink">
                                  {topic.name}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-ink-mute">
                                  {statusText}
                                </span>
                              </span>
                              {canOpen ? (
                                <ArrowRight className="h-4 w-4 shrink-0 text-ink-mute transition group-hover:translate-x-1 group-hover:text-primary" />
                              ) : (
                                <Circle className="h-3 w-3 shrink-0 text-ink-mute" />
                              )}
                            </span>
                          );
                          return canOpen ? (
                            <Link key={topic.id ?? topic.name} href={href}>
                              {row}
                            </Link>
                          ) : (
                            <div key={topic.id ?? topic.name}>{row}</div>
                          );
                        })}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>,
    document.body,
  );
}
