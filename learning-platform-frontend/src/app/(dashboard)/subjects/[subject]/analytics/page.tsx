"use client";

import { useParams } from "next/navigation";
import Breadcrumb from "@/components/catalog/Breadcrumb";
import { CatalogError, CatalogSkeleton } from "@/components/catalog/CatalogState";
import SubjectAnalyticsView from "@/components/catalog/SubjectAnalyticsView";
import { subjectHref } from "@/lib/catalog";
import { useSubjectAnalytics } from "@/lib/useCatalog";

export default function SubjectAnalyticsPage() {
  const params = useParams<{ subject: string }>();
  const subjectSlug = params.subject ?? "";
  // Keyed so navigating between subjects never shows the previous one's data.
  return <AnalyticsContent key={subjectSlug} subjectSlug={subjectSlug} />;
}

function AnalyticsContent({ subjectSlug }: { subjectSlug: string }) {
  const { data, loading, error, reload } = useSubjectAnalytics(subjectSlug);
  const notFound = Boolean(error && /not found/i.test(error));

  return (
    <div className="min-h-screen bg-canvas pb-20 premium-mesh">
      <main className="mx-auto w-full max-w-6xl px-5 pt-9 sm:px-8 lg:px-10">
        <Breadcrumb
          items={[
            { label: "Subjects", href: "/subjects" },
            {
              label: data?.subject.name ?? "Subject",
              href: subjectHref(subjectSlug),
            },
            { label: "Analytics" },
          ]}
        />

        {loading ? <CatalogSkeleton label="Loading analytics" /> : null}

        {error && !data ? (
          <CatalogError
            message={notFound ? "That subject doesn't exist." : error}
            notFound={notFound}
            onRetry={() => void reload()}
            backHref="/subjects"
            backLabel="All subjects"
          />
        ) : null}

        {data ? (
          <div className="mt-6 animate-rise">
            <SubjectAnalyticsView data={data} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
