"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CircleAlert,
  Flame,
  Layers3,
  Target,
  TrendingUp,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { learningUrl } from "@/lib/learning";
import { useApiResource } from "@/lib/useApiResource";
import type {
  CompetencyBand,
  GrowthPayload,
  GrowthPoint,
  TopicCompetency,
} from "@/lib/growth-types";

const BANDS: CompetencyBand[] = [
  "Beginner",
  "Developing",
  "Proficient",
  "Advanced",
];

function bandIndex(band: CompetencyBand): number {
  return Math.max(0, BANDS.indexOf(band));
}

function buildAreaPath(points: GrowthPoint[], width: number, height: number) {
  if (points.length === 0) return { line: "", area: "" };
  const max = Math.max(points.length - 1, 1);
  const coords = points.map((point, index) => {
    const x = (index / max) * width;
    const y = height - (point.masteryPercent / 100) * height;
    return [x, y] as const;
  });
  const line = coords
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return { line, area };
}

function readinessLabel(score: number): string {
  if (score >= 80) return "Exam-ready";
  if (score >= 60) return "Building well";
  if (score >= 35) return "Needs repair";
  return "Needs baseline";
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

function groupBySubject(topics: TopicCompetency[]) {
  const groups = new Map<string, TopicCompetency[]>();
  for (const topic of topics) {
    groups.set(topic.subject, [...(groups.get(topic.subject) ?? []), topic]);
  }
  return Array.from(groups.entries()).map(([subject, subjectTopics]) => {
    const score = average(subjectTopics.map((topic) => topic.score));
    const weakCount = subjectTopics.filter((topic) => topic.score < 55).length;
    return {
      subject,
      score,
      weakCount,
      label: readinessLabel(score),
      tracked: subjectTopics.length,
    };
  });
}

function groupByChapter(topics: TopicCompetency[]) {
  const groups = new Map<string, TopicCompetency[]>();
  for (const topic of topics) {
    const key = `${topic.subject}::${topic.chapter}`;
    groups.set(key, [...(groups.get(key) ?? []), topic]);
  }
  return Array.from(groups.entries())
    .map(([key, chapterTopics]) => {
      const [subject, chapter] = key.split("::");
      const score = average(chapterTopics.map((topic) => topic.score));
      return {
        subject,
        chapter,
        score,
        tracked: chapterTopics.length,
        weakestTopic: chapterTopics
          .slice()
          .sort((a, b) => a.score - b.score)[0],
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);
}

function ScoreRing({ score, band }: { score: number; band: CompetencyBand }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative grid h-[132px] w-[132px] shrink-0 place-items-center">
      <svg
        viewBox="0 0 132 132"
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke="#ececf0"
          strokeWidth="9"
        />
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke="#3f6f57"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-heading text-[2rem] font-semibold leading-none text-ink">
          {score}
        </span>
        <span className="mt-1 text-[11px] font-medium text-ink-mute">
          {band}
        </span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-ink-soft">{label}</span>
        <span className="font-medium text-ink">{percent}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full bg-primary/80 transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function GrowthSkeleton() {
  return (
    <section className="mt-10 animate-fade">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-4 w-36 rounded-full skeleton" />
          <div className="mt-3 h-8 w-64 rounded-full skeleton" />
        </div>
        <div className="h-4 w-44 rounded-full skeleton" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="rounded-2xl bg-surface p-5 hairline elevate-sm"
          >
            <div className="h-4 w-24 rounded-full skeleton" />
            <div className="mt-5 h-8 w-20 rounded-full skeleton" />
            <div className="mt-5 h-2 w-full rounded-full skeleton" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="h-72 rounded-2xl bg-surface hairline elevate-sm skeleton" />
        <div className="h-72 rounded-2xl bg-surface hairline elevate-sm skeleton" />
      </div>
    </section>
  );
}

export default function GrowthPanel() {
  const fetchGrowth = useCallback(
    () => apiFetch<GrowthPayload>("/api/learning/growth"),
    [],
  );
  const { data, loading, error } = useApiResource(
    fetchGrowth,
    "Readiness could not be loaded.",
  );

  const chart = useMemo(
    () => buildAreaPath(data?.timeline ?? [], 320, 104),
    [data?.timeline],
  );
  const subjectReadiness = useMemo(
    () => groupBySubject(data?.topics ?? []),
    [data?.topics],
  );
  const chapterPreview = useMemo(
    () => groupByChapter(data?.topics ?? []),
    [data?.topics],
  );

  if (loading) return <GrowthSkeleton />;

  if (error || !data) {
    return (
      <section className="mt-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <CircleAlert className="h-4 w-4 text-danger" aria-hidden="true" />
          Readiness map unavailable
        </div>
        <p className="mt-4 rounded-2xl bg-surface p-5 text-sm text-ink-soft hairline">
          {error ?? "Readiness is not available yet."}
        </p>
      </section>
    );
  }

  const { overall, topics, timeline } = data;
  const hasTrend = timeline.length >= 2;

  return (
    <section className="mt-10 animate-rise" style={{ animationDelay: "150ms" }}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Readiness map
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink">
            Subject readiness and chapter priorities
          </h2>
        </div>
        <span className="text-[13px] text-ink-mute">
          {overall.topicsTracked} topic{overall.topicsTracked === 1 ? "" : "s"}{" "}
          tracked from real attempts
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {subjectReadiness.length > 0 ? (
          subjectReadiness.map((subject) => (
            <article
              key={subject.subject}
              className="group rounded-2xl bg-surface p-5 transition duration-300 hairline elevate-sm hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(20,20,30,0.07)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {subject.subject}
                  </p>
                  <p className="mt-1 text-xs text-ink-mute">
                    {subject.tracked} tracked topic
                    {subject.tracked === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {subject.label}
                </span>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <span className="font-heading text-3xl font-semibold text-ink">
                  {subject.score}%
                </span>
                <span className="text-xs font-medium text-ink-mute">
                  {subject.weakCount} repair
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-700"
                  style={{ width: `${subject.score}%` }}
                />
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl bg-surface p-5 text-sm leading-6 text-ink-soft hairline md:col-span-3">
            Subject readiness appears after the student completes diagnostics or
            adaptive practice.
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl bg-surface p-6 hairline elevate-sm">
          <div className="flex items-center gap-6">
            <ScoreRing score={overall.score} band={overall.band} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-ink-mute">Overall competency</p>
              <div className="mt-3 space-y-1.5">
                {BANDS.map((band, index) => {
                  const reached = index <= bandIndex(overall.band);
                  return (
                    <div key={band} className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          reached ? "bg-primary" : "bg-black/[0.12]"
                        }`}
                      />
                      <span
                        className={`text-[13px] ${
                          index === bandIndex(overall.band)
                            ? "font-semibold text-ink"
                            : reached
                              ? "text-ink-soft"
                              : "text-ink-mute"
                        }`}
                      >
                        {band}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-canvas p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-ink-mute">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                Momentum
              </div>
              <p className="mt-1 font-heading text-lg font-semibold text-ink">
                {overall.momentum > 0 ? "+" : ""}
                {overall.momentum}
                <span className="ml-0.5 text-xs font-normal text-ink-mute">
                  pts
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-canvas p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-ink-mute">
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                On track
              </div>
              <p className="mt-1 font-heading text-lg font-semibold text-ink">
                {overall.positiveStreak}
                <span className="ml-0.5 text-xs font-normal text-ink-mute">
                  round{overall.positiveStreak === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-surface p-6 hairline elevate-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[13px] text-ink-mute">
                <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                Mastery over time
              </p>
              <div className="mt-3">
                {hasTrend ? (
                  <svg
                    viewBox="0 0 320 104"
                    className="h-28 w-full"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="growthFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3f6f57"
                          stopOpacity="0.18"
                        />
                        <stop
                          offset="100%"
                          stopColor="#3f6f57"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path d={chart.area} fill="url(#growthFill)" />
                    <path
                      d={chart.line}
                      fill="none"
                      stroke="#3f6f57"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-xl bg-canvas px-5 text-center text-[13px] text-ink-mute">
                    The growth curve draws itself as the student completes real
                    rounds.
                  </div>
                )}
              </div>
            </div>

            <div className="grid min-w-0 gap-2.5 sm:grid-cols-2 xl:w-72 xl:grid-cols-1">
              <BreakdownBar
                label="Accuracy"
                value={overall.breakdown.accuracy}
              />
              <BreakdownBar
                label="Difficulty reached"
                value={overall.breakdown.difficulty}
              />
              <BreakdownBar
                label="Cognitive depth"
                value={overall.breakdown.bloom}
              />
              <BreakdownBar
                label="Consistency"
                value={
                  overall.breakdown.consistency || overall.breakdown.accuracy
                }
              />
            </div>
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-2xl bg-surface p-5 hairline elevate-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Layers3 className="h-4 w-4 text-primary" aria-hidden="true" />
              Chapter and topic preview
            </p>
            <p className="mt-1 text-xs text-ink-mute">
              Ordered by weakest tracked chapter, so the next repair area is
              obvious.
            </p>
          </div>
          <BookOpen
            className="hidden h-5 w-5 text-ink-mute sm:block"
            aria-hidden="true"
          />
        </div>

        {chapterPreview.length > 0 ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {chapterPreview.map((chapter) => (
              <Link
                key={`${chapter.subject}-${chapter.chapter}`}
                href={learningUrl(
                  {
                    subject: chapter.weakestTopic.subject,
                    chapter: chapter.weakestTopic.chapter,
                    topic: chapter.weakestTopic.topic,
                  },
                  { tab: "practice" },
                )}
                className="group block rounded-2xl bg-canvas p-4 transition duration-300 hover:bg-surface hover:shadow-[0_12px_30px_rgba(20,20,30,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {chapter.chapter}
                    </p>
                    <p className="mt-1 truncate text-xs text-ink-mute">
                      {chapter.subject} • weakest: {chapter.weakestTopic.topic}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink-soft hairline">
                    {chapter.score}%
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                    <span
                      className="block h-full rounded-full bg-primary transition-[width] duration-700"
                      style={{ width: `${chapter.score}%` }}
                    />
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-canvas p-4 text-sm leading-6 text-ink-soft">
            Chapter priorities appear after the student completes topic-level
            practice or tests.
          </p>
        )}

        {topics.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {topics.slice(0, 8).map((topic) => (
              <span
                key={`${topic.subject}-${topic.chapter}-${topic.topic}`}
                className="rounded-full bg-primary-tint px-3 py-1.5 text-[11px] font-semibold text-primary"
              >
                {topic.topic} • {topic.bloomLevel} • {topic.difficulty}
              </span>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
