"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LoaderCircle, Sparkles, WifiOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import SourceCitations from "@/components/learning/SourceCitations";
import type {
  Citation,
  ExplanationDepth,
  ExplanationResponse,
} from "@/lib/diagnostic-types";

const StudyMarkdown = dynamic(
  () => import("@/components/learning/StudyMarkdown"),
  { ssr: false },
);

const DEPTHS: Array<{ value: ExplanationDepth; label: string }> = [
  { value: "concise", label: "Concise" },
  { value: "step-by-step", label: "Step by step" },
  { value: "from-scratch", label: "From scratch" },
];

/**
 * One-tap AI explanation for a single reviewed question. The answer is already
 * revealed at this point, so the tutor teaches it in full at the chosen depth.
 * All content comes from the backend explain endpoint; nothing is generated in
 * the client. A deterministic fallback is served when the model is unavailable,
 * flagged so the learner knows.
 */
export default function ExplainThis({ endpoint }: { endpoint: string }) {
  const [depth, setDepth] = useState<ExplanationDepth>("step-by-step");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [grounded, setGrounded] = useState(true);
  const [sources, setSources] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (nextDepth: ExplanationDepth) => {
    setDepth(nextDepth);
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ExplanationResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify({ depth: nextDepth }),
      });
      setExplanation(data.explanation);
      setGrounded(data.grounded);
      setSources(data.sources ?? []);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The explanation could not be generated right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-primary/15 bg-primary-tint/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void run(depth)}
          disabled={loading}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {explanation ? "Regenerate" : "Explain this"}
        </button>
        <div
          className="flex gap-1 rounded-lg border border-hairline bg-surface p-0.5"
          role="group"
          aria-label="Explanation depth"
        >
          {DEPTHS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={depth === item.value}
              disabled={loading}
              onClick={() => void run(item.value)}
              className={`min-h-8 rounded-md px-2.5 text-[11px] font-bold transition disabled:opacity-60 ${
                depth === item.value
                  ? "bg-primary text-white"
                  : "text-ink-soft hover:bg-canvas"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p
          className="mt-3 rounded-lg bg-danger-tint px-3 py-2 text-xs font-semibold text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {explanation ? (
        <div className="mt-3 rounded-lg border border-hairline bg-surface p-4">
          {!grounded ? (
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-warning">
              <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
              Offline explanation from the reviewed solution.
            </p>
          ) : null}
          <StudyMarkdown className="text-sm leading-6 text-ink-soft">
            {explanation}
          </StudyMarkdown>
          <SourceCitations sources={sources} />
        </div>
      ) : null}
    </div>
  );
}
