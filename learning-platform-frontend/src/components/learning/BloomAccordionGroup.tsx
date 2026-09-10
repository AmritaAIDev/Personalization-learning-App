"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CheckCircle2, CircleX } from "lucide-react";
import { friendlyBloomLabel } from "@/lib/learning";

export interface BloomGroupableResult {
  id: string;
  questionText: string;
  bloomLevel: string;
  isCorrect: boolean;
  difficulty: string;
}

interface BloomSection {
  bloomLevel: string;
  correct: number;
  total: number;
  score: number;
  questions: BloomGroupableResult[];
}

function toneFor(score: number) {
  if (score >= 70) return { ring: "text-success", chip: "bg-success-tint text-success" };
  if (score >= 40) return { ring: "text-warning", chip: "bg-warning-tint text-warning" };
  return { ring: "text-danger", chip: "bg-danger-tint text-danger" };
}

function MiniScoreRing({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const bounded = Math.max(0, Math.min(100, score));
  const offset = circumference - (bounded / 100) * circumference;
  const tone = toneFor(bounded);
  return (
    <div className="relative grid h-12 w-12 shrink-0 place-items-center">
      <svg
        className="h-12 w-12 -rotate-90"
        viewBox="0 0 44 44"
        role="img"
        aria-label={`${bounded}% correct`}
      >
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-hairline"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-[stroke-dashoffset] duration-700 ${tone.ring}`}
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-ink">
        {bounded}%
      </span>
    </div>
  );
}

/**
 * Groups a flat question-review list by Bloom level, one collapsible section
 * per level with a mini score ring — the same organizing idea as
 * jee-compass's BloomSection.jsx, built on data this app already computes
 * per question (bloomLevel, isCorrect) rather than a new endpoint.
 */
export default function BloomAccordionGroup({
  results,
}: {
  results: BloomGroupableResult[];
}) {
  const sections = useMemo<BloomSection[]>(() => {
    const byLevel = new Map<string, BloomGroupableResult[]>();
    for (const result of results) {
      const existing = byLevel.get(result.bloomLevel) ?? [];
      existing.push(result);
      byLevel.set(result.bloomLevel, existing);
    }
    return Array.from(byLevel.entries()).map(([bloomLevel, questions]) => {
      const correct = questions.filter((q) => q.isCorrect).length;
      return {
        bloomLevel,
        correct,
        total: questions.length,
        score: Math.round((correct / questions.length) * 100),
        questions,
      };
    });
  }, [results]);

  const weakestLevel = useMemo(
    () =>
      sections.length > 0
        ? [...sections].sort((a, b) => a.score - b.score)[0].bloomLevel
        : null,
    [sections],
  );
  const [openLevel, setOpenLevel] = useState<string | null>(weakestLevel);

  if (sections.length === 0) return null;

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const isOpen = openLevel === section.bloomLevel;
        const tone = toneFor(section.score);
        return (
          <div
            key={section.bloomLevel}
            className="overflow-hidden rounded-2xl border border-hairline bg-surface"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() =>
                setOpenLevel(isOpen ? null : section.bloomLevel)
              }
              className="flex w-full items-center gap-4 p-4 text-left"
            >
              <MiniScoreRing score={section.score} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">
                  {friendlyBloomLabel(section.bloomLevel)}
                </span>
                <span className="mt-0.5 block text-xs text-ink-mute">
                  {section.correct}/{section.total} correct
                </span>
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone.chip}`}
              >
                {section.total} question{section.total === 1 ? "" : "s"}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-ink-mute transition ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {isOpen ? (
              <div className="grid gap-2 border-t border-hairline p-4 pt-3 sm:grid-cols-2">
                {section.questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-2.5 rounded-xl bg-canvas p-3"
                  >
                    {question.isCorrect ? (
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-success"
                        aria-hidden="true"
                      />
                    ) : (
                      <CircleX
                        className="mt-0.5 h-4 w-4 shrink-0 text-danger"
                        aria-hidden="true"
                      />
                    )}
                    <span className="min-w-0 text-xs leading-5 text-ink-soft">
                      {question.questionText}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
