"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CircleCheck,
  ClipboardCheck,
  Flame,
  GraduationCap,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";
import { learningUrl } from "@/lib/learning";
import { Stagger, StaggerItem } from "@/components/motion/MotionPrimitives";
import type { GrowthPoint } from "@/lib/growth-types";
import type {
  StudentDashboardAction,
  StudentDashboardPayload,
} from "@/lib/student-dashboard-types";

function actionHref(action: StudentDashboardAction): string {
  if (action.kind === "RESUME_DIAGNOSTIC" && action.attemptId) {
    return `/diagnostic/${action.attemptId}`;
  }
  if (action.kind === "REVIEW_MISTAKES") return "/notebook";
  if (action.kind === "CONTINUE_LEARNING" && action.scope) {
    return learningUrl(action.scope, { tab: "practice" });
  }
  return "/topics";
}

function relativeDate(value: string): string {
  const days = Math.floor(
    (Date.now() - new Date(value).getTime()) / 86_400_000,
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function actionIcon(kind: StudentDashboardAction["kind"]) {
  if (kind === "RESUME_DIAGNOSTIC")
    return <ClipboardCheck className="h-4 w-4" />;
  if (kind === "REVIEW_MISTAKES") return <BookOpenCheck className="h-4 w-4" />;
  if (kind === "FIND_TOPIC") return <Search className="h-4 w-4" />;
  return <GraduationCap className="h-4 w-4" />;
}

function actionLabel(kind: StudentDashboardAction["kind"]) {
  if (kind === "RESUME_DIAGNOSTIC") return "baseline";
  if (kind === "REVIEW_MISTAKES") return "repair";
  if (kind === "FIND_TOPIC") return "discover";
  return "learn";
}

function actionTone(kind: StudentDashboardAction["kind"]) {
  if (kind === "REVIEW_MISTAKES")
    return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
  if (kind === "RESUME_DIAGNOSTIC")
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  if (kind === "FIND_TOPIC")
    return "bg-primary-tint text-primary ring-1 ring-primary/10";
  return "bg-emerald-50 text-primary ring-1 ring-primary/10";
}

function momentumPoints(timeline: GrowthPoint[]): string {
  const points = timeline.slice(-8);
  if (points.length < 2) return "";
  const lastIndex = points.length - 1;
  return points
    .map((point, index) => {
      const x = 8 + (index / lastIndex) * 224;
      const y =
        72 - (Math.min(Math.max(point.masteryPercent, 0), 100) / 100) * 56;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function StudentActionCenter({
  data,
}: {
  data: StudentDashboardPayload;
}) {
  const xpIntoLevel = data.student.xp % 250;
  const xpProgress = Math.round((xpIntoLevel / 250) * 100);
  const xpToNextLevel = xpIntoLevel === 0 ? 250 : 250 - xpIntoLevel;
  const momentumHealth = Math.round(
    Math.min(Math.max(50 + data.growth.overall.momentum / 2, 0), 100),
  );

  return (
    <Stagger className="mt-8" aria-label="Student learning desk">
      <StaggerItem className="grid grid-cols-1 gap-5 overflow-hidden rounded-[1.75rem] bg-[radial-gradient(circle_at_top_right,rgba(63,111,87,0.32),transparent_34%),linear-gradient(135deg,#17171d,#222228)] p-5 text-white shadow-[0_18px_42px_rgba(20,20,30,0.15)] lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center sm:p-6">
        <div className="min-w-0">
          <p className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-tint/90 ring-1 ring-white/10">
            Next best action
          </p>
          <h2 className="mt-3 truncate font-heading text-2xl font-bold tracking-tight text-white">
            {data.today.primary.title}
          </h2>
          <p className="mt-1 truncate text-sm text-white/65">
            {data.today.primary.detail}
          </p>
          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-white/60">
              <span>Level {data.student.level} progress</span>
              <span>{xpToNextLevel} XP to next level</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/12">
              <span
                className="block h-full rounded-full bg-primary-tint transition-[width] duration-700 ease-out-soft"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
        <dl className="flex items-center gap-5 border-y border-white/10 py-3 lg:border-x lg:border-y-0 lg:px-5 lg:py-0">
          <DeskStat
            label="Streak"
            value={`${data.student.streak}d`}
            icon={<Flame className="h-3.5 w-3.5" />}
            inverse
          />
          <DeskStat
            label="Mastery"
            value={`${data.growth.overall.score}%`}
            icon={<GraduationCap className="h-3.5 w-3.5" />}
            inverse
          />
          <DeskStat
            label="Reviewed"
            value={`${data.courseProgress.masteredTopics}`}
            icon={<CircleCheck className="h-3.5 w-3.5" />}
            inverse
          />
          <DeskStat
            label="XP"
            value={`${data.student.xp}`}
            icon={<Award className="h-3.5 w-3.5" />}
            inverse
          />
        </dl>
        <Link
          href={actionHref(data.today.primary)}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:bg-primary-tint"
        >
          Open task
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </StaggerItem>

      <StaggerItem className="mt-7 grid grid-cols-1 gap-7 xl:grid-cols-[minmax(0,0.92fr)_minmax(19rem,0.42fr)]">
        <section
          aria-labelledby="plan-heading"
          className="rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_10px_28px_rgba(20,20,30,0.035)]"
        >
          <div className="flex items-end justify-between border-b border-hairline pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                Today
              </p>
              <h2
                id="plan-heading"
                className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink"
              >
                Action rail
              </h2>
            </div>
            <span className="text-xs font-medium text-ink-mute">
              {data.today.actions.length} tasks
            </span>
          </div>
          <ol className="divide-y divide-hairline">
            {data.today.actions.map((action, index) => (
              <li key={action.id}>
                <Link
                  href={actionHref(action)}
                  className="group flex items-center gap-4 rounded-xl px-3 py-4 transition duration-300 ease-out-soft hover:-translate-y-0.5 hover:bg-canvas active:scale-[0.995]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-hairline text-xs font-semibold text-ink-soft transition duration-300 group-hover:border-primary/30 group-hover:bg-white group-hover:text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-bold text-ink">
                      <span className="shrink-0 text-primary">
                        {actionIcon(action.kind)}
                      </span>
                      <span className="truncate">{action.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${actionTone(action.kind)}`}
                      >
                        {actionLabel(action.kind)}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-ink-mute">
                      {action.detail}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-mute transition duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <aside
          className="rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_12px_30px_rgba(20,20,30,0.04)]"
          aria-label="Learning signals"
        >
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight text-ink">
              Signals
            </h2>
            <p className="mt-1 text-xs leading-5 text-ink-mute">
              Three live indicators from your learning evidence.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <SignalCircle
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              label="Mastery"
              value={data.growth.overall.score}
              center={`${data.growth.overall.score}%`}
              detail={`${data.growth.overall.band}. Based on completed topic checkpoints.`}
            />
            <SignalCircle
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              label="Momentum"
              value={momentumHealth}
              center={`${data.growth.overall.momentum > 0 ? "+" : ""}${data.growth.overall.momentum}`}
              detail="Direction of recent mastery movement across completed checkpoints."
            />
            <SignalCircle
              icon={<Target className="h-3.5 w-3.5" />}
              label="Coverage"
              value={data.courseProgress.percent}
              center={`${data.courseProgress.percent}%`}
              detail={`${data.courseProgress.masteredTopics} mastered out of ${data.courseProgress.trackedTopics} tracked topics.`}
            />
          </div>
          <div className="mt-4 rounded-2xl bg-canvas px-3 py-2 text-xs text-ink-soft">
            <Link
              href="/notebook"
              className="flex items-center justify-between gap-3 font-semibold transition hover:text-primary"
            >
              <span>{data.revision.dueCount} review cards due</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-4 border-t border-hairline pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-ink">
                Momentum curve
              </span>
            </div>
            <MomentumGraph timeline={data.growth.timeline} />
          </div>
        </aside>
      </StaggerItem>

      <StaggerItem>
        <SubjectCoverageExplorer subjects={data.subjectCoverage} />
      </StaggerItem>

      <StaggerItem className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[0.88fr_1.12fr]">
        <section
          aria-labelledby="revision-heading"
          className="rounded-[1.5rem] border border-orange-100 bg-[linear-gradient(135deg,#fff,#fff8f1)] p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">
                Repair
              </p>
              <h2
                id="revision-heading"
                className="mt-1 font-heading text-xl font-bold tracking-tight text-ink"
              >
                Review queue
              </h2>
            </div>
            <Link
              href="/notebook"
              className="text-xs font-semibold text-primary hover:text-primary-strong"
            >
              Open notebook
            </Link>
          </div>
          {data.revision.topics.length > 0 ? (
            <div className="mt-5 space-y-3">
              {data.revision.topics.map((topic) => (
                <Link
                  key={`${topic.subject}-${topic.chapter}-${topic.topic}`}
                  href="/notebook"
                  className="group flex items-center gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-orange-100 transition duration-300 ease-out-soft hover:-translate-y-0.5 hover:ring-primary/25"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-700">
                    <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {topic.topic}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-mute">
                      {topic.chapter} · {topic.count} mistakes
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-mute transition group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-ink-soft">
              No review is due now. Your next adaptive task is the best use of
              this session.
            </p>
          )}
        </section>

        <section
          aria-labelledby="activity-heading"
          className="rounded-[1.5rem] border border-hairline bg-white p-5"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Evidence
            </p>
            <h2
              id="activity-heading"
              className="mt-1 font-heading text-xl font-bold tracking-tight text-ink"
            >
              Recent learning
            </h2>
          </div>
          {data.activity.length > 0 ? (
            <ol className="mt-5 space-y-0 border-l border-hairline pl-5">
              {data.activity.map((item) => (
                <li
                  key={item.id}
                  className="relative border-b border-hairline py-3 transition-colors duration-300 hover:bg-canvas last:border-b-0 first:pt-0"
                >
                  <span className="absolute -left-[1.65rem] top-4 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary first:top-0" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">
                        {item.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-ink-mute">
                        {item.detail}
                      </p>
                    </div>
                    <time className="shrink-0 text-[11px] font-medium text-ink-mute">
                      {relativeDate(item.occurredAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-sm leading-6 text-ink-soft">
              Your finished checkpoints and diagnostics will build a learning
              record here.
            </p>
          )}
        </section>
      </StaggerItem>
    </Stagger>
  );
}

function SubjectCoverageExplorer({
  subjects,
}: {
  subjects: StudentDashboardPayload["subjectCoverage"];
}) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(
    subjects[0]?.subject ?? null,
  );
  const selected =
    subjects.find((subject) => subject.subject === selectedSubject) ??
    subjects[0] ??
    null;

  if (!selected) return null;

  return (
    <section
      className="mt-7 rounded-2xl border border-hairline bg-white p-5 shadow-[0_10px_28px_rgba(20,20,30,0.04)] sm:p-6"
      aria-labelledby="subject-map-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            Coverage
          </p>
          <h2
            id="subject-map-heading"
            className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink"
          >
            Course coverage
          </h2>
        </div>
        <div
          className="flex max-w-full gap-1 overflow-x-auto pb-1 custom-scrollbar"
          role="tablist"
          aria-label="Subject filters"
        >
          {subjects.map((subject) => {
            const active = selected.subject === subject.subject;
            return (
              <button
                key={subject.subject}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedSubject(subject.subject)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-[background-color,color,transform] duration-300 ease-out-soft ${
                  active
                    ? "bg-ink text-white shadow-sm"
                    : "bg-canvas text-ink-soft hover:-translate-y-0.5 hover:bg-primary-tint hover:text-primary"
                }`}
              >
                {subject.subject}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-7 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-center">
        <div>
          <div className="flex items-end justify-between">
            <span className="font-heading text-4xl font-bold tracking-tight text-ink">
              {selected.totalTopics}
            </span>
            <span className="mb-1 text-xs font-semibold text-ink-mute">
              reviewed topics
            </span>
          </div>
          <div
            className="mt-3 flex h-3 overflow-hidden rounded-full bg-canvas"
            aria-label={`${selected.subject} topic coverage`}
          >
            {selected.masteredTopics > 0 ? (
              <span
                className="bg-primary transition-[width] duration-700 ease-out-soft"
                style={{
                  width: `${(selected.masteredTopics / selected.totalTopics) * 100}%`,
                }}
              />
            ) : null}
            {selected.activeTopics > 0 ? (
              <span
                className="bg-orange-400 transition-[width] duration-700 ease-out-soft"
                style={{
                  width: `${(selected.activeTopics / selected.totalTopics) * 100}%`,
                }}
              />
            ) : null}
            {selected.pausedTopics > 0 ? (
              <span
                className="bg-rose-400 transition-[width] duration-700 ease-out-soft"
                style={{
                  width: `${(selected.pausedTopics / selected.totalTopics) * 100}%`,
                }}
              />
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-mute">
            <CoverageLegend
              tone="bg-primary"
              label={`${selected.masteredTopics} done`}
            />
            <CoverageLegend
              tone="bg-orange-400"
              label={`${selected.activeTopics} active`}
            />
            {selected.pausedTopics > 0 ? (
              <CoverageLegend
                tone="bg-rose-400"
                label={`${selected.pausedTopics} paused`}
              />
            ) : null}
            <CoverageLegend
              tone="bg-[#dcdce2]"
              label={`${selected.notStartedTopics} next`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 divide-y divide-hairline border-y border-hairline lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {selected.topics.slice(0, 5).map((topic) => (
            <Link
              key={`${topic.chapter}-${topic.topic}`}
              href={learningUrl(topic, { tab: "practice" })}
              className="group flex min-w-0 items-center gap-3 py-3 transition-colors duration-300 hover:bg-canvas lg:px-3"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${coverageTone(topic.status)}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {topic.topic}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-ink-mute">
                  {topic.chapter} · {coverageLabel(topic.status)}
                  {topic.score !== null ? ` · ${topic.score}%` : ""}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-mute transition duration-300 group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoverageLegend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      {label}
    </span>
  );
}

function coverageTone(
  status: "MASTERED" | "ACTIVE" | "PAUSED" | "NOT_STARTED",
): string {
  if (status === "MASTERED") return "bg-primary";
  if (status === "ACTIVE") return "bg-orange-400";
  if (status === "PAUSED") return "bg-rose-400";
  return "bg-[#c6c6ce]";
}

function coverageLabel(
  status: "MASTERED" | "ACTIVE" | "PAUSED" | "NOT_STARTED",
): string {
  if (status === "MASTERED") return "Mastered";
  if (status === "ACTIVE") return "In progress";
  if (status === "PAUSED") return "Paused";
  return "Not started";
}

function DeskStat({
  label,
  value,
  icon,
  inverse = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  inverse?: boolean;
}) {
  return (
    <div>
      <dt
        className={`flex items-center gap-1 text-[10px] font-semibold ${inverse ? "text-white/55" : "text-ink-mute"}`}
      >
        {icon}
        {label}
      </dt>
      <dd
        className={`mt-1 text-base font-semibold ${inverse ? "text-white" : "text-ink"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function SignalCircle({
  icon,
  label,
  center,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  center: string;
  value: number;
  detail: string;
}) {
  const safeValue = Math.min(Math.max(value, 0), 100);
  const circumference = 226.2;
  return (
    <div
      className="group relative rounded-2xl border border-hairline bg-canvas px-2 py-3 text-center transition duration-300 ease-out-soft hover:-translate-y-1 hover:border-primary/25 hover:bg-white hover:shadow-[0_12px_28px_rgba(20,20,30,0.07)] focus-within:-translate-y-1"
      title={detail}
    >
      <div
        className="relative mx-auto h-[4.7rem] w-[4.7rem]"
        role="img"
        aria-label={`${label}: ${center}`}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="#ececf0"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="#3f6f57"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - safeValue / 100)}
            className="transition-[stroke-dashoffset] duration-700 ease-out-soft"
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-primary">{icon}</span>
          <span className="mt-0.5 font-heading text-[15px] font-bold leading-none text-ink">
            {center}
          </span>
        </span>
      </div>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink">
        {label}
      </p>
      <p className="mx-auto mt-1 max-h-0 max-w-[8.5rem] overflow-hidden text-[10px] leading-4 text-ink-mute opacity-0 transition-all duration-300 group-hover:max-h-16 group-hover:opacity-100 group-focus-within:max-h-16 group-focus-within:opacity-100">
        {detail}
      </p>
    </div>
  );
}

function MomentumGraph({ timeline }: { timeline: GrowthPoint[] }) {
  const points = momentumPoints(timeline);
  if (!points) {
    return (
      <p className="mt-4 text-xs leading-5 text-ink-mute">
        The growth curve appears after two completed checkpoints.
      </p>
    );
  }
  return (
    <svg
      viewBox="0 0 240 80"
      className="mt-3 h-20 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Mastery momentum over recent completed checkpoints"
    >
      <defs>
        <linearGradient id="dashboardMomentum" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f6f57" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3f6f57" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`${points} 232,72 8,72`}
        fill="url(#dashboardMomentum)"
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#3f6f57"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dashboard-draw"
      />
    </svg>
  );
}
