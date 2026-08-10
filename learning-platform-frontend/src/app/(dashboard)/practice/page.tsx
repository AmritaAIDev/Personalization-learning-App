"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Search, ShieldCheck, Timer } from "lucide-react";
import PracticeSession from "@/components/practice/PracticeSession";
import TopicSearch from "@/components/search/TopicSearch";
import { practiceScopeFromSearchParams } from "@/lib/practice";

export default function PracticePage() {
  const searchParams = useSearchParams();
  const scope = practiceScopeFromSearchParams(searchParams);

  if (scope) return <PracticeSession scope={scope} />;

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-10 sm:px-8 sm:pt-16 lg:px-10">
        <section className="rounded-[2rem] border border-hairline bg-surface p-5 shadow-[0_22px_70px_rgba(20,20,30,0.07)] sm:p-7 lg:p-8">
          <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                Practice
              </p>
              <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Start a practice set.
              </h1>
            </div>

            <div className="rounded-[1.5rem] border border-hairline bg-canvas p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Find a topic
                  </p>
                </div>
                <Search className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <TopicSearch destination="practice" />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[1.5rem] border border-hairline bg-ink p-6 text-white shadow-[0_18px_45px_rgba(20,20,30,0.12)]">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
                  Secure practice behavior
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold">
                  No answer keys before submission.
                </h2>
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-hairline bg-surface p-6 shadow-[0_14px_34px_rgba(20,20,30,0.045)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-mute">
              Need tutor support?
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-ink">
              Use Learn for adaptive tutoring.
            </h2>
            <Link
              href="/learn"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
            >
              Open Learn
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        </section>
      </main>
    </div>
  );
}
