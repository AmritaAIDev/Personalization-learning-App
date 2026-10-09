"use client";

/**
 * Focus areas — the weakest skills by Bayesian knowledge tracing (BKT).
 *
 * Reads GET /api/knowledge-tracing/weak (backend recomputes from every
 * graded answer across practice, diagnostics, mock tests and adaptive
 * sessions). Unlike a raw accuracy list, single lucky/unlucky answers are
 * damped, so what shows here is genuinely shaky ground, and thin evidence
 * is labelled as such instead of guessed at.
 */

import { useEffect } from "react";
import Link from "next/link";
import { Crosshair, Sparkles } from "lucide-react";
import { PanelError, PanelLoading } from "@/components/plan/PlanBits";
import { LEARNING_DATA_UPDATED_EVENT, apiFetch } from "@/lib/api";
import { learningUrl } from "@/lib/learning";
import { useApiResource } from "@/lib/useApiResource";

interface SkillMasteryView {
  subject: string;
  chapter: string;
  topic: string;
  pKnow: number;
  attempts: number;
  correct: number;
  band: 'mastered' | 'developing' | 'weak' | 'unseen';
  confidence: 'low' | 'ok';
  lastTracedAt: string | null;
}

const BAND_STYLE: Record<SkillMasteryView['band'], string> = {
  mastered: 'bg-success-tint text-success',
  developing: 'bg-warning-tint text-warning',
  weak: 'bg-danger-tint text-danger',
  unseen: 'bg-canvas text-ink-mute',
};

export default function FocusAreasPanel() {
  const { data, loading, error, reload } = useApiResource<SkillMasteryView[]>(
    () => apiFetch<SkillMasteryView[]>('/api/knowledge-tracing/weak?limit=6'),
  );

  // A graded answer anywhere in the app should refresh this list promptly.
  useEffect(() => {
    const refresh = () => void reload();
    window.addEventListener(LEARNING_DATA_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(LEARNING_DATA_UPDATED_EVENT, refresh);
  }, [reload]);

  return (
    <section className="rounded-[1.65rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
            Focus areas
          </p>
          <h2 className="mt-1 font-heading text-xl font-bold text-ink">
            Concepts your answers say need another pass
          </h2>
          <p className="mt-1 text-xs leading-5 text-ink-mute">
            Bayesian mastery estimates from every graded answer — one lucky or
            unlucky attempt never swings these.
          </p>
        </div>
      </div>

      {loading ? (
        <PanelLoading label="Loading focus areas" />
      ) : error ? (
        <PanelError message={error} onRetry={() => void reload()} />
      ) : data && data.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {data.map((skill) => (
            <li
              key={`${skill.subject}|${skill.chapter}|${skill.topic}`}
              className="rounded-2xl border border-hairline bg-canvas/60 p-3.5 transition hover:border-primary/25"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                  {skill.topic}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${BAND_STYLE[skill.band]}`}
                >
                  {skill.band}
                </span>
                {skill.confidence === 'low' ? (
                  <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-mute ring-1 ring-hairline">
                    low data
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div
                  className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-hairline"
                  role="meter"
                  aria-valuenow={Math.round(skill.pKnow * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Mastery of ${skill.topic}`}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: `${Math.round(skill.pKnow * 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-[11px] font-semibold text-ink-mute">
                  {Math.round(skill.pKnow * 100)}% · {skill.correct}/{skill.attempts} correct
                </span>
                <Link
                  href={learningUrl({
                    subject: skill.subject,
                    chapter: skill.chapter,
                    topic: skill.topic,
                  })}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-tint px-3.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Learn
                </Link>
              </div>
              <p className="mt-1.5 truncate text-[11px] text-ink-mute">
                {skill.subject} · {skill.chapter}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-hairline bg-canvas p-6 text-center">
          <p className="text-sm font-semibold text-ink">No shaky concepts detected yet</p>
          <p className="mt-1 text-xs leading-5 text-ink-mute">
            Keep practising — focus areas appear once your answers show a
            pattern worth targeting.
          </p>
        </div>
      )}
    </section>
  );
}
