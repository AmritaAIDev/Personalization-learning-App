import Link from 'next/link';
import { ArrowRight, BarChart3, ClipboardList, TimerReset } from 'lucide-react';
import PageHero from '@/components/product/PageHero';
import FeatureCard from '@/components/product/FeatureCard';

export default function TestsPage() {
  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8 sm:pt-16 lg:px-10">
        <PageHero
          eyebrow="Tests"
          title="Mock tests should end with a repair plan."
          description="This surface groups baseline diagnostics, reviewed practice tests, and future full-length mocks. The design intent is not just score display: every submission points back to Learn, Notebook, and Practice."
          action={
            <Link
              href="/diagnostic"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Open baseline
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />

        <div className="mt-9 grid gap-4 lg:grid-cols-3">
          <FeatureCard
            eyebrow="Baseline"
            title="15-question readiness"
            description="Shown immediately for new accounts, then moved out of the way once evidence exists."
            icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
          />
          <FeatureCard
            eyebrow="Reviewed practice"
            title="5 easy · 5 medium · 5 hard"
            description="Balanced assessment flow with autosave, secure submission, and backend scoring."
            icon={<TimerReset className="h-5 w-5" aria-hidden="true" />}
          />
          <FeatureCard
            eyebrow="Analysis"
            title="Score into next route"
            description="Bloom report, difficulty performance, misconceptions, and the next adaptive learning path."
            icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
            tone="dark"
          />
        </div>
      </main>
    </div>
  );
}
