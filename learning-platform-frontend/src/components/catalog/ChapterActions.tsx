"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Layers,
  PencilLine,
} from "lucide-react";
import { analyticsHref, pickFocusTopic } from "@/lib/catalog";
import type { CatalogChapterDetail } from "@/lib/catalog-types";
import { learningUrl } from "@/lib/learning";

/**
 * Entry points from a chapter into the adaptive engine. Each action opens the
 * existing workspace on the chapter's most useful topic (weakest in progress,
 * else the next untouched one), so the catalog never duplicates learning UI.
 */
export default function ChapterActions({
  detail,
}: {
  detail: CatalogChapterDetail;
}) {
  const focus = pickFocusTopic(detail.topics);
  if (!focus) {
    return (
      <p className="rounded-2xl border border-dashed border-hairline bg-canvas p-5 text-sm leading-6 text-ink-soft">
        Practice isn&apos;t available for this chapter yet — topics are still
        being added.
      </p>
    );
  }

  const scope = {
    subject: detail.chapter.subject,
    chapter: detail.chapter.name,
    topic: focus.name,
  };
  const actions = [
    {
      key: "learn",
      icon: BookOpenCheck,
      label: detail.chapter.startedTopics > 0 ? "Continue learning" : "Start learning",
      description: `Adaptive session on ${focus.name}`,
      href: learningUrl(scope),
      primary: true,
    },
    {
      key: "practice",
      icon: PencilLine,
      label: "Practice",
      description: "Solve questions at your own pace",
      href: learningUrl(scope, { tab: "practice" }),
      primary: false,
    },
    {
      key: "flashcards",
      icon: Layers,
      label: "Flashcards",
      description: "Quick spaced-repetition recall",
      href: learningUrl(scope, { tab: "flashcards" }),
      primary: false,
    },
    {
      key: "analytics",
      icon: BarChart3,
      label: "Analytics",
      description: `How you're doing in ${detail.chapter.subject}`,
      href: analyticsHref(detail.chapter.subjectSlug),
      primary: false,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map(({ key, icon: Icon, label, description, href, primary }) => (
        <Link
          key={key}
          href={href}
          className={`group flex min-h-[4.5rem] min-w-0 items-center gap-3 rounded-2xl border p-4 transition motion-reduce:transition-none ${
            primary
              ? "border-transparent bg-primary text-white shadow-[0_10px_26px_rgba(63,111,87,0.26)] hover:bg-primary-strong"
              : "border-hairline bg-surface text-ink hover:border-primary/30"
          }`}
        >
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
              primary ? "bg-white/15" : "bg-primary-tint text-primary"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{label}</span>
            <span
              className={`block truncate text-xs ${primary ? "text-white/80" : "text-ink-mute"}`}
            >
              {description}
            </span>
          </span>
          <ArrowRight
            className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Link>
      ))}
    </div>
  );
}
