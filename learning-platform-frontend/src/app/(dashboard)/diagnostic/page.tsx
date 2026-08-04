"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Clock3,
  LoaderCircle,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  DashboardPayload,
  DiagnosticAttemptPayload,
} from "@/lib/diagnostic-types";

export default function DiagnosticStartPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDashboard(
        await apiFetch<DashboardPayload>("/api/diagnostics/dashboard"),
      );
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Unable to load the test details.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      await load();
    };
    void loadInitial();
  }, [load]);

  const start = async () => {
    if (starting) return;
    setStarting(true);
    setError(null);
    try {
      const attempt = await apiFetch<DiagnosticAttemptPayload>(
        "/api/diagnostics",
        {
          method: "POST",
          body: JSON.stringify({ subject: "Physics" }),
        },
      );
      router.push(`/diagnostic/${attempt.attempt.id}`);
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "Unable to start the test.",
      );
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm font-semibold text-ink-soft">
        <span className="flex items-center gap-3">
          <LoaderCircle
            className="h-5 w-5 animate-spin text-primary"
            aria-hidden="true"
          />
          Loading test details…
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-8 sm:pt-8 lg:px-10">
      <Link
        href="/tests"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tests
      </Link>

      <section className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_12px_30px_rgba(20,20,30,0.045)]">
        <div className="bg-ink p-6 text-white sm:p-8">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
            Diagnostic readiness
          </p>
          <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {dashboard?.diagnostic.title ?? "Physics diagnostic"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
            A timed, secure check of your Electrostatics. Answer one question at
            a time; each selection autosaves. Scoring and repair areas appear
            after you submit.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {error ? (
            <p
              className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-canvas p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                <ClipboardCheck
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
                Questions
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-ink">
                {dashboard?.diagnostic.questionCount ?? "—"}
              </p>
            </div>
            <div className="rounded-xl bg-canvas p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
                Time limit
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-ink">
                {dashboard?.diagnostic.durationMinutes ?? "—"} min
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {dashboard?.activeAttempt ? (
              <p className="text-sm font-medium text-amber-700">
                A saved attempt is ready to resume.
              </p>
            ) : dashboard?.diagnostic.ready ? (
              <p className="text-sm text-ink-soft">Ready when you are.</p>
            ) : (
              <p className="text-sm text-ink-mute">
                The next test is being prepared — balanced coverage is almost
                ready.
              </p>
            )}
            <button
              type="button"
              onClick={() => void start()}
              disabled={starting || !dashboard?.diagnostic.ready}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20,20,30,0.22)] transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {starting ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {dashboard?.activeAttempt ? "Resume test" : "Begin test"}
              {!starting ? (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              ) : null}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
