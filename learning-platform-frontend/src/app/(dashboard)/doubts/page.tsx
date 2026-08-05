"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import PageHero from "@/components/product/PageHero";
import StudyMarkdown from "@/components/learning/StudyMarkdown";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  CreateDoubtPayload,
  DoubtCard,
  DoubtsResponse,
} from "@/lib/doubts-types";

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

function DoubtsSkeleton() {
  return (
    <div className="mt-9 grid gap-4 lg:grid-cols-[0.58fr_0.42fr]">
      <section className="rounded-[1.65rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
        <div className="h-5 w-40 animate-pulse rounded-full bg-ink/10" />
        <div className="mt-6 space-y-3">
          <div className="h-11 animate-pulse rounded-xl bg-ink/8" />
          <div className="h-11 animate-pulse rounded-xl bg-ink/8" />
          <div className="h-28 animate-pulse rounded-xl bg-ink/8" />
        </div>
      </section>
      <section className="rounded-[1.65rem] bg-ink p-6">
        <div className="h-5 w-36 animate-pulse rounded-full bg-white/15" />
        <div className="mt-6 h-32 animate-pulse rounded-2xl bg-white/10" />
      </section>
    </div>
  );
}

function DoubtHistoryCard({ doubt }: { doubt: DoubtCard }) {
  const answered = doubt.status === "ANSWERED";
  return (
    <article className="rounded-2xl border border-hairline bg-canvas p-4 transition hover:border-primary/25 hover:shadow-[0_14px_30px_rgba(20,20,30,0.07)]">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
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
          {answered ? "Answered" : "Open"}
        </span>
        <span className="text-xs font-semibold text-ink-mute">
          {formatTime(doubt.createdAt)}
        </span>
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">
        {doubt.subject} · {doubt.chapter} · {doubt.topic}
      </p>
      <h3 className="mt-2 text-sm font-semibold leading-6 text-ink">
        {doubt.message}
      </h3>
      {doubt.assistantResponse ? (
        <StudyMarkdown className="mt-4 rounded-2xl border border-hairline bg-white p-4 text-sm leading-6 text-ink-soft">
          {doubt.assistantResponse}
        </StudyMarkdown>
      ) : (
        <p className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-hairline bg-white p-4 text-sm leading-6 text-ink-mute">
          <Loader2
            className="h-4 w-4 animate-spin text-primary"
            aria-hidden="true"
          />
          {answered
            ? ""
            : "The tutor is writing its answer — it will appear here shortly."}
        </p>
      )}
    </article>
  );
}

export default function DoubtsPage() {
  const [form, setForm] = useState<CreateDoubtPayload>(emptyForm);
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

  // Poll for the background tutor response until the saved doubt is answered
  // (or we give up after ~2 minutes). The backend resolves the doubt out-of-band.
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
        // ignore transient poll errors; retry
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
      const created = await apiFetch<DoubtCard>("/api/doubts", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      setSuccess("Doubt saved — the tutor is writing its answer…");
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

  const canSubmit = useMemo(
    () =>
      form.subject.trim().length >= 2 &&
      form.chapter.trim().length >= 2 &&
      form.topic.trim().length >= 2 &&
      form.message.trim().length >= 5 &&
      !submitting,
    [form, submitting],
  );

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8 sm:pt-16 lg:px-10">
        <PageHero
          eyebrow="Doubts"
          title="Ask a doubt, get a clear answer."
          action={
            <Link
              href="/learn"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Open Learn
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />

        {loading ? <DoubtsSkeleton /> : null}

        {!loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[0.58fr_0.42fr]">
            <section className="rounded-[1.65rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-tint text-primary">
                  <MessageSquareText className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="font-heading text-lg font-bold text-ink">
                  Ask a doubt
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {(["subject", "chapter", "topic"] as const).map((field) => (
                    <label key={field} className="block">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">
                        {field}
                      </span>
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
                            ? "Physics"
                            : field === "chapter"
                              ? "Electrostatics"
                              : "Gauss Law"
                        }
                        className="mt-2 min-h-11 w-full rounded-xl border border-hairline bg-canvas px-3 text-sm font-semibold text-ink outline-none transition focus:border-primary/45 focus:bg-white"
                      />
                    </label>
                  ))}
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-mute">
                    Your doubt
                  </span>
                  <textarea
                    value={form.message}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    placeholder="Example: Why does Gauss law care about enclosed charge and not outside charge?"
                    className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-hairline bg-canvas p-4 text-sm leading-6 text-ink outline-none transition focus:border-primary/45 focus:bg-white"
                  />
                </label>

                {error ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {success}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {submitting ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  {submitting ? "Saving doubt" : "Ask tutor"}
                </button>
              </form>
            </section>

            <aside className="space-y-4">
              <section className="rounded-[1.65rem] bg-ink p-6 text-white shadow-[0_14px_34px_rgba(20,20,30,0.12)]">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">
                      Doubt record
                    </p>
                    <h2 className="mt-1 font-heading text-xl font-semibold">
                      {doubts?.total ?? 0} saved doubts
                    </h2>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
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

              <section className="rounded-[1.65rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-mute">
                  Recent doubts
                </p>
                {doubts && doubts.doubts.length > 0 ? (
                  <div className="mt-4 max-h-[44rem] space-y-3 overflow-y-auto pr-1">
                    {doubts.doubts.map((doubt) => (
                      <DoubtHistoryCard key={doubt.id} doubt={doubt} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-hairline bg-canvas p-5 text-sm leading-6 text-ink-mute">
                    No doubt history yet. Ask your first doubt and it will be
                    saved here from the backend.
                  </div>
                )}
              </section>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}
