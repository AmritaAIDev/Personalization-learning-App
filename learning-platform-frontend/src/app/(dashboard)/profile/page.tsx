"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Award,
  Crown,
  Flame,
  GraduationCap,
  LoaderCircle,
  Medal,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Stagger, StaggerItem, Pressable } from "@/components/motion/MotionPrimitives";
import CountUp from "@/components/motion/CountUp";
import type { StudentDashboardPayload } from "@/lib/student-dashboard-types";
import type { HistoryItem } from "@/lib/diagnostic-types";

/* ------------------------------- gamification ------------------------------ */

type Tier = { name: string; min: number; icon: LucideIcon };

const TIERS: Tier[] = [
  { name: "Rookie", min: 1, icon: Sparkles },
  { name: "Riser", min: 5, icon: TrendingUp },
  { name: "Scholar", min: 10, icon: GraduationCap },
  { name: "Achiever", min: 20, icon: Medal },
  { name: "Topper", min: 35, icon: Crown },
  { name: "Legend", min: 50, icon: Trophy },
];

function tierFor(level: number) {
  let current = TIERS[0];
  for (const tier of TIERS) if (level >= tier.min) current = tier;
  const next = TIERS.find((tier) => tier.min > level) ?? null;
  const span = next ? next.min - current.min : 1;
  const progress = next
    ? Math.min(100, Math.round(((level - current.min) / span) * 100))
    : 100;
  return { current, next, progress };
}

type Badge = {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  current: number;
  goal: number;
};

function badgeList(input: {
  answered: number;
  streak: number;
  mastered: number;
  accuracy: number;
  diagnostics: number;
  momentum: number;
}): Badge[] {
  return [
    { id: "first-steps", label: "First Steps", desc: "Answer your first question", icon: Zap, current: input.answered, goal: 1 },
    { id: "century", label: "Century Club", desc: "Answer 100 questions", icon: Target, current: input.answered, goal: 100 },
    { id: "kindling", label: "Kindling", desc: "Reach a 3-day streak", icon: Flame, current: input.streak, goal: 3 },
    { id: "on-fire", label: "On Fire", desc: "Reach a 7-day streak", icon: Flame, current: input.streak, goal: 7 },
    { id: "unstoppable", label: "Unstoppable", desc: "Reach a 30-day streak", icon: Rocket, current: input.streak, goal: 30 },
    { id: "first-mastery", label: "First Mastery", desc: "Master your first topic", icon: Award, current: input.mastered, goal: 1 },
    { id: "topic-master", label: "Topic Master", desc: "Master 5 topics", icon: Medal, current: input.mastered, goal: 5 },
    { id: "sharpshooter", label: "Sharpshooter", desc: "Reach 80% accuracy", icon: Crown, current: Math.round(input.accuracy), goal: 80 },
    { id: "diagnostician", label: "Diagnostician", desc: "Complete a diagnostic", icon: GraduationCap, current: input.diagnostics, goal: 1 },
  ];
}

/* --------------------------------- helpers --------------------------------- */

const DAY_MS = 86_400_000;
const HEATMAP_WEEKS = 13;

