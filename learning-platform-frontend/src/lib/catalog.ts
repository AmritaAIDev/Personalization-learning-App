import type {
  CatalogChapterSummary,
  CatalogSubjectChapters,
  CatalogTopicDetail,
  ChapterDifficulty,
  ChapterProgressStatus,
  TopicProgressStatus,
} from "./catalog-types";

export const ALL_UNITS = "all";

/** Path segments are encoded defensively; slugs are already URL-safe. */
export function subjectHref(subjectSlug: string): string {
  return `/subjects/${encodeURIComponent(subjectSlug)}`;
}

export function chapterHref(subjectSlug: string, chapterSlug: string): string {
  return `${subjectHref(subjectSlug)}/${encodeURIComponent(chapterSlug)}`;
}

export const CHAPTER_STATUS: Record<
  ChapterProgressStatus,
  { label: string; tone: string; cta: string }
> = {
  NOT_STARTED: {
    label: "Not started",
    tone: "bg-canvas text-ink-mute border border-hairline",
    cta: "Start chapter",
  },
  IN_PROGRESS: {
    label: "In progress",
    tone: "bg-info-tint text-info",
    cta: "Continue",
  },
  NEEDS_WORK: {
    label: "Needs work",
    tone: "bg-danger-tint text-danger",
    cta: "Continue",
  },
  MASTERED: {
    label: "Mastered",
    tone: "bg-success-tint text-success",
    cta: "Review chapter",
  },
};

export const TOPIC_STATUS: Record<
  TopicProgressStatus,
  { label: string; tone: string }
> = {
  NOT_STARTED: { label: "Not started", tone: "text-ink-mute" },
  ACTIVE: { label: "In progress", tone: "text-info" },
  PAUSED: { label: "Foundation needed", tone: "text-warning" },
  MASTERED: { label: "Mastered", tone: "text-success" },
};

export const DIFFICULTY_TONE: Record<ChapterDifficulty, string> = {
  Easy: "bg-success-tint text-success",
  Medium: "bg-warning-tint text-warning",
  Hard: "bg-danger-tint text-danger",
};

export function scoreTone(score: number | null): string {
  if (score === null) return "text-ink-mute";
  if (score >= 70) return "text-success";
  if (score >= 40) return "text-warning";
  return "text-danger";
}

/** "90 min", "1 h 30 min", or null when unknown. */
export function formatStudyTime(minutes: number | null): string | null {
  if (minutes === null || !Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function filterChaptersByUnit(
  chapters: readonly CatalogChapterSummary[],
  unit: string,
): CatalogChapterSummary[] {
  if (unit === ALL_UNITS) return [...chapters];
  return chapters.filter((chapter) => chapter.unit === unit);
}

/** Falls back to "all" when the selected unit no longer exists in the data. */
export function resolveUnit(
  data: Pick<CatalogSubjectChapters, "units">,
  selected: string,
): string {
  return selected === ALL_UNITS ||
    data.units.some((unit) => unit.name === selected)
    ? selected
    : ALL_UNITS;
}

export interface SubjectStats {
  chapters: number;
  started: number;
  mastered: number;
  averageScore: number | null;
  startedPercent: number;
}

export function subjectStats(
  chapters: readonly CatalogChapterSummary[],
): SubjectStats {
  const scored = chapters.flatMap((chapter) =>
    chapter.score === null ? [] : [chapter.score],
  );
  const started = chapters.filter(
    (chapter) => chapter.status !== "NOT_STARTED",
  ).length;
  return {
    chapters: chapters.length,
    started,
    mastered: chapters.filter((chapter) => chapter.status === "MASTERED")
      .length,
    averageScore:
      scored.length > 0
        ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length)
        : null,
    startedPercent:
      chapters.length > 0 ? Math.round((started / chapters.length) * 100) : 0,
  };
}

/**
 * The topic a chapter-level "Continue" should open: the weakest topic in
 * progress, else the first untouched one, else a paused one, else (all
 * mastered) the first for a refresher. Undefined for an empty chapter.
 */
export function pickFocusTopic(
  topics: readonly CatalogTopicDetail[],
): CatalogTopicDetail | undefined {
  const active = topics
    .filter((topic) => topic.status === "ACTIVE")
    .sort((a, b) => (a.score ?? 101) - (b.score ?? 101));
  return (
    active[0] ??
    topics.find((topic) => topic.status === "NOT_STARTED") ??
    topics.find((topic) => topic.status === "PAUSED") ??
    topics[0]
  );
}

export function pluralize(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}
