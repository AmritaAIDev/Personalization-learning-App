"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowRight, Info, Sigma, Target } from "lucide-react";
import { TOPIC_STATUS, pluralize, scoreTone } from "@/lib/catalog";
import type { CatalogChapterDetail } from "@/lib/catalog-types";
import { learningUrl } from "@/lib/learning";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "objectives", label: "Objectives" },
  { id: "topics", label: "Topics" },
  { id: "formulas", label: "Key formulas" },
] as const;
type TabId = (typeof TABS)[number]["id"];

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
          chapter: detail.chapter.name,
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

/** Chapter study-guide tabs (roving tabindex, arrow-key navigation). */
export default function ChapterTabs({
  detail,
}: {
  detail: CatalogChapterDetail;
}) {
  const [active, setActive] = useState<TabId>("overview");
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") {
      next = (index - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    setActive(TABS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <section className="rounded-2xl border border-hairline bg-surface shadow-[0_8px_22px_rgba(20,20,30,0.04)]">
      <div
        role="tablist"
        aria-label="Chapter study guide"
        className="flex gap-1 overflow-x-auto border-b border-hairline px-2 pt-2 [scrollbar-width:thin]"
      >
        {TABS.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                refs.current[index] = node;
              }}
              id={`chapter-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`chapter-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`min-h-11 shrink-0 whitespace-nowrap rounded-t-xl border-b-2 px-4 text-sm font-semibold transition motion-reduce:transition-none ${
                selected
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-mute hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`chapter-panel-${active}`}
        aria-labelledby={`chapter-tab-${active}`}
        className="min-w-0 p-4 sm:p-6"
      >
        {active === "overview" ? <OverviewPanel detail={detail} /> : null}
        {active === "objectives" ? <ObjectivesPanel detail={detail} /> : null}
        {active === "topics" ? <TopicsPanel detail={detail} /> : null}
        {active === "formulas" ? <FormulasPanel detail={detail} /> : null}
      </div>
    </section>
  );
}
