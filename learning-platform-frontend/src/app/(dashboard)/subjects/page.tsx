"use client";

import Link from "next/link";
import { Library, ListChecks, Map as MapIcon } from "lucide-react";
import { CatalogError, CatalogSkeleton } from "@/components/catalog/CatalogState";
import SubjectCard from "@/components/catalog/SubjectCard";
import EmptyState from "@/components/EmptyState";
import { useCatalogSubjects } from "@/lib/useCatalog";

export default function SubjectsPage() {
  const { data, loading, error, reload } = useCatalogSubjects();

  return (
    <div className="min-h-screen bg-canvas pb-20 premium-mesh">
      <main className="mx-auto w-full max-w-6xl px-5 pt-9 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="animate-rise min-w-0">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
              Subjects
            </p>
            <h1 className="mt-2 font-heading page-title text-ink">
              Browse the full syllabus
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
              Every subject, chapter and topic in one place, with your progress
              on each.
            </p>
          </div>
          <div className="animate-rise flex flex-wrap gap-2 [animation-delay:70ms]">
            <Link
              href="/journey"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-hairline bg-surface px-4 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" />
              Guided journey
            </Link>
            <Link
              href="/revision"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-hairline bg-surface px-4 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
            >
              <ListChecks className="h-4 w-4" aria-hidden="true" />
              Revision hub
            </Link>
          </div>
        </header>

        {loading ? <CatalogSkeleton label="Loading subjects" /> : null}

        {error && !data ? (
          <CatalogError message={error} onRetry={() => void reload()} />
        ) : null}

        {data && data.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={Library}
              title="No subjects yet"
              description="The syllabus hasn't been loaded. Ask an admin to seed the curriculum."
            />
          </div>
        ) : null}

        {data && data.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 animate-rise [animation-delay:100ms] sm:grid-cols-2 lg:grid-cols-3">
            {data.map((subject) => (
              <SubjectCard key={subject.slug} subject={subject} />
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
