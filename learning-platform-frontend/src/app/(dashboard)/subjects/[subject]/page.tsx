"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BookOpen, Map as MapIcon } from "lucide-react";
import Breadcrumb from "@/components/catalog/Breadcrumb";
import { CatalogError, CatalogSkeleton } from "@/components/catalog/CatalogState";
import ChapterCard from "@/components/catalog/ChapterCard";
import SubjectBanner from "@/components/catalog/SubjectBanner";
import UnitFilterTabs from "@/components/catalog/UnitFilterTabs";
import EmptyState from "@/components/EmptyState";
import {
  ALL_UNITS,
  filterChaptersByUnit,
  resolveUnit,
  subjectStats,
} from "@/lib/catalog";
import { useSubjectChapters } from "@/lib/useCatalog";

export default function SubjectPage() {
  const params = useParams<{ subject: string }>();
  const subjectSlug = params.subject ?? "";
  // Keyed so navigating between subjects never shows the previous one's data.
  return <SubjectContent key={subjectSlug} subjectSlug={subjectSlug} />;
}

function SubjectContent({ subjectSlug }: { subjectSlug: string }) {
  const { data, loading, error, reload } = useSubjectChapters(subjectSlug);
  const [unit, setUnit] = useState(ALL_UNITS);

  const activeUnit = data ? resolveUnit(data, unit) : ALL_UNITS;
  const stats = useMemo(
    () => (data ? subjectStats(data.chapters) : null),
    [data],
  );
  const visible = useMemo(
    () => (data ? filterChaptersByUnit(data.chapters, activeUnit) : []),
    [data, activeUnit],
  );
  const notFound = Boolean(error && /not found/i.test(error));

  return (
    <div className="min-h-screen bg-canvas pb-20 premium-mesh">
      <main className="mx-auto w-full max-w-6xl px-5 pt-9 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumb
            items={[
              { label: "Subjects", href: "/subjects" },
              { label: data?.subject.name ?? "Subject" },
            ]}
          />
          <Link
            href="/journey"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-hairline bg-surface px-4 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary"
          >
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            Guided journey
          </Link>
        </div>

        {loading ? <CatalogSkeleton label="Loading chapters" /> : null}

        {error && !data ? (
          <CatalogError
            message={
              notFound ? "That subject doesn't exist." : error
            }
            notFound={notFound}
            onRetry={() => void reload()}
            backHref="/subjects"
            backLabel="All subjects"
          />
        ) : null}

        {data && stats ? (
          <div className="mt-6 space-y-6 animate-rise">
            <SubjectBanner name={data.subject.name} stats={stats} />

            {data.units.length > 1 ? (
              <UnitFilterTabs
                units={data.units}
                total={data.chapters.length}
                selected={activeUnit}
                onSelect={setUnit}
              />
            ) : null}

            {visible.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No chapters here yet"
                description="Chapters for this subject haven't been added."
              />
            ) : (
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                role="tabpanel"
                aria-label={
                  activeUnit === ALL_UNITS ? "All chapters" : `${activeUnit} chapters`
                }
              >
                {visible.map((chapter) => (
                  <ChapterCard
                    key={chapter.slug}
                    chapter={chapter}
                    index={data.chapters.indexOf(chapter)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
