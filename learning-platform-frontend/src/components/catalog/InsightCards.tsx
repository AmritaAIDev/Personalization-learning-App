"use client";

import { Lightbulb, Target, TrendingDown, TrendingUp } from "lucide-react";
import { BAND_TONE, barTone, scoreTone } from "@/lib/catalog";
import { skillBandFor } from "@/lib/catalog";
import type { AnalyticsInsights, SkillStat } from "@/lib/catalog-types";

/** Compass's three skill cards: Accuracy, Formula recall, Problem solving. */
export function SkillCards({ skills }: { skills: readonly SkillStat[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {skills.map((skill) => {
        const band = skillBandFor(skill.accuracy);
        return (
          <li
            key={skill.key}
            className="min-w-0 rounded-2xl border border-hairline bg-surface p-4 shadow-[0_8px_22px_rgba(20,20,30,0.04)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-bold text-ink">{skill.label}</p>
              {band ? (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${BAND_TONE[band]}`}
                >
                  {band}
                </span>
              ) : null}
            </div>
            <p className={`mt-2 font-heading text-3xl font-bold ${scoreTone(skill.accuracy)}`}>
              {skill.accuracy === null ? "—" : `${skill.accuracy}%`}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
              <span
                className={`block h-full rounded-full ${barTone(skill.accuracy)}`}
                style={{ width: `${skill.accuracy ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ink-mute">{skill.detail}</p>
            {skill.tip ? (
              <p className="mt-2 text-xs font-medium leading-5 text-ink-soft">
                {skill.tip}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Compass's four insight cards: strongest, needs attention, focus, study tip. */
export function InsightCards({ insights }: { insights: AnalyticsInsights }) {
  const cards = [
    {
      key: "strongest",
      icon: TrendingUp,
      tone: "bg-success-tint text-success",
      title: "Strongest skill",
      body: insights.strongestBloom
        ? `${insights.strongestBloom.level} (${insights.strongestBloom.accuracy}%)`
        : null,
    },
    {
      key: "weakest",
      icon: TrendingDown,
      tone: "bg-danger-tint text-danger",
      title: "Needs attention",
      body: insights.weakestBloom
        ? `${insights.weakestBloom.level} (${insights.weakestBloom.accuracy}%)`
        : null,
    },
    {
      key: "focus",
      icon: Target,
      tone: "bg-info-tint text-info",
      title: "Recommended focus",
      body: insights.focus,
    },
    {
      key: "tip",
      icon: Lightbulb,
      tone: "bg-warning-tint text-warning",
      title: "Study tip",
      body: insights.tip,
    },
  ].filter((card) => card.body !== null);

  if (cards.length === 0) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ key, icon: Icon, tone, title, body }) => (
        <li
          key={key}
          className="flex min-w-0 items-start gap-3 rounded-2xl border border-hairline bg-surface p-4"
        >
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-mute">
              {title}
            </p>
            <p className="mt-1 break-words text-sm font-semibold leading-5 text-ink">
              {body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