function buildHeatmap(activity: StudentDashboardPayload["activity"]) {
  const counts = new Map<string, number>();
  for (const item of activity) {
    const key = new Date(item.occurredAt).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  // End on today, walk back to the start of the week HEATMAP_WEEKS ago.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = today.getTime();
  const start = end - (HEATMAP_WEEKS * 7 - 1 - today.getDay()) * DAY_MS;
  const weeks: Array<Array<{ key: string; count: number; level: number }>> = [];
  for (let w = 0; w < HEATMAP_WEEKS; w += 1) {
    const week: Array<{ key: string; count: number; level: number }> = [];
    for (let d = 0; d < 7; d += 1) {
      const time = start + (w * 7 + d) * DAY_MS;
      const key = new Date(time).toISOString().slice(0, 10);
      const count = time > end ? -1 : (counts.get(key) ?? 0);
      const level = count <= 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
      week.push({ key, count, level });
    }
    weeks.push(week);
  }
  const activeDays = [...counts.values()].filter((n) => n > 0).length;
  return { weeks, activeDays };
}

function strongestSkill(breakdown?: StudentDashboardPayload["growth"]["overall"]["breakdown"]) {
  if (!breakdown) return null;
  const dims: Array<[string, number]> = [
    ["Accuracy", breakdown.accuracy],
    ["Difficulty", breakdown.difficulty],
    ["Bloom depth", breakdown.bloom],
    ["Speed", breakdown.speed],
    ["Consistency", breakdown.consistency],
  ];
  return dims.reduce((best, dim) => (dim[1] > best[1] ? dim : best))[0];
}

type ProfileUser = {
  name?: string;
  xp?: number;
  level?: number;
  streak?: number;
} | null;

function buildProfileModel(
  data: StudentDashboardPayload | null,
  history: HistoryItem[],
  user: ProfileUser,
) {
  const level = data?.student.level ?? user?.level ?? 1;
  const xp = data?.student.xp ?? user?.xp ?? 0;
  const streak = data?.student.streak ?? user?.streak ?? 0;
  const overall = data?.growth.overall;
  const accuracy = overall?.breakdown.accuracy ?? 0;
  const answered = overall?.answered ?? 0;
  const mastered = overall?.mastered ?? data?.courseProgress.masteredTopics ?? 0;
  const momentum = overall?.momentum ?? 0;
  const competency = overall?.score ?? 0;
  const band = overall?.band ?? "Beginner";
  const bestDiagnostic = history.reduce(
    (max, item) => Math.max(max, item.scorePercent),
    0,
  );
  const badges = badgeList({
    answered,
    streak,
    mastered,
    accuracy,
    diagnostics: history.length,
    momentum,
  });
  return {
    level,
    xp,
    streak,
    accuracy,
    answered,
    mastered,
    momentum,
    competency,
    band,
    bestDiagnostic,
    badges,
    tier: tierFor(level),
    heatmap: buildHeatmap(data?.activity ?? []),
    breakdown: overall?.breakdown,
    subjects: data?.subjectCoverage ?? [],
    strongest: strongestSkill(overall?.breakdown),
    unlocked: badges.filter((b) => b.current >= b.goal).length,
  };
}

type ProfileModel = ReturnType<typeof buildProfileModel>;

/* ---------------------------------- page ----------------------------------- */

export default function ProfilePage() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardPayload | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [dashboard, hist] = await Promise.allSettled([
      apiFetch<StudentDashboardPayload>("/api/dashboard/student"),
      apiFetch<HistoryItem[]>("/api/diagnostics/history"),
    ]);
    if (dashboard.status === "fulfilled") {
      setData(dashboard.value);
      setError(null);
    } else {
      setError("Your profile could not be loaded right now.");
    }
    if (hist.status === "fulfilled") setHistory(hist.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const clearHistory = async () => {
    if (
      !window.confirm(
        "Clear completed diagnostic history? Active attempts are kept.",
      )
    )
      return;
    setClearing(true);
    try {
      await apiFetch<{ clearedAttempts: number }>("/api/diagnostics/history", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      setHistory([]);
    } finally {
      setClearing(false);
    }
  };

  const model = useMemo(
    () => buildProfileModel(data, history, user),
    [data, history, user],
  );
  const TierIcon = model.tier.current.icon;

  const firstName = (data?.student.name ?? user?.name ?? "learner").split(" ")[0];

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="mx-auto max-w-6xl p-4 pb-24 sm:p-8 lg:p-10">
      {error ? (
        <p className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      {/* Identity hero */}
      <StaggerItemHero model={model} name={data?.student.name ?? user?.name} email={user?.email} />

      {/* Personalized insight */}
      <p className="mt-4 flex items-start gap-2 rounded-2xl border border-hairline bg-surface px-4 py-3 text-sm leading-6 text-ink-soft">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>{buildInsight(firstName, model)}</span>
      </p>

      <Stagger className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Streak + activity */}
        <StaggerItem className="rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-500">
                <Flame className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-bold text-ink">Streak</h2>
                <p className="text-xs text-ink-mute">{model.heatmap.activeDays} active days recently</p>
              </div>
            </div>
            <span className="font-heading text-3xl font-bold text-ink">
              <CountUp value={model.streak} />
              <span className="ml-1 align-top text-sm font-semibold text-ink-mute">days</span>
            </span>
          </div>
          <Heatmap weeks={model.heatmap.weeks} />
        </StaggerItem>

        {/* XP / tier progress */}
        <StaggerItem className="flex flex-col rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-tint text-primary">
              <TierIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-ink">{model.tier.current.name}</h2>
              <p className="text-xs text-ink-mute">Level {model.level} · {model.xp} XP</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-mute">
              <span>Progress to {model.tier.next?.name ?? "max tier"}</span>
              <span className="text-primary">{model.tier.progress}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-canvas">
              <Bar percent={model.tier.progress} />
            </div>
          </div>
          <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
            <MiniStat label="Questions" value={model.answered} />
            <MiniStat label="Accuracy" value={model.accuracy} suffix="%" />
          </div>
        </StaggerItem>
      </Stagger>

      {/* Achievements */}
      <section className="mt-5 rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-tint text-primary">
              <Trophy className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-ink">Achievements</h2>
              <p className="text-xs text-ink-mute">{model.unlocked} of {model.badges.length} unlocked</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {model.badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </section>

      {/* Competency + subjects */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {model.breakdown ? (
          <section className="rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
            <h2 className="font-heading text-lg font-bold text-ink">Skill profile</h2>
            <p className="text-xs text-ink-mute">Competency {model.competency}% · {model.band}</p>
            <Radar breakdown={model.breakdown} />
          </section>
        ) : null}

        <section className="rounded-[1.5rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
          <h2 className="font-heading text-lg font-bold text-ink">Subject mastery</h2>
          <p className="text-xs text-ink-mute">Topics mastered across your courses</p>
          <div className="mt-5 space-y-4">
            {model.subjects.length === 0 ? (
              <p className="text-sm text-ink-soft">Start a topic to build your subject mastery here.</p>
            ) : (
              model.subjects.map((subject) => (
                <div key={subject.subject}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">{subject.subject}</span>
                    <span className="text-xs font-semibold text-ink-mute">
                      {subject.masteredTopics}/{subject.totalTopics}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
                    <Bar
                      percent={
                        subject.totalTopics > 0
                          ? Math.round((subject.masteredTopics / subject.totalTopics) * 100)
                          : 0
                      }
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Account */}
      <section className="mt-5 flex flex-col gap-3 rounded-[1.5rem] border border-hairline bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-heading text-base font-bold text-ink">Account</h2>
          <p className="mt-0.5 text-xs text-ink-mute">
            Clearing history removes completed diagnostic records only — never your account or active attempts.
          </p>
        </div>
        {history.length > 0 ? (
          <button
            type="button"
            onClick={() => void clearHistory()}
            disabled={clearing}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-hairline px-4 py-2 text-sm font-semibold text-ink-soft transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
          >
            {clearing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Clear diagnostic history
          </button>
        ) : null}
      </section>
    </div>
  );
}

/* ------------------------------ subcomponents ------------------------------ */

function StaggerItemHero({
  model,
  name,
  email,
}: {
  model: ProfileModel;
  name?: string;
  email?: string;
}) {
  const TierIcon = model.tier.current.icon;
  const initial = (name ?? "L").charAt(0).toUpperCase();
  return (
    <header className="animate-rise relative overflow-hidden rounded-[1.75rem] bg-ink p-6 text-white shadow-[0_20px_50px_rgba(20,20,30,0.22)] sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-strong text-2xl font-bold shadow-lg">
            {initial}
          </span>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-tint">
              <TierIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {model.tier.current.name}
            </span>
            <h1 className="mt-1.5 truncate font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {name}
            </h1>
            {email ? <p className="truncate text-sm text-white/55">{email}</p> : null}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <HeroStat label="Level" value={model.level} icon={<Zap className="h-3.5 w-3.5" />} />
          <HeroStat label="XP" value={model.xp} icon={<Sparkles className="h-3.5 w-3.5" />} />
          <HeroStat label="Streak" value={model.streak} icon={<Flame className="h-3.5 w-3.5" />} />
        </div>
      </div>
    </header>
  );
}

function HeroStat({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-center">
      <p className="flex items-center justify-center gap-1 text-[10px] font-semibold text-white/55">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 font-heading text-xl font-bold sm:text-2xl">
        <CountUp value={value} />
      </p>
    </div>
  );
}

function MiniStat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl bg-canvas px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-mute">{label}</p>
      <p className="mt-0.5 font-heading text-lg font-bold text-ink">
        <CountUp value={value} suffix={suffix} />
      </p>
    </div>
  );
}

function Bar({ percent }: { percent: number }) {
  return (
    <span
      className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-out-soft"
      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
    />
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const unlocked = badge.current >= badge.goal;
  const pct = Math.min(100, Math.round((badge.current / badge.goal) * 100));
  const Icon = badge.icon;
  return (
    <Pressable className="h-full">
      <div
        className={`flex h-full flex-col items-center rounded-2xl border p-3.5 text-center transition ${
          unlocked
            ? "border-primary/25 bg-primary-tint/45"
            : "border-hairline bg-canvas"
        }`}
      >
        <span
          className={`grid h-11 w-11 place-items-center rounded-xl ${
            unlocked ? "bg-primary text-white shadow-[0_8px_18px_rgba(63,111,87,0.28)]" : "bg-white text-ink-mute ring-1 ring-hairline"
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className={`mt-2 text-[13px] font-bold ${unlocked ? "text-ink" : "text-ink-soft"}`}>
          {badge.label}
        </p>
        <p className="mt-0.5 text-[11px] leading-4 text-ink-mute">{badge.desc}</p>
        {unlocked ? (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            <Award className="h-3 w-3" /> Unlocked
          </span>
        ) : (
          <div className="mt-2 w-full">
            <div className="h-1.5 overflow-hidden rounded-full bg-white">
              <Bar percent={pct} />
            </div>
            <p className="mt-1 text-[10px] font-semibold text-ink-mute">
              {Math.min(badge.current, badge.goal)}/{badge.goal}
            </p>
          </div>
        )}
      </div>
    </Pressable>
  );
}

function Heatmap({
  weeks,
}: {
  weeks: Array<Array<{ key: string; count: number; level: number }>>;
}) {
  const tones = ["bg-canvas", "bg-primary/25", "bg-primary/45", "bg-primary/70", "bg-primary"];
  return (
    <div className="mt-5">
      <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid shrink-0 grid-rows-7 gap-1">
            {week.map((day) => (
              <span
                key={day.key}
                title={day.count >= 0 ? `${day.key}: ${day.count} activities` : undefined}
                className={`h-2.5 w-2.5 rounded-[3px] ${day.count < 0 ? "bg-transparent" : tones[day.level]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] font-medium text-ink-mute">
        <span>Less</span>
        {tones.map((tone, i) => (
          <span key={i} className={`h-2.5 w-2.5 rounded-[3px] ${tone}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function Radar({
  breakdown,
}: {
  breakdown: StudentDashboardPayload["growth"]["overall"]["breakdown"];
}) {
  const axes: Array<[string, number]> = [
    ["Accuracy", breakdown.accuracy],
    ["Rigour", breakdown.difficulty],
    ["Depth", breakdown.bloom],
    ["Speed", breakdown.speed],
    ["Consistency", breakdown.consistency],
  ];
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 82;
  const point = (value: number, index: number) => {
    const angle = (-90 + index * (360 / axes.length)) * (Math.PI / 180);
    const r = (Math.min(100, Math.max(0, value)) / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };
  const ring = (fraction: number) =>
    axes
      .map((_, index) => {
        const angle = (-90 + index * (360 / axes.length)) * (Math.PI / 180);
        const r = radius * fraction;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      })
      .join(" ");
  const shape = axes.map(([, value], index) => point(value, index).join(",")).join(" ");
  return (
    <div className="mt-4 flex justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-56 w-56" role="img" aria-label="Skill radar">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={ring(f)} fill="none" stroke="var(--color-hairline)" strokeWidth="1" />
        ))}
        {axes.map((_, index) => {
          const [x, y] = point(100, index);
          return <line key={index} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-hairline)" strokeWidth="1" />;
        })}
        <polygon points={shape} fill="color-mix(in srgb, var(--color-primary) 22%, transparent)" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" />
        {axes.map(([label], index) => {
          const [x, y] = point(122, index);
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontWeight={600}
              style={{ fontSize: 9, fill: "var(--color-ink-mute)" }}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function buildInsight(
  firstName: string,
  model: {
    streak: number;
    badges: Badge[];
    strongest: string | null;
    momentum: number;
  },
) {
  const parts: string[] = [];
  parts.push(
    model.streak > 0
      ? `You're on a ${model.streak}-day streak, ${firstName}.`
      : `Answer one question today to start a streak, ${firstName}.`,
  );
  const nextBadge = model.badges.find((b) => b.current < b.goal && b.goal - b.current <= b.goal);
  if (nextBadge) {
    const remaining = nextBadge.goal - Math.min(nextBadge.current, nextBadge.goal);
    parts.push(`${remaining} to go for "${nextBadge.label}".`);
  }
  if (model.strongest) parts.push(`Sharpest skill: ${model.strongest}.`);
  return parts.join(" ");
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl p-4 pb-24 sm:p-8 lg:p-10">
      <div className="h-44 rounded-[1.75rem] skeleton" />
      <div className="mt-4 h-12 rounded-2xl skeleton" />
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="h-52 rounded-[1.5rem] skeleton" />
        <div className="h-52 rounded-[1.5rem] skeleton" />
      </div>
      <div className="mt-5 h-64 rounded-[1.5rem] skeleton" />
    </div>
  );
}
