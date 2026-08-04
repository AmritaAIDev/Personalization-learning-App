"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { learningUrl } from "@/lib/learning";
import type { LearningScope } from "@/lib/learning-types";

interface ConceptItem {
  name: string;
  questionCount: number;
  easy: number;
  medium: number;
  hard: number;
}

interface ConceptBreakdown {
  source: "subtopic" | "concept" | "none";
  items: ConceptItem[];
}

function Segment({
  value,
  total,
  tone,
}: {
  value: number;
  total: number;
  tone: string;
}) {
  if (value === 0) return null;
  return (
    <span
      className={`${tone} h-full`}
      style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
    />
  );
}

export default function SubtopicExplorer({ scope }: { scope: LearningScope }) {
  const [data, setData] = useState<ConceptBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams(scope).toString();
      const next = await apiFetch<ConceptBreakdown>(
        `/api/learning/subtopics?${params}`,
      );
      setData(next);
      setSelected(next.items[0]?.name ?? null);
    } catch {
      setData({ source: "none", items: [] });
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  // Loads in the background; render nothing until we know there's something to show.
  if (loading) {
    return (
      <div className="rounded-2xl bg-surface p-6 hairline elevate-sm">
        <div className="h-4 w-32 rounded-full skeleton" />
        <div className="mt-4 flex gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-8 w-24 rounded-full skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.items.length === 0) return null;

  const active =
    data.items.find((item) => item.name === selected) ?? data.items[0];
  const total = active.questionCount;

  return (
    <section className="rounded-2xl bg-surface p-6 hairline elevate-sm">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="text-[15px] font-semibold text-ink">
          {data.source === "subtopic" ? "Subtopic map" : "Concept map"}
        </h3>
        <span className="ml-auto text-xs text-ink-mute">
          {data.items.length} to explore
        </span>
      </div>

      {/* Interactive concept nodes — click to focus. */}
      <div className="mt-4 flex flex-wrap gap-2">
        {data.items.map((item) => {
          const isActive = item.name === active.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setSelected(item.name)}
              className={`group relative rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-ink text-white"
                  : "bg-canvas text-ink-soft hover:bg-primary-tint hover:text-primary"
              }`}
            >
              {item.name}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                  isActive ? "bg-white/20" : "bg-black/[0.05] text-ink-mute"
                }`}
              >
                {item.questionCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Focused detail — animates in on selection. */}
      <div
        key={active.name}
        className="mt-5 animate-fade rounded-xl bg-canvas p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{active.name}</p>
            <p className="mt-0.5 text-xs text-ink-mute">
              {active.questionCount} question
              {active.questionCount === 1 ? "" : "s"} · spans{" "}
              {[
                active.easy && "Easy",
                active.medium && "Medium",
                active.hard && "Hard",
              ]
                .filter(Boolean)
                .join(" · ") || "mixed difficulty"}
            </p>
          </div>
          <a
            href={learningUrl(scope, { tab: "practice" })}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-strong"
          >
            Practise
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        {/* Difficulty distribution bar. */}
        <div className="mt-4">
          <div className="flex h-2 overflow-hidden rounded-full bg-black/[0.05]">
            <Segment value={active.easy} total={total} tone="bg-primary/40" />
            <Segment value={active.medium} total={total} tone="bg-primary/70" />
            <Segment value={active.hard} total={total} tone="bg-primary" />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-mute">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary/40" /> Easy{" "}
              {active.easy}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary/70" /> Medium{" "}
              {active.medium}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" /> Hard{" "}
              {active.hard}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
