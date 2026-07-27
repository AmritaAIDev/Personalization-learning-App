import Link from 'next/link';
import { ArrowRight, NotebookTabs, RotateCcw } from 'lucide-react';
import PageHero from '@/components/product/PageHero';
import FeatureCard from '@/components/product/FeatureCard';

export default function NotebookPage() {
  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8 sm:pt-16 lg:px-10">
        <PageHero
          eyebrow="Mistake notebook"
          title="Every wrong answer becomes a revision asset."
          description="The notebook is the student's repair layer: mistakes, misconceptions, due reviews, and similar-practice actions stay connected to the adaptive route."
          action={
            <Link
              href="/practice"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Practice weak topics
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />

        <div className="mt-9 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.65rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-mute">
                  Auto saved
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-ink">
                  Mistakes to repair before the next test
                </h2>
              </div>
              <NotebookTabs className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-hairline bg-canvas p-6">
              <h3 className="text-sm font-semibold text-ink">No saved mistake cards yet</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">
                This area should populate from real practice attempts only. Once the backend
                notebook endpoint is added, wrong answers, misconceptions, due reviews, and
                repair actions will appear here automatically.
              </p>
              <Link
                href="/practice"
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-hairline px-4 py-2 text-sm font-semibold text-ink transition hover:border-primary/30 hover:text-primary"
              >
                Start practice
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>

          <FeatureCard
            eyebrow="Repair card"
            title="Database-backed feedback only"
            description="When notebook data is connected, each repair card will explain the misconception, the correct idea, and the next action using the student's real attempt history."
            icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
            tone="dark"
          >
            <div className="rounded-2xl bg-white/8 p-4 text-sm leading-6 text-white/75">
              Repair cards are intentionally empty until backed by database evidence. No frontend
              mock mistakes are shown to students.
            </div>
          </FeatureCard>
        </div>
      </main>
    </div>
  );
}
