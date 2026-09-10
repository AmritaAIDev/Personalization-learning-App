"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  CircleAlert,
  Clock,
  GraduationCap,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useApiResource } from "@/lib/useApiResource";
import { friendlyBloomLabel, learningUrl } from "@/lib/learning";
import { useBookmarkedQuestions } from "@/lib/useBookmarkedQuestions";
import BookmarkButton from "@/components/learning/BookmarkButton";
import ResourceCard from "@/components/learning/ResourceCard";
import type { NotebookMistakeCard } from "@/lib/notebook-types";
import type {
  RevisionHubPayload,
  RevisionTopicView,
} from "@/lib/revision-types";

const TABS = [
  { id: "queue", label: "Queue" },
  { id: "wrong", label: "Wrong answers" },
  { id: "bookmarks", label: "Bookmarks" },
  { id: "weak", label: "Weak topics" },
  { id: "recent", label: "Recent" },
  { id: "recommendations", label: "Recommendations" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function scoreTone(score: number) {
  if (score >= 70) return "text-success";
  if (score >= 40) return "text-warning";
  return "text-danger";
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ListChecks;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-canvas p-8 text-center">
      <Icon className="mx-auto h-6 w-6 text-ink-mute" aria-hidden="true" />
      <p className="mt-3 font-heading text-base font-bold text-ink">
        {title}
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-soft">
        {body}
      </p>
    </div>
  );
}

function MistakeCard({
  card,
  bookmarked,
  pending,
  onToggleBookmark,
}: {
  card: NotebookMistakeCard;
  bookmarked: boolean;
  pending: boolean;
  onToggleBookmark: () => void;
}) {
  return (
    <article className="rounded-2xl border border-hairline bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-mute">
          <span
            className={`rounded-full px-2 py-0.5 ${
              card.reviewState === "DUE"
                ? "bg-danger-tint text-danger"
                : "bg-success-tint text-success"
            }`}
          >
            {card.reviewState === "DUE" ? "Due" : "Scheduled"}
          </span>
          <span>{card.difficulty}</span>
          <span>{friendlyBloomLabel(card.bloomLevel)}</span>
        </div>
        <BookmarkButton
          bookmarked={bookmarked}
          pending={pending}
          onToggle={onToggleBookmark}
        />
      </div>
      <p className="mt-2.5 text-sm font-semibold leading-6 text-ink">
        {card.questionText}
      </p>
      <p className="mt-2 text-xs text-ink-mute">
        {card.subject} · {card.chapter} · {card.topic}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/notebook"
          className="inline-flex items-center gap-1.5 rounded-lg bg-canvas px-3 py-1.5 text-xs font-bold text-ink-soft transition hover:bg-primary-tint hover:text-primary"
        >
          Review in Notebook
        </Link>
        <Link
          href={learningUrl(card.practiceSimilar, { tab: "practice" })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-tint px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
        >
          Practice similar <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function TopicCard({ topic }: { topic: RevisionTopicView }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-hairline bg-surface p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{topic.topic}</p>
        <p className="mt-0.5 truncate text-xs text-ink-mute">
          {topic.subject} · {topic.chapter}
        </p>
      </div>
      <span className={`text-sm font-bold ${scoreTone(topic.score)}`}>
        {topic.score}%
      </span>
      <Link
        href={learningUrl(topic, { tab: "practice" })}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-tint px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
      >
        Practice <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </article>
  );
}

export default function RevisionHubPage() {
  const [tab, setTab] = useState<TabId>("queue");
  const fetchHub = useCallback(
    () => apiFetch<RevisionHubPayload>("/api/revision/hub"),
    [],
  );
  const { data, loading, error, reload } = useApiResource(
    fetchHub,
    "Your revision hub could not be loaded.",
  );
  const { bookmarkedIds, pendingIds, toggleBookmark } =
    useBookmarkedQuestions();

  const dueWrong = useMemo(
    () => data?.wrong.filter((card) => card.reviewState === "DUE") ?? [],
    [data],
  );

  const tabCounts: Record<TabId, number> = {
    queue: (data?.summary.dueCount ?? 0) + (data?.summary.weakTopicCount ?? 0),
    wrong: data?.wrong.length ?? 0,
    bookmarks: data?.summary.bookmarkCount ?? 0,
    weak: data?.summary.weakTopicCount ?? 0,
    recent: data?.summary.recentCount ?? 0,
    recommendations: data?.recommendations.topicRecommendations.length ?? 0,
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pt-9 pb-20 sm:px-8 lg:px-10">
      <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
        <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
        Revision hub
      </p>
      <h1 className="mt-2 font-heading page-title text-ink">
        Everything worth revisiting, in one place
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
        Wrong answers, bookmarks, weak topics and recommendations — pulled
        from your real activity across practice, diagnostics and mock tests.
      </p>

      {error ? (
        <div
          className="mt-6 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-tint p-4 text-sm text-danger"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Something needs attention</p>
            <p className="mt-1 leading-6">{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-danger px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-danger/90"
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="mt-8 space-y-4">
          <div className="h-16 rounded-2xl skeleton" />
          <div className="h-64 rounded-2xl skeleton" />
        </div>
      ) : null}

      {data ? (
        <>
          {/* Summary strip */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Due", value: data.summary.dueCount, tone: "text-danger" },
              { label: "Scheduled", value: data.summary.resolvedCount, tone: "text-success" },
              { label: "Bookmarked", value: data.summary.bookmarkCount, tone: "text-primary" },
              { label: "Weak topics", value: data.summary.weakTopicCount, tone: "text-warning" },
              { label: "Recent", value: data.summary.recentCount, tone: "text-info" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-hairline bg-surface p-4 text-center"
              >
                <p className={`font-heading text-2xl font-bold ${stat.tone}`}>
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-mute">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div
            className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-hairline bg-surface p-1 custom-scrollbar"
            role="tablist"
            aria-label="Revision sections"
          >
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  tab === item.id
                    ? "bg-primary text-white"
                    : "text-ink-soft hover:bg-canvas"
                }`}
              >
                {item.label}
                {tabCounts[item.id] > 0 ? ` (${tabCounts[item.id]})` : ""}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "queue" ? (
              <div className="space-y-6">
                <section>
                  <h2 className="mb-3 font-heading text-lg font-bold text-ink">
                    Due for review
                  </h2>
                  {dueWrong.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle2}
                      title="Nothing due right now"
                      body="Wrong answers land here as soon as they're due for review."
                    />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {dueWrong.map((card) => (
                        <MistakeCard
                          key={card.id}
                          card={card}
                          bookmarked={bookmarkedIds.has(card.questionId)}
                          pending={pendingIds.has(card.questionId)}
                          onToggleBookmark={() =>
                            void toggleBookmark(card.questionId)
                          }
                        />
                      ))}
                    </div>
                  )}
                </section>
                <section>
                  <h2 className="mb-3 font-heading text-lg font-bold text-ink">
                    Weakest topics
                  </h2>
                  {data.weakTopics.length === 0 ? (
                    <EmptyState
                      icon={Sparkles}
                      title="No weak topics tracked"
                      body="Once you've practiced enough for a topic to have a real score, weak ones show up here."
                    />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {data.weakTopics.map((topic) => (
                        <TopicCard
                          key={`${topic.subject}-${topic.chapter}-${topic.topic}`}
                          topic={topic}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            {tab === "wrong" ? (
              data.wrong.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No wrong answers on record"
                  body="Mistakes from practice, diagnostics and adaptive sessions will appear here automatically."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.wrong.map((card) => (
                    <MistakeCard
                      key={card.id}
                      card={card}
                      bookmarked={bookmarkedIds.has(card.questionId)}
                      pending={pendingIds.has(card.questionId)}
                      onToggleBookmark={() =>
                        void toggleBookmark(card.questionId)
                      }
                    />
                  ))}
                </div>
              )
            ) : null}

            {tab === "bookmarks" ? (
              data.bookmarks.length === 0 ? (
                <EmptyState
                  icon={Bookmark}
                  title="No bookmarks yet"
                  body="Tap the bookmark icon on any reviewed question to save it here for later."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.bookmarks.map((bookmark) => (
                    <article
                      key={bookmark.questionId}
                      className="rounded-2xl border border-hairline bg-surface p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-mute">
                          {bookmark.difficulty} ·{" "}
                          {friendlyBloomLabel(bookmark.bloomLevel)}
                        </p>
                        <BookmarkButton
                          bookmarked={bookmarkedIds.has(bookmark.questionId)}
                          pending={pendingIds.has(bookmark.questionId)}
                          onToggle={() =>
                            void toggleBookmark(bookmark.questionId)
                          }
                        />
                      </div>
                      <p className="mt-2.5 text-sm font-semibold leading-6 text-ink">
                        {bookmark.questionText}
                      </p>
                      <p className="mt-2 text-xs text-ink-mute">
                        {bookmark.subject} · {bookmark.chapter} ·{" "}
                        {bookmark.topic}
                      </p>
                      <Link
                        href={learningUrl(bookmark, { tab: "practice" })}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-tint px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                      >
                        Practice similar{" "}
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </article>
                  ))}
                </div>
              )
            ) : null}

            {tab === "weak" ? (
              data.weakTopics.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No weak topics tracked"
                  body="Once you've practiced enough for a topic to have a real score, weak ones show up here."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.weakTopics.map((topic) => (
                    <TopicCard
                      key={`${topic.subject}-${topic.chapter}-${topic.topic}`}
                      topic={topic}
                    />
                  ))}
                </div>
              )
            ) : null}

            {tab === "recent" ? (
              data.recentlyPracticed.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No recent activity"
                  body="Topics you've practiced recently will appear here."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.recentlyPracticed.map((topic) => (
                    <TopicCard
                      key={`${topic.subject}-${topic.chapter}-${topic.topic}`}
                      topic={topic}
                    />
                  ))}
                </div>
              )
            ) : null}

            {tab === "recommendations" ? (
              data.recommendations.topicRecommendations.length === 0 &&
              data.recommendations.generalResources.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No recommendations yet"
                  body="Once you have a weak topic, curated resources for it will show up here."
                />
              ) : (
                <div className="space-y-8">
                  {data.recommendations.topicRecommendations.map((rec) => (
                    <div key={rec.topic}>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-3">
                        <h3 className="font-heading text-lg font-bold text-ink">
                          {rec.topic}
                        </h3>
                        {rec.formula ? (
                          <p className="rounded-xl border border-success/25 bg-success-tint px-3 py-2 text-xs font-semibold text-success">
                            {rec.formula}
                          </p>
                        ) : null}
                      </div>
                      {rec.resources.length > 0 ? (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {rec.resources.map((resource) => (
                            <ResourceCard key={resource.id} resource={resource} />
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-ink-soft">
                          No additional resources yet for this topic.
                        </p>
                      )}
                    </div>
                  ))}
                  {data.recommendations.generalResources.length > 0 ? (
                    <div>
                      <h3 className="border-b border-hairline pb-3 font-heading text-lg font-bold text-ink">
                        General resources
                      </h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data.recommendations.generalResources.map(
                          (resource) => (
                            <ResourceCard key={resource.id} resource={resource} />
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
