"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Info, Sigma, Target } from "lucide-react";
import { TOPIC_STATUS, pluralize, scoreTone } from "@/lib/catalog";
import type { CatalogChapterDetail } from "@/lib/catalog-types";
import { learningUrl } from "@/lib/learning";
import { useChapterAnalytics } from "@/lib/useCatalog";
import BloomPanel from "./BloomPanel";
import Tabs from "./Tabs";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "objectives", label: "Objectives" },
  { id: "topics", label: "Topics" },
  { id: "formulas", label: "Key formulas" },
  { id: "bloom", label: "Bloom's taxonomy" },
] as const;

function Empty({ icon: Icon, children }: { icon: typeof Info; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-hairline bg-canvas p-5 text-sm leading-6 text-ink-soft">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ink-mute" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function OverviewPanel({ detail }: { detail: CatalogChapterDetail }) {
  const { chapter, meta } = detail;
  if (!meta?.overview) {
    return (
      <Empty icon={Info}>
        The study guide for this chapter is still being written. Topics,
        practice and flashcards below already work.
      </Empty>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-ink-soft sm:text-base">
        {meta.overview}
      </p>
      {meta.jeeWeightageNote ? (
        <p className="rounded-xl bg-primary-tint px-4 py-3 text-sm font-medium text-primary">
          JEE weightage: {meta.jeeWeightageNote}
        </p>
      ) : null}
      <p className="text-xs text-ink-mute">
        {pluralize(chapter.topicCount, "topic")} ·{" "}
        {pluralize(chapter.questionCount, "practice question")}
      </p>
    </div>
  );
}

function ObjectivesPanel({ detail }: { detail: CatalogChapterDetail }) {
  const objectives = detail.meta?.objectives ?? [];
  if (objectives.length === 0) {
    return (
      <Empty icon={Target}>
        Learning objectives will appear here once the study guide is published.
      </Empty>
    );
  }
  return (
    <ol className="space-y-2.5">
      {objectives.map((objective, index) => (
        <li
          key={objective}
          className="flex items-start gap-3 rounded-xl bg-canvas px-4 py-3 text-sm leading-6 text-ink"
        >
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-tint text-xs font-bold text-primary">
            {index + 1}
          </span>
          <span className="min-w-0 break-words">{objective}</span>
        </li>
      ))}
    </ol>
  );
}

function TopicsPanel({ detail }: { detail: CatalogChapterDetail }) {
  if (detail.topics.length === 0) {
    return <Empty icon={Info}>Topics for this chapter are still being added.</Empty>;
  }
  return (
    <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline">
      {detail.topics.map((topic) => {
        const status = TOPIC_STATUS[topic.status];
        const href = learningUrl({
          subject: detail.chapter.subject,
          chapter: topic.scopeChapter,
          topic: topic.name,
        });
        return (
          <li key={topic.name}>
            <Link
              href={href}
              className="group flex min-h-14 items-center gap-3 bg-surface px-4 py-3 transition hover:bg-canvas motion-reduce:transition-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {topic.name}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs">
                  <span className={`font-semibold ${status.tone}`}>
                    {status.label}
                  </span>
                  <span className="text-ink-mute">
                    {pluralize(topic.questionCount, "question")}
                  </span>
                </span>
              </span>
              <span
                className={`shrink-0 font-heading text-sm font-bold ${scoreTone(topic.score)}`}
              >
                {topic.score === null ? "—" : `${topic.score}%`}
              </span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-ink-mute transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function FormulasPanel({ detail }: { detail: CatalogChapterDetail }) {
  const formulas = detail.meta?.keyFormulas ?? [];
  if (formulas.length === 0) {
    return (
      <Empty icon={Sigma}>
        No key formulas are listed for this chapter. Open a topic to see the
        concepts and worked examples.
      </Empty>
    );
  }
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {formulas.map((formula) => (
        <li
          key={formula}
          className="min-w-0 break-words rounded-xl border border-hairline bg-canvas px-4 py-3 font-mono text-sm text-ink"
        >
          {formula}
        </li>
      ))}
    </ul>
  );
}

function BloomTab({ detail }: { detail: CatalogChapterDetail }) {
  // Mounted only while this tab is open, so the request happens on first view.
  const { data, loading, error, reload } = useChapterAnalytics(
    detail.chapter.subjectSlug,
    detail.chapter.slug,
  );
  if (loading) {
    return (
      <div
        className="h-48 rounded-2xl skeleton"
        role="status"
        aria-label="Loading Bloom analytics"
      />
    );
  }
  if (error || !data) {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/20 bg-danger-tint p-4 text-sm text-danger"
        role="alert"
      >
        <span>{error ?? "Bloom analytics could not be loaded."}</span>
        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex min-h-9 items-center rounded-full bg-danger px-4 text-xs font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }
  return (
    <BloomPanel
      bloom={data.bloom}
      insights={data.insights}
      hasData={data.hasData}
      scopeLabel="this chapter"
    />
  );
}

/** Chapter study-guide tabs (shared keyboard-accessible tablist). */
export default function ChapterTabs({
  detail,
}: {
  detail: CatalogChapterDetail;
}) {
  return (
    <Tabs
      tabs={TABS}
      label="Chapter study guide"
      idPrefix="chapter"
      render={(active) => {
        if (active === "overview") return <OverviewPanel detail={detail} />;
        if (active === "objectives") return <ObjectivesPanel detail={detail} />;
        if (active === "topics") return <TopicsPanel detail={detail} />;
        if (active === "formulas") return <FormulasPanel detail={detail} />;
        return <BloomTab detail={detail} />;
      }}
    />
  );
}
