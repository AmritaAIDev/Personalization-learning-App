"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { ArrowRight, CircleAlert, LoaderCircle, Search, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { learningUrl } from "@/lib/learning";
import { practiceHref } from "@/lib/practice";
import type {
  LearningDashboardPayload,
  LearningScope,
  LearningState,
} from "@/lib/learning-types";
import type { QuestionCatalogEntry } from "@/lib/practice-types";

type TopicPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  destination?: "learn" | "practice";
};

function scopeFor(entry: QuestionCatalogEntry): LearningScope {
  return { subject: entry.subject, chapter: entry.chapter, topic: entry.topic };
}

function topicKey(scope: LearningScope) {
  return `${scope.subject}:${scope.chapter}:${scope.topic}`;
}

function topicStateMap(dashboard: LearningDashboardPayload | null) {
  const states = [
    ...(dashboard?.activeTopics ?? []),
    ...(dashboard?.completedTopics ?? []),
  ];
  return new Map(states.map((state) => [topicKey(state), state]));
}

export default function TopicPickerDialog({
  open,
  onClose,
  destination = "learn",
}: TopicPickerDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<QuestionCatalogEntry[]>([]);
  const [dashboard, setDashboard] = useState<LearningDashboardPayload | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [catalogResult, dashboardResult] = await Promise.allSettled([
      apiFetch<QuestionCatalogEntry[]>("/api/questions/catalog?limit=80", {
        memoryCacheTtlMs: 45_000,
      }),
      apiFetch<LearningDashboardPayload>("/api/learning/dashboard"),
    ]);

    if (catalogResult.status === "fulfilled") {
      setCatalog(catalogResult.value);
    } else {
      setError(
        catalogResult.reason instanceof Error
          ? catalogResult.reason.message
          : "The topic catalog could not be loaded.",
      );
    }
    if (dashboardResult.status === "fulfilled")
      setDashboard(dashboardResult.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load, open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  const states = useMemo(() => topicStateMap(dashboard), [dashboard]);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matching = normalized
      ? catalog.filter((entry) =>
          [entry.subject, entry.chapter, entry.topic].some((value) =>
            value.toLowerCase().includes(normalized),
          ),
        )
      : catalog;
    const statusOrder: Record<string, number> = {
      ACTIVE: 0,
      PAUSED_FOR_PREREQUISITE: 1,
      MASTERED: 2,
    };
    return [...matching]
      .sort((left, right) => {
        const leftState = states.get(topicKey(scopeFor(left)));
        const rightState = states.get(topicKey(scopeFor(right)));
        const leftOrder = leftState ? (statusOrder[leftState.status] ?? 3) : 4;
        const rightOrder = rightState
          ? (statusOrder[rightState.status] ?? 3)
          : 4;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return left.topic.localeCompare(right.topic);
      })
      .slice(0, normalized ? 18 : 12);
  }, [catalog, query, states]);

  const openTopic = (entry: QuestionCatalogEntry) => {
    const scope = scopeFor(entry);
    onClose();
    router.push(
      destination === "practice" ? practiceHref(scope) : learningUrl(scope),
    );
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-ink/35 p-3 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Find a learning topic"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close topic search"
      />
      <section className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.5rem] border border-white/70 bg-surface shadow-[0_28px_90px_rgba(20,20,30,0.22)] sm:max-h-[calc(100dvh-4rem)] sm:rounded-[1.75rem]">
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-4 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Topic finder
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink">
              Choose your next topic
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-ink-mute transition hover:bg-canvas hover:text-ink"
            aria-label="Close topic search"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-7">
          <label className="relative block">
            <span className="sr-only">Search topics and chapters</span>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary"
              aria-hidden="true"
            />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a topic or chapter"
              className="h-13 w-full rounded-2xl border border-hairline bg-canvas pl-12 pr-4 text-[15px] font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-ink-mute focus:border-primary/45 focus:bg-white"
            />
          </label>

          <div
            className="mt-5 flex items-center justify-between gap-4"
            aria-live="polite"
          >
            <div>
              <p className="text-sm font-semibold text-ink">
                {query.trim() ? "Matching topics" : "Suggested topics"}
              </p>
              <p className="mt-0.5 text-xs text-ink-mute">
                Your active topics stay at the top.
              </p>
            </div>
            {loading ? (
              <span className="flex items-center gap-2 text-xs font-medium text-ink-mute">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Loading
              </span>
            ) : null}
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
            {error ? (
              <div
                className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm text-rose-700"
                role="alert"
              >
                <CircleAlert
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{error}</span>
              </div>
            ) : null}

            {loading && catalog.length === 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-24 rounded-2xl skeleton" />
                ))}
              </div>
            ) : null}

            {!loading && !error && results.length === 0 ? (
              <p className="rounded-2xl bg-canvas px-4 py-5 text-sm text-ink-soft">
                No reviewed topic matches that search.
              </p>
            ) : null}

            {results.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {results.map((entry) => {
                  const scope = scopeFor(entry);
                  const state = states.get(topicKey(scope));
                  return (
                    <TopicResult
                      key={topicKey(scope)}
                      entry={entry}
                      state={state}
                      onOpen={() => openTopic(entry)}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function TopicResult({
  entry,
  state,
  onOpen,
}: {
  entry: QuestionCatalogEntry;
  state: LearningState | undefined;
  onOpen: () => void;
}) {
  const progress = state
    ? Math.max(0, Math.min(100, state.masteryPercent))
    : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group rounded-2xl border border-hairline bg-white p-4 text-left transition hover:border-primary/35 hover:bg-primary-tint/35 hover:shadow-[0_10px_24px_rgba(20,20,30,0.06)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-bold text-ink">
            {entry.topic}
          </span>
          <span className="mt-1 block truncate text-xs text-ink-mute">
            {entry.subject} / {entry.chapter}
          </span>
        </span>
        <ArrowRight
          className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </div>
      {state && progress !== null ? (
        <div className="mt-4">
          <div className="flex justify-between gap-3 text-[11px] font-semibold text-ink-soft">
            <span>
              Level {state.currentLevel} · {state.currentCoordinate.bloomLevel}{" "}
              · {state.currentCoordinate.difficulty}
            </span>
            <span className="text-primary">{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary/10">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <span className="mt-4 inline-flex rounded-full bg-canvas px-2 py-1 text-[10px] font-semibold text-ink-mute">
          {entry.questionCount} reviewed questions
        </span>
      )}
    </button>
  );
}
