"use client";

import Link from "next/link";
import { subjectHref } from "@/lib/catalog";
import { SUBJECT_THEMES } from "@/lib/subject-theme";
import type { SyllabusProgress } from "@/lib/catalog-types";
import type { StudentDashboardPayload } from "@/lib/student-dashboard-types";

type SubjectCoverage = StudentDashboardPayload["subjectCoverage"][number];

const EMPTY_COVERAGE: Omit<SubjectCoverage, "subject"> = {
  totalTopics: 0,
  masteredTopics: 0,
  activeTopics: 0,
  pausedTopics: 0,
  notStartedTopics: 0,
  topics: [],
};

function scoreTone(score: number) {
  if (score >= 70) return "text-success";
  if (score >= 40) return "text-warning";
  return "text-danger";
}

/**
 * A glanceable, always-three-cards view of Physics/Chemistry/Mathematics,
 * complementing (not replacing) StudentActionCenter's SubjectCoverageExplorer
 * — that panel is a single-subject-at-a-time deep dive behind a tab switch;
 * this one shows all three subjects simultaneously. Reuses the same
 * subjectCoverage data the dashboard already fetches — no new endpoint.
 */
export default function SubjectOverviewGrid({
  subjects,
  syllabus,
}: {
  subjects: StudentDashboardPayload["subjectCoverage"];
  /** Shared syllabus progress; when present it drives the bar and counts. */
  syllabus?: SyllabusProgress | null;
}) {
  return (
    <section aria-labelledby="subject-overview-heading">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
        Subjects
      </p>
      <h2
        id="subject-overview-heading"
        className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink"
      >
        Your subjects at a glance
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SUBJECT_THEMES.map((theme) => {
          const coverage: SubjectCoverage = subjects.find(
            (subject) => subject.subject === theme.label,
          ) ?? { subject: theme.label, ...EMPTY_COVERAGE };

          const scoredTopics = coverage.topics.filter(
            (topic) => topic.score !== null,
          );
          const avgScore =
            scoredTopics.length > 0
              ? Math.round(
                  scoredTopics.reduce(
                    (sum, topic) => sum + (topic.score ?? 0),
                    0,
                  ) / scoredTopics.length,
                )
              : null;
          const shared = syllabus?.subjects.find(
            (subject) => subject.slug === theme.id,
          );
          const masteredPercent = shared
            ? shared.percent
            : coverage.totalTopics > 0
              ? Math.round(
                  (coverage.masteredTopics / coverage.totalTopics) * 100,
                )
              : 0;
          const Icon = theme.icon;

          return (
            <Link
              key={theme.id}
              href={subjectHref(theme.id)}
              className="group overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_10px_28px_rgba(20,20,30,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(20,20,30,0.08)]"
            >
              <div
                className="flex items-center gap-3 p-4 text-white"
                style={{ background: theme.gradient }}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-heading text-base font-bold">
                    {theme.label}
                  </p>
                  <p className="text-[11px] text-white/80">
                    {shared
                      ? `${shared.completed}/${shared.total} topics completed`
                      : `${coverage.masteredTopics}/${coverage.totalTopics} topics mastered`}
                  </p>
                </div>
              </div>

              <div className="p-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                  <span
                    className={`block h-full rounded-full transition-[width] duration-700 ${theme.accent}`}
                    style={{ width: `${masteredPercent}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink-mute">
                    Avg score
                  </span>
                  {avgScore !== null ? (
                    <span className={`font-bold ${scoreTone(avgScore)}`}>
                      {avgScore}%
                    </span>
                  ) : (
                    <span className="font-medium text-ink-mute">
                      Not started
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
