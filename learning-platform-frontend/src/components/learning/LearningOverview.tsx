"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { learningUrl } from "@/lib/learning";
import type { LearningDashboardPayload } from "@/lib/learning-types";

/**
 * The dashboard page already fetches this exact payload as part of
 * /api/dashboard/student (see StudentDashboardPayload.learning on the
 * backend) — this component used to redundantly re-fetch
 * /api/learning/dashboard itself, doubling the round-trip and DB work on
 * every dashboard load. It now just renders the data its parent already has.
 */
export default function LearningOverview({
  data,
}: {
  data: LearningDashboardPayload;
}) {
  return (
    <section className="mt-14">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink">
          Learning progress
        </h2>
        {data.history[0] ? (
          <span className="text-[13px] text-ink-mute">
            Latest checkpoint · {data.history[0].coordinate.label}
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 animate-fade lg:grid-cols-2">
          {/* Continue learning */}
          <section className="rounded-2xl bg-surface p-6 hairline elevate-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-ink">
                Continue learning
              </h3>
              <span className="text-xs font-medium text-ink-mute">
                {data.activeTopics.length} active
              </span>
            </div>
            {data.activeTopics.length === 0 ? (
              <p className="mt-5 rounded-xl bg-canvas p-4 text-sm leading-6 text-ink-soft">
                No active topics yet.
              </p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {data.activeTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={learningUrl(topic, { tab: "overview" })}
                    className="group flex items-center justify-between gap-4 rounded-xl bg-canvas p-4 transition duration-200 hover:bg-surface hover:shadow-[0_8px_24px_rgba(20,20,30,0.06)]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {topic.topic}
                      </span>
                      <span className="mt-1 block text-xs text-ink-mute">
                        {topic.stageLabel} · {topic.currentCoordinate.label}
                      </span>
                      <span className="mt-3 block h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-black/[0.06]">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${topic.masteryPercent}%` }}
                        />
                      </span>
                    </span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-ink"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Suggested next topics */}
          <section className="rounded-2xl bg-surface p-6 hairline elevate-sm">
            <h3 className="text-[15px] font-semibold text-ink">
              Suggested next
            </h3>
            {data.suggestions.length === 0 ? (
              <p className="mt-5 text-sm leading-6 text-ink-soft">
                No suggestions yet.
              </p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {data.suggestions.map((topic) => (
                  <Link
                    key={[topic.subject, topic.chapter, topic.topic].join("-")}
                    href={learningUrl(topic, { tab: "overview" })}
                    className="group block rounded-xl bg-canvas p-4 transition duration-200 hover:bg-surface hover:shadow-[0_8px_24px_rgba(20,20,30,0.06)]"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          {topic.topic}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-ink-soft">
                          {topic.reason}
                        </span>
                      </span>
                      <ArrowRight
                        className="mt-0.5 h-4 w-4 shrink-0 text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-ink"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-3 inline-block rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                      {topic.questionCount} reviewed questions
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Completed topics */}
          <section className="rounded-2xl bg-surface p-6 hairline elevate-sm lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-ink">
                Completed topics
              </h3>
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {data.completedTopics.length} mastered
              </span>
            </div>
            {data.completedTopics.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-ink-soft">
                No mastered topics yet.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.completedTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={learningUrl(topic, { tab: "overview" })}
                    className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    {topic.topic}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
    </section>
  );
}
