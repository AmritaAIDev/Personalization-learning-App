"use client";

import Breadcrumb from "@/components/catalog/Breadcrumb";
import GrowthPanel from "@/components/dashboard/GrowthPanel";
import SyllabusProgressPanel from "@/components/dashboard/SyllabusProgressPanel";
import FocusAreasPanel from "@/components/progress/FocusAreasPanel";
import PlanProgressPanel from "@/components/progress/PlanProgressPanel";
import { useSyllabusProgress } from "@/lib/useCatalog";

export default function ProgressPage() {
  const syllabus = useSyllabusProgress();

  return (
    <div className="min-h-screen bg-canvas pb-20 premium-mesh">
      <main className="mx-auto w-full max-w-6xl px-5 pt-9 sm:px-8 lg:px-10">
        <Breadcrumb
          items={[{ label: "Dashboard", href: "/" }, { label: "Progress" }]}
        />
        <header className="animate-rise mt-4">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
            Progress
          </p>
          <h1 className="mt-2 font-heading page-title text-ink">How you are doing</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
            Your syllabus completion, your study plan and what your practice says
            about each subject, in one place.
          </p>
        </header>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <SyllabusProgressPanel
            progress={syllabus.data}
            loading={syllabus.loading}
            error={syllabus.error}
            onRetry={() => void syllabus.reload()}
            detailHref="/subjects"
            detailLabel="Browse subjects"
          />
          <PlanProgressPanel />
        </div>

        <div className="mt-5">
          <FocusAreasPanel />
        </div>

        <GrowthPanel />
      </main>
    </div>
  );
}
