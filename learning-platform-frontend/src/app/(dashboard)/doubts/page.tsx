"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
} from "lucide-react";
import StudyMarkdown from "@/components/learning/StudyMarkdown";
import SourceCitations from "@/components/learning/SourceCitations";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  CreateDoubtPayload,
  DoubtCard,
  DoubtsResponse,
} from "@/lib/doubts-types";
import { learningScopeFromSearchParams, scopeToParams } from "@/lib/learning";
import type { LearningScope } from "@/lib/learning-types";

const emptyForm: CreateDoubtPayload = {
  subject: "",
  chapter: "",
  topic: "",
  message: "",
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function sameScope(doubt: DoubtCard, scope: LearningScope) {
  return (
    doubt.subject === scope.subject &&
    doubt.chapter === scope.chapter &&
    doubt.topic === scope.topic
  );
}

function scopeHref(path: string, scope: LearningScope) {
  return `${path}?${scopeToParams(scope).toString()}`;
}

function DoubtsSkeleton() {
  return (
    <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="rounded-[1.65rem] border border-hairline bg-surface p-5">
        <div className="h-5 w-44 animate-pulse rounded-full bg-ink/10" />
        <div className="mt-5 h-72 animate-pulse rounded-2xl bg-ink/8" />
      </section>
      <section className="rounded-[1.65rem] bg-ink p-5">
        <div className="h-5 w-32 animate-pulse rounded-full bg-white/15" />
        <div className="mt-5 h-40 animate-pulse rounded-2xl bg-white/10" />
      </section>
    </div>
  );
}

function DoubtTurn({ doubt }: { doubt: DoubtCard }) {
  const answered = doubt.status === "ANSWERED";
  return (
    <article className="space-y-3">
      <div className="ml-auto max-w-[88%] rounded-[1.35rem] rounded-br-md bg-primary px-4 py-3 text-white shadow-[0_12px_26px_rgba(63,111,87,0.18)]">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">
          <span>{formatTime(doubt.createdAt)}</span>
          <span>{doubt.topic}</span>
        </div>
        <p className="mt-1 text-sm font-medium leading-6">{doubt.message}</p>
      </div>

      <div className="max-w-[92%] rounded-[1.35rem] rounded-bl-md border border-hairline bg-white p-4 shadow-[0_10px_24px_rgba(20,20,30,0.045)]">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
              answered
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {answered ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {answered ? "Tutor answer" : "Writing"}
          </span>
          {doubt.sources.length > 0 ? (
            <span className="text-[11px] font-semibold text-ink-mute">
              grounded with {doubt.sources.length} source
              {doubt.sources.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        {doubt.assistantResponse ? (
          <>
            <StudyMarkdown className="text-sm leading-6 text-ink-soft">
              {doubt.assistantResponse}
            </StudyMarkdown>
            <SourceCitations sources={doubt.sources} />
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm leading-6 text-ink-mute">
            <Loader2
              className="h-4 w-4 animate-spin text-primary"
              aria-hidden="true"
            />
            The tutor is preparing a grounded answer.
          </p>
        )}
      </div>
    </article>
  );
}

export default function DoubtsPage() {
  const searchParams = useSearchParams();
  const routeScope = learningScopeFromSearchParams(searchParams);
  const [form, setForm] = useState<CreateDoubtPayload>(
    routeScope ? { ...routeScope, message: "" } : emptyForm,
  );
  const [doubts, setDoubts] = useState<DoubtsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDoubtId, setPendingDoubtId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  async function loadDoubts() {
    setError(null);
    const data = await apiFetch<DoubtsResponse>("/api/doubts");
    setDoubts(data);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<DoubtsResponse>("/api/doubts");
        if (!cancelled) setDoubts(data);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.message
              : "Unable to load doubts right now.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pendingDoubtId) return;
    const targetId = pendingDoubtId;
    let attempts = 0;
    const stop = () => {
      if (pollRef.current) window.clearTimeout(pollRef.current);
      pollRef.current = null;
    };
    const tick = async () => {
      attempts += 1;
      try {
        const data = await apiFetch<DoubtsResponse>("/api/doubts");
        setDoubts(data);
        const resolved = data.doubts.find((d) => d.id === targetId);
        if (resolved && resolved.status === "ANSWERED") {
          setPendingDoubtId(null);
          setSuccess("Tutor answered your doubt.");
          return;
        }
      } catch {
        // ignore transient poll errors
      }
      if (attempts >= 40) {
        setPendingDoubtId(null);
        setSuccess("Still thinking — refresh later to see the answer.");
        return;
      }
      pollRef.current = window.setTimeout(tick, 3000);
    };
    pollRef.current = window.setTimeout(tick, 3000);
    return stop;
  }, [pendingDoubtId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: CreateDoubtPayload = {
        subject: (routeScope?.subject ?? form.subject).trim(),
        chapter: (routeScope?.chapter ?? form.chapter).trim(),
        topic: (routeScope?.topic ?? form.topic).trim(),
        message: form.message.trim(),
      };
      const created = await apiFetch<DoubtCard>("/api/doubts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setForm(routeScope ? { ...form, message: "" } : emptyForm);
      setSuccess("Doubt saved — the tutor is writing.");
      setPendingDoubtId(created.id);
      await loadDoubts();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to save this doubt right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const workspaceScope = routeScope ?? null;
  const scopedDoubts = useMemo(() => {
    if (!doubts) return [];
    if (!workspaceScope) return doubts.doubts;
    return doubts.doubts.filter((doubt) => sameScope(doubt, workspaceScope));
  }, [doubts, workspaceScope]);

  const canSubmit = useMemo(
    () =>
      (routeScope?.subject ?? form.subject).trim().length >= 2 &&
      (routeScope?.chapter ?? form.chapter).trim().length >= 2 &&
      (routeScope?.topic ?? form.topic).trim().length >= 2 &&
      form.message.trim().length >= 5 &&
      !submitting,
    [form, routeScope, submitting],
  );

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Doubts
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Ask inside the current topic.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-mute">
              The workspace scope is carried automatically. Your questions and
              tutor answers stay together as a topic thread.
            </p>
          </div>
          <Link
            href={workspaceScope ? scopeHref("/learn", workspaceScope) : "/learn"}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Continue learning
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        {loading ? <DoubtsSkeleton /> : null}

        {!loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <section className="flex min-h-[38rem] flex-col overflow-hidden rounded-[1.65rem] border border-hairline bg-surface shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
              <div className="border-b border-hairline px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-tint text-primary">
                    <MessageSquareText className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-bold text-ink">
                      {workspaceScope ? workspaceScope.topic : "General doubt thread"}
                    </h2>
                    <p className="truncate text-xs font-medium text-ink-mute">
                      {workspaceScope
                        ? `${workspaceScope.subject} / ${workspaceScope.chapter}`
                        : "Choose a topic once, or ask a general scoped doubt below."}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-canvas px-3 py-1 text-xs font-bold text-ink-soft">
                    {scopedDoubts.length} turn{scopedDoubts.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto bg-canvas/45 px-4 py-5 custom-scrollbar sm:px-5">
                {scopedDoubts.length > 0 ? (
                  scopedDoubts.map((doubt) => (
                    <DoubtTurn key={doubt.id} doubt={doubt} />
                  ))
                ) : (
                  <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-hairline bg-white p-8 text-center">
                    <div>
                      <Sparkles
                        className="mx-auto h-8 w-8 text-primary"
                        aria-hidden="true"
                      />
                      <h2 className="mt-3 font-heading text-xl font-semibold text-ink">
                        No doubts in this thread yet
                      </h2>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-mute">
                        Ask one focused question. The answer will appear here
                        and remain linked to this topic.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="border-t border-hairline bg-surface p-4"
              >
                {!workspaceScope ? (
                  <div className="mb-3 grid gap-2 sm:grid-cols-3">
                    {(["subject", "chapter", "topic"] as const).map((field) => (
                      <label key={field} className="block">
                        <span className="sr-only">{field}</span>
                        <input
                          value={form[field]}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              [field]: event.target.value,
                            }))
                          }
                          placeholder={
                            field === "subject"
                              ? "Subject"
                              : field === "chapter"
                                ? "Chapter"
                                : "Topic"
                          }
                          className="min-h-10 w-full rounded-xl border border-hairline bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-primary/45 focus:bg-white"
                        />
                      </label>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-end gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Your doubt</span>
                    <textarea
                      value={form.message}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          message: event.target.value,
                        }))
                      }
                      placeholder="Ask a focused doubt about this topic..."
                      className="max-h-36 min-h-12 w-full resize-none rounded-2xl border border-hairline bg-canvas p-3 text-sm leading-6 text-ink outline-none transition focus:border-primary/45 focus:bg-white"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {submitting ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Send className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">
                      {submitting ? "Sending" : "Ask"}
                    </span>
                  </button>
                </div>

                {error ? (
                  <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className="mt-3 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {success}
                  </div>
                ) : null}
              </form>
            </section>

            <aside className="space-y-4">
              <section className="rounded-[1.65rem] bg-ink p-5 text-white shadow-[0_14px_34px_rgba(20,20,30,0.12)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                  Doubt record
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-2xl font-semibold">
                      {doubts?.summary.open ?? 0}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
                      Open
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-2xl font-semibold">
                      {doubts?.summary.answered ?? 0}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/55">
                      Answered
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.65rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-mute">
                  Recent topics
                </p>
                {doubts && doubts.summary.recentTopics.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {doubts.summary.recentTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full bg-primary-tint px-3 py-1 text-xs font-semibold text-primary"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-ink-mute">
                    Your doubt topics will appear here after the first answer.
                  </p>
                )}
              </section>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}
