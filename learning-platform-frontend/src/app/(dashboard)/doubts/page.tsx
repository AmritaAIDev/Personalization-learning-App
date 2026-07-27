import Link from 'next/link';
import { ArrowRight, HelpCircle, MessageSquareText, Paperclip } from 'lucide-react';
import PageHero from '@/components/product/PageHero';
import FeatureCard from '@/components/product/FeatureCard';

export default function DoubtsPage() {
  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8 sm:pt-16 lg:px-10">
        <PageHero
          eyebrow="Doubt hub"
          title="Ask from a concept, question, or saved mistake."
          description="Doubts should not be a separate chat island. The product plan keeps every doubt attached to topic, level, current question, and learner state."
          action={
            <Link
              href="/learn"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Open Learn
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />

        <div className="mt-9 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[1.65rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-mute">
              Ask a doubt
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-ink">
              Tutor support stays attached to learning context
            </h2>
            <div className="mt-5 min-h-44 rounded-2xl border border-dashed border-hairline bg-canvas p-4 text-sm leading-6 text-ink-mute">
              The composer is ready for the connected flow: type a doubt, attach a solution step,
              or reference the current practice question. Submitted doubts should be stored through
              a backend endpoint before appearing in history.
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                Ask tutor
              </button>
              <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-hairline px-5 py-2.5 text-sm font-semibold text-ink-soft">
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                Attach current question
              </button>
            </div>
          </section>

          <FeatureCard
            eyebrow="Recent doubts"
            title="No doubt history yet"
            description="Recent doubts will appear only after they are saved by the backend with topic, question, and level context."
            icon={<HelpCircle className="h-5 w-5" aria-hidden="true" />}
            tone="dark"
          >
            <div className="rounded-2xl bg-white/8 p-4 text-sm leading-6 text-white/75">
              This keeps the UI clean for new users and avoids showing frontend-only mock history.
            </div>
          </FeatureCard>
        </div>
      </main>
    </div>
  );
}
