"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageSquareText,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import SourceCitations from "@/components/learning/SourceCitations";
import { ApiError, apiFetch } from "@/lib/api";
import type {
  CreateDoubtPayload,
  CreateDoubtThreadPayload,
  DoubtCard,
  DoubtsResponse,
  DoubtThread,
} from "@/lib/doubts-types";
import { learningScopeFromSearchParams, scopeToParams } from "@/lib/learning";
import type { LearningScope } from "@/lib/learning-types";
import { OcrError, recognizeQuestionImage } from "@/lib/ocr";

const StudyMarkdown = dynamic(
  () => import("@/components/learning/StudyMarkdown"),
  { ssr: false },
);

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

function sameScope(
  item: Pick<DoubtThread, "subject" | "chapter" | "topic">,
  scope: LearningScope,
) {
  return (
    item.subject === scope.subject &&
    item.chapter === scope.chapter &&
    item.topic === scope.topic
  );
}

function scopeHref(path: string, scope: LearningScope) {
  return `${path}?${scopeToParams(scope).toString()}`;
}

function isRealThreadId(id: string | null | undefined) {
  return Boolean(id && !id.startsWith("legacy:"));
}

function DoubtsSkeleton() {
  return (
    <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
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
            Tutor is thinking.
          </p>
        )}
      </div>
    </article>
  );
}

