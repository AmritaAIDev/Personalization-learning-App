'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  SearchX,
  Timer,
} from 'lucide-react';
import PageHero from '@/components/product/PageHero';
import FeatureCard from '@/components/product/FeatureCard';
import PracticeSession from '@/components/practice/PracticeSession';
import TopicSearch from '@/components/search/TopicSearch';
import { practiceScopeFromSearchParams } from '@/lib/practice';

export default function PracticePage() {
  const searchParams = useSearchParams();
  const scope = practiceScopeFromSearchParams(searchParams);

  if (scope) return <PracticeSession scope={scope} />;

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8 sm:pt-16 lg:px-10">
        <PageHero
          eyebrow="Practice library"
          title="Choose the intent before the question set."
          description="The same reviewed database can support tutor-mode learning, exam-like timed sets, and weak-topic review. Search opens a verified unit; the backend decides what is ready."
        />

        <section className="mt-8 rounded-[1.65rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)]">
          <TopicSearch destination="practice" />
        </section>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <FeatureCard
            eyebrow="Tutor mode"
            title="Learn with explanations"
            description="Best when the student is still forming the concept. Wrong answers stay attached to the AI tutor and mistake notebook."
            icon={<Brain className="h-5 w-5" aria-hidden="true" />}
          />
          <FeatureCard
            eyebrow="Timed mode"
            title="Exam-like practice"
            description="Balanced reviewed sets with autosave, submit-only analysis, and no exposed answer key before completion."
            icon={<Timer className="h-5 w-5" aria-hidden="true" />}
          />
          <FeatureCard
            eyebrow="Review mode"
            title="Due and weak topics"
            description="Short sessions for questions, concepts, and mistakes that are due for reinforcement."
            icon={<BookOpenCheck className="h-5 w-5" aria-hidden="true" />}
          />
        </div>

        <section className="mt-8 rounded-[1.65rem] border border-dashed border-hairline bg-surface p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-tint text-primary">
            <SearchX className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-heading text-2xl font-semibold text-ink">
            Practice starts from a topic.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink-soft">
            Search Gauss Law or another verified unit. If you want adaptive tutor
            practice, open the topic in Learn and choose Practice Studio.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Back to dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}
