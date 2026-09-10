"use client";

import { Check } from "lucide-react";
import type { DiagnosticAnalysis } from "@/lib/diagnostic-types";

type Grade = DiagnosticAnalysis["grade"];

/**
 * Mirrors the exact grade thresholds diagnostics.service.ts already computes
 * (scorePercent >= 80/60/40) — this doesn't invent a new mastery scale, it
 * just gives the grade the app already assigns (`analysis.grade`, already
 * shown as this page's title) a rung to land on.
 */
const RUNGS: Array<{ grade: Grade; range: string; activeTone: string }> = [
  { grade: "Needs work", range: "0–39%", activeTone: "bg-danger text-white" },
  { grade: "Average", range: "40–59%", activeTone: "bg-warning text-white" },
  { grade: "Good", range: "60–79%", activeTone: "bg-info text-white" },
  { grade: "Excellent", range: "80–100%", activeTone: "bg-success text-white" },
];

export default function MasteryLadder({ grade }: { grade: Grade }) {
  const activeIndex = RUNGS.findIndex((rung) => rung.grade === grade);

  return (
    <section className="rounded-2xl border border-hairline bg-surface p-5 shadow-[0_8px_22px_rgba(20,20,30,0.04)] sm:p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-mute">
        Mastery ladder
      </p>
      <h2 className="mt-2 font-heading text-xl font-semibold text-ink">
        Where this attempt lands
      </h2>

      <ol className="mt-5 space-y-2">
        {RUNGS.map((rung, index) => {
          const isActive = index === activeIndex;
          const isPast = activeIndex >= 0 && index < activeIndex;
          return (
            <li
              key={rung.grade}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300 ${
                isActive
                  ? rung.activeTone
                  : isPast
                    ? "bg-canvas text-ink-soft"
                    : "text-ink-mute"
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-white/20"
                    : isPast
                      ? "bg-ink-mute/15 text-ink-soft"
                      : "border border-hairline"
                }`}
              >
                {isPast ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="flex-1 text-sm font-bold">{rung.grade}</span>
              <span
                className={`text-xs font-semibold ${isActive ? "text-white/80" : "text-ink-mute"}`}
              >
                {rung.range}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
