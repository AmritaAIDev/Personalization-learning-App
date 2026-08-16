"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Award,
  CalendarClock,
  CircleAlert,
  Flame,
  LoaderCircle,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { EASE_OUT_SOFT } from "@/components/motion/MotionPrimitives";
import { apiFetch } from "@/lib/api";
import type { AdminStudentDetail } from "@/lib/admin-types";

function percentValue(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.round(value <= 1 ? value * 100 : value);
}

export default function StudentDetailDrawer({
  studentId,
  onClose,
}: {
  studentId: string | null;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [detail, setDetail] = useState<AdminStudentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setDetail(null);
    setError(null);
    void apiFetch<AdminStudentDetail>(`/api/admin/students/${studentId}`, {
      memoryCacheTtlMs: 0,
    })
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "This student's history could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [studentId]);

  const open = studentId !== null;
  const backdropAnim = reduce
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  const panelAnim = reduce
    ? {}
    : {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { duration: 0.32, ease: EASE_OUT_SOFT },
      };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
          <motion.div
            {...backdropAnim}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            {...panelAnim}
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-surface shadow-[-24px_0_60px_rgba(20,20,30,0.18)]"
          >
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4 sm:px-7">
              <h2 className="font-heading text-lg font-bold text-ink">
                Student overview
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-ink-mute transition hover:bg-canvas hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              {loading ? (
                <div className="grid place-items-center py-16 text-ink-mute">
                  <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" />
                </div>
              ) : error ? (
                <p
                  className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700"
                  role="alert"
                >
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              ) : detail ? (
                <StudentDetailContent detail={detail} />
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function StudentDetailContent({ detail }: { detail: AdminStudentDetail }) {
  const { profile, dashboard, history } = detail;
  const breakdown = dashboard.growth.overall.breakdown;
  const axes: Array<[string, number]> = [
    ["Accuracy", percentValue(breakdown.accuracy)],
    ["Rigour", percentValue(breakdown.difficulty)],
    ["Depth", percentValue(breakdown.bloom)],
    ["Speed", percentValue(breakdown.speed)],
    ["Consistency", percentValue(breakdown.consistency)],
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-ink p-5 text-white">
        <div className="flex items-center gap-3.5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-strong text-lg font-bold">
            {profile.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-bold">{profile.name}</p>
            <p className="truncate text-xs text-white/60">{profile.email}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat icon={<Zap className="h-3.5 w-3.5" />} label="Level" value={profile.level} />
          <MiniStat icon={<Sparkles className="h-3.5 w-3.5" />} label="XP" value={profile.xp} />
          <MiniStat icon={<Flame className="h-3.5 w-3.5" />} label="Streak" value={profile.streak} />
        </div>
      </header>

      <section>
        <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-ink">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
          Skill breakdown
        </h3>
        <p className="mt-0.5 text-xs text-ink-mute">
          Competency {percentValue(dashboard.growth.overall.score)}% ·{" "}
          {dashboard.growth.overall.band}
        </p>
        <div className="mt-3 space-y-2.5">
          {axes.map(([label, value]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">{label}</span>
                <span className="font-semibold text-ink-mute">{value}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-canvas">
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-out-soft"
                  style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-ink">
          <Target className="h-4 w-4 text-primary" aria-hidden="true" />
          Subject mastery
        </h3>
        <div className="mt-3 space-y-3">
          {dashboard.subjectCoverage.length === 0 ? (
            <p className="text-sm text-ink-soft">No subject activity yet.</p>
          ) : (
            dashboard.subjectCoverage.map((subject) => (
              <div key={subject.subject}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{subject.subject}</span>
                  <span className="text-xs font-semibold text-ink-mute">
                    {subject.masteredTopics}/{subject.totalTopics}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
                  <span
                    className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-out-soft"
                    style={{
                      width: `${
                        subject.totalTopics > 0
                          ? Math.round(
                              (subject.masteredTopics / subject.totalTopics) * 100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-ink">
          <Award className="h-4 w-4 text-primary" aria-hidden="true" />
          Diagnostic history
        </h3>
        <div className="mt-3 space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-ink-soft">No diagnostics completed yet.</p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-hairline bg-canvas px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                  <p className="text-xs text-ink-mute">
                    {item.completedAt
                      ? new Date(item.completedAt).toLocaleDateString()
                      : "In progress"}{" "}
                    · {item.correctCount}/{item.totalQuestions} correct
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary-tint px-2.5 py-1 text-xs font-bold text-primary">
                  {item.scorePercent}%
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-ink">
          <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
          Recent activity
        </h3>
        <div className="mt-3 space-y-2">
          {dashboard.activity.length === 0 ? (
            <p className="text-sm text-ink-soft">No recent activity.</p>
          ) : (
            dashboard.activity.map((item) => (
              <div key={item.id} className="rounded-xl border border-hairline px-3.5 py-2.5">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="text-xs text-ink-mute">
                  {item.detail} · {new Date(item.occurredAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-center">
      <p className="flex items-center justify-center gap-1 text-[10px] font-semibold text-white/55">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 font-heading text-base font-bold">{value}</p>
    </div>
  );
}
