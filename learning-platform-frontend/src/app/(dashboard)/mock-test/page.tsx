"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  LoaderCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type {
  MockTestAttemptPayload,
  MockTestAttemptSummary,
} from "@/lib/mock-test-types";

function scoreTone(scorePercent: number) {
  if (scorePercent >= 70) return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (scorePercent >= 40) return "bg-amber-50 text-amber-800 ring-amber-100";
  return "bg-rose-50 text-rose-700 ring-rose-100";
}

export default function MockTestLandingPage() {
  const router = useRouter();
  const [history, setHistory] = useState<MockTestAttemptSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHistory(await apiFetch<MockTestAttemptSummary[]>("/api/mock-tests"));
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Your mock test history could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadHistory(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadHistory]);

  const activeAttempt = history?.find((item) => item.status === "IN_PROGRESS");

  const start = async () => {
    if (starting) return;
    if (activeAttempt) {
      router.push(`/mock-test/${activeAttempt.id}`);
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const payload = await apiFetch<MockTestAttemptPayload>("/api/mock-tests", {
        method: "POST",
      });
      router.push(`/mock-test/${payload.attempt.id}`);
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "The mock test could not be started.",
      );
    } finally {
      setStarting(false);
    }
  };

  const submittedHistory = history?.filter((item) => item.status === "SUBMITTED") ?? [];

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-4xl px-5 pt-8 sm:px-8 sm:pt-10 lg:px-10">
        <div className="animate-rise">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Full mock test
          </p>
          <h1 className="mt-2 font-heading page-title text-ink">
            Physics, Chemistry, Mathematics — one paper
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
            A full-length paper drawn across every subject, scored with
            JEE&apos;s own +4 / -1 negative marking. When you submit,
            you&apos;ll see your percentile against other test-takers on this
            platform and exactly which chapters cost you the most marks.
          </p>
        </div>

        <section className="mt-7 animate-rise overflow-hidden rounded-[1.8rem] bg-ink p-5 text-white shadow-[0_18px_45px_rgba(20,20,30,0.16)] [animation-delay:70ms] sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                {activeAttempt ? "Mock test in progress" : "Ready when you are"}
              </p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                {activeAttempt
                  ? `${activeAttempt.totalQuestions} questions, in progress`
                  : "Start a full mock test"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void start()}
              disabled={loading || starting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-ink transition duration-200 ease-out-soft hover:-translate-y-0.5 hover:bg-primary-tint active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {starting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trophy className="h-4 w-4" />
              )}
              {activeAttempt ? "Resume test" : "Start mock test"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 sm:max-w-md sm:gap-3">
            <span className="rounded-xl bg-white/8 px-3 py-3">
              <span className="block text-lg font-bold">90 min</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.13em] text-white/50">
                Timed
              </span>
            </span>
            <span className="rounded-xl bg-white/8 px-3 py-3">
              <span className="block text-lg font-bold">3 subjects</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.13em] text-white/50">
                Full paper
              </span>
            </span>
            <span className="rounded-xl bg-white/8 px-3 py-3">
              <span className="block text-lg font-bold">+4 / -1</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.13em] text-white/50">
                JEE marking
              </span>
            </span>
          </div>
        </section>

        {error ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Something interrupted this page</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        ) : null}

        <section className="mt-6 animate-fade [animation-delay:120ms]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-mute">
            Past mock tests
          </p>
          {loading ? (
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
              Loading history
            </div>
          ) : submittedHistory.length === 0 ? (
            <p className="mt-4 flex items-start gap-3 rounded-2xl border border-dashed border-hairline bg-surface p-5 text-sm leading-6 text-ink-soft">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              Your first submitted mock test will show up here, with your
              percentile and a chapter-by-chapter breakdown.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {submittedHistory.map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/mock-test/${attempt.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-hairline bg-surface px-4 py-3.5 transition hover:border-primary/30 hover:shadow-[0_12px_26px_rgba(20,20,30,0.06)]"
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold ring-1 ${scoreTone(attempt.scorePercent)}`}
                  >
                    {attempt.scorePercent}%
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink">
                      {attempt.percentile !== null
                        ? `${attempt.percentile}th percentile`
                        : "Percentile pending"}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-ink-mute">
                      <Clock3 className="h-3 w-3" aria-hidden="true" />
                      {formatDateTime(attempt.submittedAt)}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
