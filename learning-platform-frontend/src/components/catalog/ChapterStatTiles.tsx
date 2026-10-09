"use client";

import { Bookmark, CheckCircle2, Gauge, Target, Timer } from "lucide-react";
import { DIFFICULTY_TONE, formatStudyTime, scoreTone } from "@/lib/catalog";
import type { CatalogChapterDetail } from "@/lib/catalog-types";

export default function ChapterStatTiles({
  detail,
}: {
  detail: CatalogChapterDetail;
}) {
  const { chapter, bookmarkedCount } = detail;
  const studyTime = formatStudyTime(chapter.studyMinutes);

  const tiles = [
    {
      icon: Timer,
      label: "Study time",
      value: studyTime ?? "—",
      tone: "text-ink",
    },
    {
      icon: Gauge,
      label: "Difficulty",
      value: chapter.difficulty ?? "—",
      tone: "text-ink",
      badge: chapter.difficulty ? DIFFICULTY_TONE[chapter.difficulty] : null,
    },
    {
      icon: CheckCircle2,
      label: "Topics mastered",
      value: `${chapter.masteredTopics}/${chapter.topicCount}`,
      tone: "text-ink",
    },
    {
      icon: Target,
      label: "Your score",
      value: chapter.score === null ? "—" : `${chapter.score}%`,
      tone: scoreTone(chapter.score),
    },
    {
      icon: Bookmark,
      label: "Bookmarked",
      value: String(bookmarkedCount),
      tone: "text-ink",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map(({ icon: Icon, label, value, tone, badge }) => (
        <div
          key={label}
          className="min-w-0 rounded-2xl border border-hairline bg-surface p-4 shadow-[0_8px_22px_rgba(20,20,30,0.04)]"
        >
          <dt className="flex items-center gap-2 text-xs font-medium text-ink-mute">
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </dt>
          <dd className="mt-2">
            {badge ? (
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-sm font-bold ${badge}`}
              >
                {value}
              </span>
            ) : (
              <span className={`font-heading text-xl font-bold ${tone}`}>
                {value}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
