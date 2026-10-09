"use client";

import { useParams } from "next/navigation";
import Breadcrumb from "@/components/catalog/Breadcrumb";
import { CatalogError, CatalogSkeleton } from "@/components/catalog/CatalogState";
import ChapterActions from "@/components/catalog/ChapterActions";
import ChapterHero from "@/components/catalog/ChapterHero";
import ChapterStatTiles from "@/components/catalog/ChapterStatTiles";
import ChapterTabs from "@/components/catalog/ChapterTabs";
import { subjectHref } from "@/lib/catalog";
import { useChapterDetail } from "@/lib/useCatalog";

export default function ChapterPage() {
  const params = useParams<{ subject: string; chapter: string }>();
  const subjectSlug = params.subject ?? "";
  const chapterSlug = params.chapter ?? "";
  // Keyed so navigating between chapters never shows the previous one's data.
  return (
    <ChapterContent
      key={`${subjectSlug}/${chapterSlug}`}
      subjectSlug={subjectSlug}
      chapterSlug={chapterSlug}
    />
  );
}

function ChapterContent({
  subjectSlug,
  chapterSlug,
}: {
  subjectSlug: string;
  chapterSlug: string;
}) {
  const { data, loading, error, reload } = useChapterDetail(
    subjectSlug,
    chapterSlug,
  );
  const notFound = Boolean(error && /not found/i.test(error));

  return (
    <div className="min-h-screen bg-canvas pb-20 premium-mesh">
      <main className="mx-auto w-full max-w-6xl px-5 pt-9 sm:px-8 lg:px-10">
        <Breadcrumb
          items={[
            { label: "Subjects", href: "/subjects" },
            {
              label: data?.chapter.subject ?? "Subject",
              href: subjectHref(subjectSlug),
            },
            { label: data?.chapter.name ?? "Chapter" },
          ]}
        />

        {loading ? <CatalogSkeleton label="Loading chapter" /> : null}

        {error && !data ? (
          <CatalogError
            message={notFound ? "That chapter doesn't exist." : error}
            notFound={notFound}
            onRetry={() => void reload()}
            backHref={subjectHref(subjectSlug)}
            backLabel="Back to chapters"
          />
        ) : null}

        {data ? (
          <div className="mt-6 space-y-6 animate-rise">
            <ChapterHero detail={data} />
            <ChapterStatTiles detail={data} />
            <section aria-label="Start studying">
              <ChapterActions detail={data} />
            </section>
            <ChapterTabs detail={data} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