export default function DoubtsPage() {
  const searchParams = useSearchParams();
  const routeScope = learningScopeFromSearchParams(searchParams);
  const scopeSubject = routeScope?.subject ?? "";
  const scopeChapter = routeScope?.chapter ?? "";
  const scopeTopic = routeScope?.topic ?? "";
  const hasRouteScope = Boolean(routeScope);
  const scopeKey = routeScope
    ? `${scopeSubject}::${scopeChapter}::${scopeTopic}`
    : "";
  const [form, setForm] = useState<CreateDoubtPayload>(
    routeScope ? { ...routeScope, message: "" } : emptyForm,
  );
  const [threadTitle, setThreadTitle] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [doubts, setDoubts] = useState<DoubtsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDoubtId, setPendingDoubtId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const pollRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const loadDoubts = useCallback(async () => {
    setError(null);
    const data = await apiFetch<DoubtsResponse>("/api/doubts", {
      memoryCacheTtlMs: 0,
    });
    setDoubts(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await loadDoubts();
        if (!cancelled && !activeThreadId) {
          const scopedRoute = hasRouteScope
            ? {
                subject: scopeSubject,
                chapter: scopeChapter,
                topic: scopeTopic,
              }
            : null;
          const scoped = scopedRoute
            ? data.threads.find((thread) => sameScope(thread, scopedRoute!))
            : data.threads[0];
          setActiveThreadId(scoped?.id ?? null);
        }
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
  }, [
    activeThreadId,
    hasRouteScope,
    loadDoubts,
    scopeChapter,
    scopeKey,
    scopeSubject,
    scopeTopic,
  ]);

  const workspaceScope = routeScope ?? null;
  const visibleThreads = useMemo(() => {
    const threads = doubts?.threads ?? [];
    if (!workspaceScope) return threads;
    return threads.filter((thread) => sameScope(thread, workspaceScope));
  }, [doubts, workspaceScope]);

  const activeThread = useMemo(() => {
    const fromSelected = visibleThreads.find(
      (thread) => thread.id === activeThreadId,
    );
    return fromSelected ?? visibleThreads[0] ?? null;
  }, [activeThreadId, visibleThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [activeThread?.id, activeThread?.turns, pendingDoubtId]);

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
        const data = await loadDoubts();
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
    pollRef.current = window.setTimeout(tick, 1200);
    return stop;
  }, [loadDoubts, pendingDoubtId]);

  async function createThread() {
    setCreatingThread(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: CreateDoubtThreadPayload = {
        subject: (routeScope?.subject ?? form.subject).trim(),
        chapter: (routeScope?.chapter ?? form.chapter).trim(),
        topic: (routeScope?.topic ?? form.topic).trim(),
        title: threadTitle.trim() || undefined,
      };
      const created = await apiFetch<DoubtThread>("/api/doubts/threads", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setThreadTitle("");
      setActiveThreadId(created.id);
      await loadDoubts();
      setSuccess("New doubt chat created.");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to create this chat right now.",
      );
    } finally {
      setCreatingThread(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      messageInputRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: CreateDoubtPayload = {
        subject: (routeScope?.subject ?? activeThread?.subject ?? form.subject)
          .trim(),
        chapter: (routeScope?.chapter ?? activeThread?.chapter ?? form.chapter)
          .trim(),
        topic: (routeScope?.topic ?? activeThread?.topic ?? form.topic).trim(),
        message: form.message.trim(),
        threadId: isRealThreadId(activeThread?.id)
          ? activeThread?.id
          : undefined,
      };
      const created = await apiFetch<DoubtCard>("/api/doubts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setForm((current) => ({ ...current, message: "" }));
      setActiveThreadId(created.threadId ?? activeThreadId);
      setSuccess("Sent.");
      setPendingDoubtId(created.id);
      await loadDoubts();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to send this doubt right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setScanning(true);
    setError(null);
    setSuccess(null);
    try {
      const extracted = await recognizeQuestionImage(file);
      setForm((current) => ({
        ...current,
        message: current.message.trim()
          ? `${current.message.trim()}\n${extracted}`
          : extracted,
      }));
      messageInputRef.current?.focus();
    } catch (caught) {
      // Fallback per the roadmap: leave the composer editable and ask the
      // learner to type the question themselves.
      setError(
        caught instanceof OcrError
          ? caught.message
          : "Could not read that image. Please type the question instead.",
      );
    } finally {
      setScanning(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  const canCreateThread =
    (routeScope?.subject ?? form.subject).trim().length >= 2 &&
    (routeScope?.chapter ?? form.chapter).trim().length >= 2 &&
    (routeScope?.topic ?? form.topic).trim().length >= 2 &&
    !creatingThread;

  const canSubmit =
    (routeScope?.subject ?? activeThread?.subject ?? form.subject).trim()
      .length >= 2 &&
    (routeScope?.chapter ?? activeThread?.chapter ?? form.chapter).trim()
      .length >= 2 &&
    (routeScope?.topic ?? activeThread?.topic ?? form.topic).trim().length >=
      2 &&
    form.message.trim().length >= 5 &&
    !submitting;

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Doubts
            </p>
            <h1 className="mt-2 font-heading page-title text-ink">
              Topic doubt chats.
            </h1>
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
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section className="flex min-h-[38rem] flex-col overflow-hidden rounded-[1.65rem] border border-hairline bg-surface shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
              <div className="border-b border-hairline px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-tint text-primary">
                    <MessageSquareText className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-bold text-ink">
                      {activeThread?.title ??
                        workspaceScope?.topic ??
                        "Start a doubt chat"}
                    </h2>
                    <p className="truncate text-xs font-medium text-ink-mute">
                      {activeThread
                        ? `${activeThread.subject} / ${activeThread.chapter} / ${activeThread.topic}`
                        : "Create a chat, then send your first doubt."}
                    </p>
                  </div>
                  <span className="ml-auto rounded-full bg-canvas px-3 py-1 text-xs font-bold text-ink-soft">
                    {activeThread?.turns ?? 0} turn
                    {activeThread?.turns === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto bg-canvas/45 px-4 py-5 custom-scrollbar sm:px-5">
                {activeThread && activeThread.doubts.length > 0 ? (
                  activeThread.doubts.map((doubt) => (
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
                        No messages in this chat yet
                      </h2>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSubmit}
                className="border-t border-hairline bg-surface p-4"
              >
                {!workspaceScope && !activeThread ? (
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

                <div className="flex items-end gap-2 rounded-[1.35rem] border border-hairline bg-canvas p-2 transition focus-within:border-primary/45 focus-within:bg-white focus-within:shadow-[0_10px_28px_rgba(63,111,87,0.08)]">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => void handlePhotoSelected(event)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={scanning || submitting}
                    title="Scan a photo of the question"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-hairline bg-white text-ink-soft transition hover:border-primary/40 hover:text-primary disabled:cursor-wait disabled:opacity-60"
                  >
                    {scanning ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Camera className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="sr-only">Scan a photo of the question</span>
                  </button>
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Your doubt</span>
                    <textarea
                      ref={messageInputRef}
                      value={form.message}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          message: event.target.value,
                        }))
                      }
                      onKeyDown={handleComposerKeyDown}
                      placeholder="Ask a focused doubt, or scan a photo of the question..."
                      disabled={submitting}
                      className="custom-scrollbar max-h-28 min-h-10 w-full resize-none bg-transparent px-2 py-2 text-[13px] leading-5 text-ink outline-none placeholder:text-ink-mute disabled:cursor-wait disabled:opacity-70"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(63,111,87,0.18)] transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
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
                      {submitting ? "Sending" : "Send"}
                    </span>
                  </button>
                </div>
                {scanning ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-ink-mute">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    Reading the photo...
                  </p>
                ) : null}

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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                      Chats
                    </p>
                    <h2 className="mt-1 font-heading text-xl font-bold">
                      Doubt threads
                    </h2>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold">
                    {visibleThreads.length}
                  </span>
                </div>

                {!workspaceScope ? (
                  <div className="mt-4 grid gap-2">
                    {(["subject", "chapter", "topic"] as const).map((field) => (
                      <input
                        key={field}
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
                        className="min-h-10 rounded-xl border border-white/10 bg-white/8 px-3 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-white/30"
                      />
                    ))}
                  </div>
                ) : null}

                <input
                  value={threadTitle}
                  onChange={(event) => setThreadTitle(event.target.value)}
                  placeholder="Optional chat title"
                  className="mt-4 min-h-10 w-full rounded-xl border border-white/10 bg-white/8 px-3 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={() => void createThread()}
                  disabled={!canCreateThread}
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-ink transition hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingThread ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  New chat
                </button>
              </section>

              <section className="rounded-[1.65rem] border border-hairline bg-surface p-3 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
                <div className="max-h-[25rem] space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                  {visibleThreads.length > 0 ? (
                    visibleThreads.map((thread) => {
                      const active = thread.id === activeThread?.id;
                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => setActiveThreadId(thread.id)}
                          className={`w-full rounded-2xl p-3 text-left transition ${
                            active
                              ? "bg-primary-tint text-primary ring-1 ring-primary/15"
                              : "hover:bg-canvas"
                          }`}
                        >
                          <span className="block truncate text-sm font-bold text-ink">
                            {thread.title}
                          </span>
                          <span className="mt-1 block truncate text-[11px] font-medium text-ink-mute">
                            {thread.topic} · {thread.turns} turn
                            {thread.turns === 1 ? "" : "s"}
                          </span>
                          <span
                            className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.11em] ${
                              thread.status === "OPEN"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {thread.status === "OPEN" ? "Tutor writing" : "Answered"}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="p-4 text-sm leading-6 text-ink-mute">
                      No chats yet. Create one and ask your first doubt.
                    </p>
                  )}
                </div>
              </section>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}
