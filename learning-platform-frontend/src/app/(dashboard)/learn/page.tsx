"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Compass, SearchX } from "lucide-react";
import AdaptiveStudySession from "@/components/learning/AdaptiveStudySession";
import TopicPlacementGate from "@/components/learning/TopicPlacementGate";
import TopicSearch from "@/components/search/TopicSearch";
import {
  learningScopeFromSearchParams,
  learningTabFromSearchParams,
} from "@/lib/learning";

export default function LearnPage() {
  const searchParams = useSearchParams();
  const scope = learningScopeFromSearchParams(searchParams);
  if (!scope) {
    return (
      <div className="mx-auto flex min-h-screen max-w-5xl items-center p-5 sm:p-8 lg:p-10">
        <section className="w-full rounded-[2rem] border border-hairline bg-surface p-5 shadow-[0_22px_70px_rgba(20,20,30,0.07)] sm:p-7 lg:p-9">
          <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-tint text-primary">
                <SearchX className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-mute">
                <Compass className="h-4 w-4" aria-hidden="true" />
                Learn
              </p>
              <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Pick a topic to start.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-ink-soft">
                Search any concept or chapter — its workspace opens ready to go.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-xl border border-hairline px-4 py-2 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
              >
                Back to dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="rounded-[1.5rem] border border-hairline bg-canvas p-4 sm:p-5">
              <TopicSearch />
            </div>
          </div>
        </section>
      </div>
    );
  }
  if (searchParams.get("placement") === "ask") {
    return (
      <TopicPlacementGate
        scope={scope}
        tab={learningTabFromSearchParams(searchParams)}
      />
    );
  }
  // Keying by scope gives every topic a clean workspace: an in-flight round,
  // tutor thread, and card queue never leak across topics.
  return (
    <AdaptiveStudySession
      key={`${scope.subject}|${scope.chapter}|${scope.topic}`}
      scope={scope}
      initialTab={learningTabFromSearchParams(searchParams)}
    />
  );
}
