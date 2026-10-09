"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen } from "lucide-react";
import {
  barTone,
  chapterHref,
  formatWeekLabel,
  pluralize,
  scoreTone,
  subjectHref,
} from "@/lib/catalog";
import type { SubjectAnalytics, TopicStat } from "@/lib/catalog-types";
import { learningUrl } from "@/lib/learning";
import { getSubjectTheme } from "@/lib/subject-theme";
import BloomPanel from "./BloomPanel";
import { InsightCards, SkillCards } from "./InsightCards";
import MasteryStars from "./MasteryStars";
import RadarChart from "./RadarChart";
import Tabs from "./Tabs";
import TrendChart from "./TrendChart";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "bloom", label: "Bloom's taxonomy" },
  { id: "chapters", label: "Chapters" },
  { id: "topics", label: "Topics" },
] as const;

function pct(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function Banner({ data }: { data: SubjectAnalytics }) {
  const theme = getSubjectTheme(data.subject.name);
  const Icon = theme.icon;
  const stats = [
    {
      label: "Chapters completed",
      value: `${data.chaptersCompleted}/${data.chapters.length}`,
    },
    { label: "Formula accuracy", value: pct(data.recall.accuracy) },
    { label: "Numerical accuracy", value: pct(data.application.accuracy) },
    { label: "Questions answered", value: String(data.overall.answered) },
  ];
  return (
    <section
      className="overflow-hidden rounded-[1.75rem] p-5 text-white shadow-[0_18px_44px_rgba(20,20,30,0.12)] sm:p-7"
      style={{ background: theme.gradient }}
      aria-labelledby="subject-analytics-heading"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1
              id="subject-analytics-heading"
              className="truncate font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {data.subject.name} analytics
            </h1>
            <div className="mt-1">
              <MasteryStars
                mastery={data.mastery}
                showNext
                tone="text-white"
                labelTone="text-white"
              />
              {data.mastery ? null : (
                <p className="text-sm text-white/80">
                  Your mastery level appears after your first answers.
                </p>
              )}
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[30rem]">
          {stats.map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-xl bg-white/12 px-3 py-2.5 text-center backdrop-blur-sm"
            >
              <dt className="truncate text-[11px] font-medium text-white/75">
                {item.label}
              </dt>
              <dd className="mt-0.5 font-heading text-xl font-bold">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-hairline bg-surface p-4 sm:p-5">
      <h3 className="font-heading text-base font-bold text-ink">{title}</h3>
      {hint ? <p className="mt-1 text-xs text-ink-mute">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function OverviewPanel({ data }: { data: SubjectAnalytics }) {
  return (
    <div className="space-y-5">
      {data.hasData ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-hairline bg-canvas p-5">
          <div className="flex min-w-0 items-start gap-3">
            <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-ink-mute" aria-hidden="true" />
            <p className="min-w-0 text-sm leading-6 text-ink-soft">
              No answers in {data.subject.name} yet. Practise a chapter and your
              accuracy, strengths and trends will show up here.
            </p>
          </div>
          <Link
            href={subjectHref(data.subject.slug)}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong"
          >
            Choose a chapter
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
      <SkillCards skills={data.skills} />
      <InsightCards insights={data.insights} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Strength by unit" hint="Accuracy across each unit of the syllabus.">
          <RadarChart
            label={`${data.subject.name} unit radar`}
            points={data.units.map((unit) => ({
              label: unit.name,
              value: unit.accuracy,
            }))}
          />
          {data.units.length < 3 ? (
            <p className="text-sm text-ink-mute">
              Unit comparison needs at least three units.
            </p>
          ) : null}
        </Card>
        <Card title="Weekly accuracy" hint="Last 8 weeks. Quiet weeks show a dash.">
          <TrendChart points={data.trend} />
        </Card>
      </div>
    </div>
  );
}

function ChaptersPanel({ data }: { data: SubjectAnalytics }) {
  return (
    <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline">
      {data.chapters.map((chapter) => (
        <li key={chapter.slug}>
          <Link
            href={chapterHref(data.subject.slug, chapter.slug)}
            className="group flex min-h-16 flex-col gap-2 bg-surface px-4 py-3 transition hover:bg-canvas motion-reduce:transition-none sm:flex-row sm:items-center sm:gap-4"
          >
            <span className="min-w-0 sm:w-64 sm:shrink-0">
              <span className="block truncate text-sm font-semibold text-ink">
                {chapter.name}
              </span>
              <span className="block truncate text-xs text-ink-mute">
                {chapter.unit ?? "—"} ·{" "}
                {chapter.answered === 0
                  ? "Not attempted"
                  : `${chapter.correct}/${chapter.answered} correct`}
              </span>
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-canvas"
                role="progressbar"
                aria-label={`${chapter.name} accuracy`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={chapter.accuracy ?? 0}
              >
                <span
                  className={`block h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${barTone(chapter.accuracy)}`}
                  style={{ width: `${chapter.accuracy ?? 0}%` }}
                />
              </span>
              <span
                className={`w-10 shrink-0 text-right font-heading text-sm font-bold ${scoreTone(chapter.accuracy)}`}
              >
                {pct(chapter.accuracy)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TopicList({
  title,
  empty,
  topics,
  subjectName,
}: {
  title: string;
  empty: string;
  topics: readonly TopicStat[];
  subjectName: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-hairline bg-surface p-4 sm:p-5">
      <h3 className="font-heading text-base font-bold text-ink">{title}</h3>
      {topics.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-ink-mute">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {topics.map((topic) => (
            <li key={`${topic.chapter}-${topic.topic}`}>
              <Link
                href={learningUrl({
                  subject: subjectName,
                  chapter: topic.chapter,
                  topic: topic.topic,
                })}
                className="flex min-h-12 items-center gap-3 rounded-xl bg-canvas px-3 py-2 transition hover:bg-primary-tint motion-reduce:transition-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {topic.topic}
                  </span>
                  <span className="block truncate text-xs text-ink-mute">
                    {topic.chapter} · {pluralize(topic.answered, "answer")}
                  </span>
                </span>
                <span
                  className={`shrink-0 font-heading text-sm font-bold ${scoreTone(topic.accuracy)}`}
                >
                  {pct(topic.accuracy)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TopicsPanel({ data }: { data: SubjectAnalytics }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TopicList
        title="Strong topics (70%+)"
        empty="No strong topics yet. Keep practising to build some."
        topics={data.strongTopics}
        subjectName={data.subject.name}
      />
      <TopicList
        title="Weak topics (below 50%)"
        empty={
          data.hasData
            ? "No weak topics right now. Nice work."
            : "Weak topics show up here once you've answered some questions."
        }
        topics={data.weakTopics}
        subjectName={data.subject.name}
      />
    </div>
  );
}

export default function SubjectAnalyticsView({ data }: { data: SubjectAnalytics }) {
  const lastActive = [...data.trend].reverse().find((p) => p.answered > 0);
  return (
    <div className="space-y-6">
      <Banner data={data} />
      {lastActive ? (
        <p className="flex items-center gap-2 text-xs text-ink-mute">
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          Last practised the week of {formatWeekLabel(lastActive.weekStart)}.
        </p>
      ) : null}
      <Tabs
        tabs={TABS}
        label="Subject analytics"
        idPrefix="subject-analytics"
        render={(tab) => {
          if (tab === "overview") return <OverviewPanel data={data} />;
          if (tab === "bloom") {
            return (
              <BloomPanel
                bloom={data.bloom}
                insights={data.insights}
                hasData={data.hasData}
                scopeLabel={data.subject.name}
              />
            );
          }
          if (tab === "chapters") return <ChaptersPanel data={data} />;
          return <TopicsPanel data={data} />;
        }}
      />
    </div>
  );
}
