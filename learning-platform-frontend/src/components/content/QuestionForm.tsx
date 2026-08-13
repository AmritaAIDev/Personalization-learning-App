"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import type { AdminQuestionRecord } from "@/lib/question-review-types";

const BLOOM_LEVELS = ["Recall", "Comprehension", "Application", "Higher-Order"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export interface QuestionFormPayload {
  subject: string;
  chapter: string;
  topic: string;
  subtopic?: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  solution: string;
  bloom_level: string;
  difficulty: string;
  marks: number;
  estimated_time_sec: number;
  concept_tags?: string[];
  common_errors?: string[];
}

function toFormState(initial?: Partial<AdminQuestionRecord>) {
  const options = initial?.options ?? ["", "", "", ""];
  return {
    subject: initial?.subject ?? "Physics",
    chapter: initial?.chapter ?? "",
    topic: initial?.topic ?? "",
    subtopic: "",
    question_text: initial?.question_text ?? "",
    options: [options[0] ?? "", options[1] ?? "", options[2] ?? "", options[3] ?? ""],
    correct_answer: initial?.correct_answer ?? "",
    solution: initial?.solution ?? "",
    bloom_level: initial?.bloom_level ?? BLOOM_LEVELS[2],
    difficulty: initial?.difficulty ?? DIFFICULTIES[1],
    marks: initial?.marks ?? 4,
    estimated_time_sec: initial?.estimated_time_sec ?? 90,
    concept_tags: (initial?.concept_tags ?? []).join(", "),
    common_errors: (initial?.common_errors ?? []).join(", "),
  };
}

/** Mirrors the backend's cross-field rule so a bad option/answer pairing is caught before the request round-trip. */
function validate(form: ReturnType<typeof toFormState>): string | null {
  if (!form.subject.trim() || !form.chapter.trim() || !form.topic.trim())
    return "Subject, chapter, and topic are required.";
  if (!form.question_text.trim()) return "Question text is required.";
  const options = form.options.map((option) => option.trim());
  if (options.some((option) => !option)) return "All four options are required.";
  if (new Set(options).size !== 4) return "Options must be four distinct values.";
  if (!options.includes(form.correct_answer.trim()))
    return "Correct answer must be one of the four options.";
  if (!form.solution.trim()) return "A solution/explanation is required.";
  if (form.marks < 1 || form.marks > 10) return "Marks must be between 1 and 10.";
  if (form.estimated_time_sec < 10 || form.estimated_time_sec > 1800)
    return "Estimated time must be between 10 and 1800 seconds.";
  return null;
}

/**
 * Shared by "Add question" and "Edit" in the review queue so field layout
 * and client-side validation can't drift between the two entry points.
 */
export default function QuestionForm({
  initial,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<AdminQuestionRecord>;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (payload: QuestionFormPayload) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState(() => toFormState(initial));
  const [validationError, setValidationError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const setOption = (index: number, value: string) =>
    setForm((current) => {
      const options = [...current.options];
      options[index] = value;
      return { ...current, options };
    });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const issue = validate(form);
    if (issue) {
      setValidationError(issue);
      return;
    }
    setValidationError(null);
    void onSubmit({
      subject: form.subject.trim(),
      chapter: form.chapter.trim(),
      topic: form.topic.trim(),
      subtopic: form.subtopic.trim() || undefined,
      question_text: form.question_text.trim(),
      options: form.options.map((option) => option.trim()),
      correct_answer: form.correct_answer.trim(),
      solution: form.solution.trim(),
      bloom_level: form.bloom_level,
      difficulty: form.difficulty,
      marks: form.marks,
      estimated_time_sec: form.estimated_time_sec,
      concept_tags: form.concept_tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      common_errors: form.common_errors
        .split(",")
        .map((error) => error.trim())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {validationError ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700"
        >
          {validationError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink">Subject</span>
          <input
            required
            value={form.subject}
            onChange={(event) => set("subject", event.target.value)}
            className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink">Chapter</span>
          <input
            required
            value={form.chapter}
            onChange={(event) => set("chapter", event.target.value)}
            className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink">Topic</span>
          <input
            required
            value={form.topic}
            onChange={(event) => set("topic", event.target.value)}
            className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink">
          Question text
        </span>
        <textarea
          required
          rows={3}
          value={form.question_text}
          onChange={(event) => set("question_text", event.target.value)}
          className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {form.options.map((option, index) => (
          <label key={index} className="block">
            <span className="mb-2 block text-sm font-bold text-ink">
              Option {index + 1}
            </span>
            <input
              required
              value={option}
              onChange={(event) => setOption(index, event.target.value)}
              className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>
        ))}
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink">
          Correct answer
        </span>
        <select
          required
          value={form.correct_answer}
          onChange={(event) => set("correct_answer", event.target.value)}
          className="w-full rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          <option value="" disabled>
            Select the matching option
          </option>
          {form.options
            .map((option) => option.trim())
            .filter(Boolean)
            .map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink">
          Solution / explanation
        </span>
        <textarea
          required
          rows={3}
          value={form.solution}
          onChange={(event) => set("solution", event.target.value)}
          className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink">
            Bloom level
          </span>
          <select
            value={form.bloom_level}
            onChange={(event) => set("bloom_level", event.target.value)}
            className="w-full rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {BLOOM_LEVELS.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink">
            Difficulty
          </span>
          <select
            value={form.difficulty}
            onChange={(event) => set("difficulty", event.target.value)}
            className="w-full rounded-xl border border-hairline bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty}>{difficulty}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink">Marks</span>
          <input
            required
            type="number"
            min={1}
            max={10}
            value={form.marks}
            onChange={(event) => set("marks", Number(event.target.value))}
            className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-ink">
            Time (sec)
          </span>
          <input
            required
            type="number"
            min={10}
            max={1800}
            value={form.estimated_time_sec}
            onChange={(event) =>
              set("estimated_time_sec", Number(event.target.value))
            }
            className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink">
          Concept tags{" "}
          <span className="font-medium text-ink-mute">
            (comma-separated, optional{initial?.source === "AI_GENERATED" ? " — AI-suggested" : ""})
          </span>
        </span>
        <input
          value={form.concept_tags}
          onChange={(event) => set("concept_tags", event.target.value)}
          className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-ink">
          Common wrong-answer patterns{" "}
          <span className="font-medium text-ink-mute">
            (comma-separated, optional{initial?.source === "AI_GENERATED" ? " — AI-suggested" : ""})
          </span>
        </span>
        <input
          value={form.common_errors}
          onChange={(event) => set("common_errors", event.target.value)}
          placeholder="e.g. Using 1/r instead of 1/r²"
          className="w-full rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20,20,30,0.22)] transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-hairline px-4 py-2.5 text-sm font-bold text-ink-soft hover:bg-canvas"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
