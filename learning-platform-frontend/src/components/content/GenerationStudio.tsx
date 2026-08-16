"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Sparkles,
  Target,
  Trash2,
  Wand2,
} from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import type { AdminQuestionRecord } from "@/lib/question-review-types";

const BLOOM_LEVELS = ["Recall", "Comprehension", "Application", "Higher-Order"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const MAX_BATCH = 12;
const BURST_SIZE = 4;
const BURST_COOLDOWN_MS = 61_000;
const BURST_STAGGER_MS = 350;

type TopicLevel = "SUBJECT" | "CHAPTER" | "SUB_TOPIC" | "CONCEPT";
type TopicTreeNode = {
  id: string;
  name: string;
  description: string | null;
  level: TopicLevel;
  children: TopicTreeNode[];
};
type CoverageGap = {
  subjectId: string;
  subject: string;
  chapterId: string;
  chapter: string;
  topicId: string;
  topic: string;
  publishedCount: number;
};

type Combo = { bloomLevel: string; difficulty: string };
type ResultEntry = {
  key: string;
  combo: Combo;
  status: "pending" | "done" | "failed";
  question?: AdminQuestionRecord;
  error?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function GenerationStudio({
  onQuestionPublished,
}: {
  onQuestionPublished?: () => void;
}) {
  const [tree, setTree] = useState<TopicTreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [gaps, setGaps] = useState<CoverageGap[]>([]);

  const [blooms, setBlooms] = useState<Set<string>>(new Set(["Application"]));
  const [difficulties, setDifficulties] = useState<Set<string>>(
    new Set(["Medium"]),
  );
  const [perCombo, setPerCombo] = useState(1);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [actingKey, setActingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadGaps = () => {
    void apiFetch<CoverageGap[]>("/api/questions/coverage-gaps?limit=8", {
      memoryCacheTtlMs: 0,
    })
      .then((data) => setGaps(data))
      .catch(() => {
        // Non-critical panel; the generator still works without it.
      });
  };

  useEffect(() => {
    setTreeLoading(true);
    void apiFetch<TopicTreeNode[]>("/api/topics/tree", { memoryCacheTtlMs: 0 })
      .then((data) => {
        setTree(data);
        if (data.length > 0) {
          setSubjectId(data[0].id);
          const firstChapter = data[0].children[0];
          if (firstChapter) {
            setChapterId(firstChapter.id);
            setTopicId(firstChapter.children[0]?.id ?? "");
          }
        }
      })
      .finally(() => setTreeLoading(false));
    loadGaps();
  }, []);

  const subjects = tree;
  const subjectNode = subjects.find((s) => s.id === subjectId);
  const chapters = subjectNode?.children ?? [];
  const chapterNode = chapters.find((c) => c.id === chapterId);
  const topics = chapterNode?.children ?? [];
  const topicNode = topics.find((t) => t.id === topicId);
  const readyToGenerate = Boolean(subjectNode && chapterNode && topicNode);

  const applyGap = (gap: CoverageGap) => {
    setSubjectId(gap.subjectId);
    setChapterId(gap.chapterId);
    setTopicId(gap.topicId);
  };

  const combos: Combo[] = [];
  for (const bloomLevel of blooms) {
    for (const difficulty of difficulties) {
      for (let i = 0; i < perCombo; i += 1) combos.push({ bloomLevel, difficulty });
    }
  }
  const overCap = combos.length > MAX_BATCH;

  const runBatch = async (event: FormEvent) => {
    event.preventDefault();
    if (!subjectNode || !chapterNode || !topicNode) return;
    if (combos.length === 0 || overCap || running) return;
    setRunning(true);
    setError(null);
    setNotice(null);
    setProgress({ done: 0, total: combos.length });

    const entries: ResultEntry[] = combos.map((combo, index) => ({
      key: `${Date.now()}-${index}`,
      combo,
      status: "pending",
    }));
    setResults((current) => [...entries, ...current]);

    for (let index = 0; index < entries.length; index += 1) {
      if (index > 0) {
        await sleep(index % BURST_SIZE === 0 ? BURST_COOLDOWN_MS : BURST_STAGGER_MS);
      }
      const entry = entries[index];
      try {
        const question = await apiFetch<AdminQuestionRecord>(
          "/api/questions/generate",
          {
            method: "POST",
            body: JSON.stringify({
              subject: subjectNode.name,
              chapter: chapterNode.name,
              topic: topicNode.name,
              bloomLevel: entry.combo.bloomLevel,
              difficulty: entry.combo.difficulty,
            }),
          },
        );
        setResults((current) =>
          current.map((item) =>
            item.key === entry.key ? { ...item, status: "done", question } : item,
          ),
        );
      } catch (reason) {
        setResults((current) =>
          current.map((item) =>
            item.key === entry.key
              ? {
                  ...item,
                  status: "failed",
                  error:
                    reason instanceof ApiError
                      ? reason.message
                      : "This draft could not be generated.",
                }
              : item,
          ),
        );
      }
      setProgress({ done: index + 1, total: entries.length });
    }
    setRunning(false);
    setNotice(
      `Generated ${entries.length} draft${entries.length === 1 ? "" : "s"} for review below.`,
    );
  };

  const publish = async (entry: ResultEntry) => {
    if (!entry.question) return;
    setActingKey(entry.key);
    setError(null);
    try {
      await apiFetch(`/api/questions/bank/${entry.question.question_id}/publication`, {
        method: "PATCH",
        body: JSON.stringify({ action: "PUBLISH" }),
      });
      setResults((current) => current.filter((item) => item.key !== entry.key));
      onQuestionPublished?.();
      loadGaps();
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "The question could not be published.",
      );
    } finally {
      setActingKey(null);
    }
  };

  const discard = async (entry: ResultEntry) => {
    if (!entry.question) return;
    setActingKey(entry.key);
    setError(null);
    try {
      await apiFetch(`/api/questions/bank/${entry.question.question_id}`, {
        method: "DELETE",
      });
      setResults((current) => current.filter((item) => item.key !== entry.key));
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "The draft could not be discarded.",
      );
    } finally {
      setActingKey(null);
    }
  };

  return (
    <section className="mt-6 space-y-5">
      {gaps.length > 0 ? (
        <div className="rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-tint text-primary">
              <Target className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-heading text-base font-bold text-ink">Coverage gaps</h3>
              <p className="text-xs text-ink-mute">
                Syllabus topics thinnest on published questions — pick one to fill it.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {gaps.map((gap) => (
              <button
                key={gap.topicId}
                type="button"
                onClick={() => applyGap(gap)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  topicId === gap.topicId
                    ? "border-primary bg-primary text-white"
                    : "border-hairline bg-canvas text-ink-soft hover:bg-white"
                }`}
              >
                {gap.topic}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    topicId === gap.topicId ? "bg-white/20" : "bg-white text-ink-mute"
                  }`}
                >
                  {gap.publishedCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[1.75rem] bg-ink p-5 text-white shadow-[0_20px_50px_rgba(20,20,30,0.22)] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
            <Wand2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold">AI generation studio</h2>
            <p className="mt-0.5 text-sm text-white/60">
              Spin up a full spread of drafts in one pass — every bloom level ×
              difficulty combination you pick, generated and queued for review here.
            </p>
          </div>
        </div>

        {!treeLoading && tree.length === 0 ? (
          <p className="mt-6 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70">
            No syllabus topics yet — add a subject and chapter in the Syllabus tab
            first, then come back here to generate questions for it.
          </p>
        ) : (
          <form onSubmit={(event) => void runBatch(event)} className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <FieldSelect
                label="Subject"
                value={subjectId}
                options={subjects.map((s) => ({ id: s.id, name: s.name }))}
                onChange={(value) => {
                  setSubjectId(value);
                  const next = subjects.find((s) => s.id === value);
                  const firstChapter = next?.children[0];
                  setChapterId(firstChapter?.id ?? "");
                  setTopicId(firstChapter?.children[0]?.id ?? "");
                }}
              />
              <FieldSelect
                label="Chapter"
                value={chapterId}
                options={chapters.map((c) => ({ id: c.id, name: c.name }))}
                onChange={(value) => {
                  setChapterId(value);
                  const next = chapters.find((c) => c.id === value);
                  setTopicId(next?.children[0]?.id ?? "");
                }}
              />
              <FieldSelect
                label="Topic"
                value={topicId}
                options={topics.map((t) => ({ id: t.id, name: t.name }))}
                onChange={setTopicId}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ChipGroup
                label="Bloom levels"
                options={BLOOM_LEVELS}
                selected={blooms}
                onToggle={(value) => setBlooms((current) => toggle(current, value))}
              />
              <ChipGroup
                label="Difficulties"
                options={DIFFICULTIES}
                selected={difficulties}
                onToggle={(value) => setDifficulties((current) => toggle(current, value))}
              />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-white/50">
                  Per combination
                </span>
                <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 p-1">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPerCombo(n)}
                      className={`h-8 w-9 rounded-lg text-sm font-bold transition ${
                        perCombo === n ? "bg-white text-ink" : "text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </label>

              <div className="flex flex-col items-end gap-2">
                <p className={`text-xs font-semibold ${overCap ? "text-rose-300" : "text-white/60"}`}>
                  {combos.length} draft{combos.length === 1 ? "" : "s"} queued
                  {overCap ? ` — reduce your selection to ${MAX_BATCH} or fewer` : ""}
                </p>
                <button
                  type="submit"
                  disabled={running || combos.length === 0 || overCap || !readyToGenerate}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(0,0,0,0.3)] transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {running ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Generating {progress.done}/{progress.total}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Generate batch
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {error ? (
        <p
          className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {notice}
        </p>
      ) : null}

      {results.length > 0 ? (
        <div className="rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
          <h3 className="font-heading text-base font-bold text-ink">Live results</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {results.map((entry) => (
              <ResultCard
                key={entry.key}
                entry={entry}
                busy={actingKey === entry.key}
                onPublish={() => void publish(entry)}
                onDiscard={() => void discard(entry)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-white/50">
        {label}
      </span>
      <select
        required
        value={value}
        disabled={options.length === 0}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-white/40 disabled:opacity-50"
      >
        {options.length === 0 ? <option value="">None yet</option> : null}
        {options.map((option) => (
          <option key={option.id} value={option.id} className="text-ink">
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-white/50">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = selected.has(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultCard({
  entry,
  busy,
  onPublish,
  onDiscard,
}: {
  entry: ResultEntry;
  busy: boolean;
  onPublish: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-mute">
        <span className="rounded-full bg-white px-2 py-0.5">{entry.combo.bloomLevel}</span>
        <span className="rounded-full bg-white px-2 py-0.5">{entry.combo.difficulty}</span>
      </div>

      {entry.status === "pending" ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-ink-mute">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Generating…
        </div>
      ) : entry.status === "failed" ? (
        <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-rose-700">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {entry.error}
        </p>
      ) : entry.question ? (
        <>
          <p className="mt-3 line-clamp-3 text-sm font-semibold text-ink">
            {entry.question.question_text}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onPublish}
              disabled={busy}
              className="inline-flex min-h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
              Publish
            </button>
            <button
              type="button"
              onClick={onDiscard}
              disabled={busy}
              title="Discard"
              className="inline-flex min-h-8 items-center justify-center rounded-lg border border-hairline px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-white disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
