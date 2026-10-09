"use client";

import { Brain } from "lucide-react";
import { BAND_TONE, barTone, scoreTone } from "@/lib/catalog";
import type { AnalyticsInsights, BloomStat } from "@/lib/catalog-types";
import { InsightCards } from "./InsightCards";
import MasteryStars from "./MasteryStars";
import RadarChart from "./RadarChart";

const LEVEL_HINT: Record<string, string> = {
  Remember: "Recall facts and basic concepts",
  Understand: "Explain ideas or concepts",
  Apply: "Use information in new situations",
  Analyze: "Draw connections and break down information",
};

/**
 * Bloom's-taxonomy performance: a mastery card per level (accuracy, band,
 * stars), a skill radar, and Compass's insight cards. Shared by the subject
 * analytics page and the chapter page's Bloom tab.
 */
export default function BloomPanel({
  bloom,
  insights,
  hasData,
  scopeLabel,
}: {
  bloom: readonly BloomStat[];
  insights: AnalyticsInsights;
  hasData: boolean;
  /** e.g. "this chapter" / "Physics", for the empty-state wording. */
  scopeLabel: string;
}) {
  if (!hasData) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-hairline bg-canvas p-5 text-sm leading-6 text-ink-soft">
        <Brain className="mt-0.5 h-5 w-5 shrink-0 text-ink-mute" aria-hidden="true" />
        <p>
          Answer a few questions in {scopeLabel} and your Bloom&apos;s taxonomy
          profile will appear here, showing how you do at recalling,
          understanding, applying and analysing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <ul className="grid gap-3 sm:grid-cols-2">
          {bloom.map((level) => (
            <li
              key={level.level}
              className="min-w-0 rounded-2xl border border-hairline bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{level.level}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-mute">
                    {LEVEL_HINT[level.level] ?? ""}
                  </p>
                </div>
                {level.band ? (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${BAND_TONE[level.band]}`}
                  >
                    {level.band}
                  </span>
                ) : null}
              </div>
              <p className={`mt-3 font-heading text-3xl font-bold ${scoreTone(level.accuracy)}`}>
                {level.accuracy === null ? "—" : `${level.accuracy}%`}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                <span
                  className={`block h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${barTone(level.accuracy)}`}
                  style={{ width: `${level.accuracy ?? 0}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-mute">
                {level.answered === 0
                  ? "No answers yet"
                  : `${level.correct}/${level.answered} correct`}
              </p>
              <div className="mt-2">
                <MasteryStars mastery={level.mastery} />
              </div>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border border-hairline bg-surface p-4 sm:p-5">
          <h3 className="font-heading text-base font-bold text-ink">Skill radar</h3>
          <p className="mt-1 text-xs text-ink-mute">
            Accuracy at each thinking level.
          </p>
          <div className="mt-2">
            <RadarChart
              label="Bloom's taxonomy skill radar"
              points={bloom.map((level) => ({
                label: level.level,
                value: level.accuracy,
              }))}
            />
          </div>
        </div>
      </div>

      <InsightCards insights={insights} />
    </div>
  );
}
