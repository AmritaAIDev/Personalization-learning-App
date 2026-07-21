'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, SearchX } from 'lucide-react';
import AdaptiveStudySession from '@/components/learning/AdaptiveStudySession';
import {
  learningScopeFromSearchParams,
  learningTabFromSearchParams,
} from '@/lib/learning';

export default function LearnPage() {
  const searchParams = useSearchParams();
  const scope = learningScopeFromSearchParams(searchParams);
  if (!scope) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl items-center p-6 sm:p-10">
        <section className="w-full rounded-[2rem] border border-[#e8e1e3] bg-white p-8 text-center shadow-[0_18px_45px_rgba(49,51,55,0.07)] sm:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f9e5ea] text-[#e31540]">
            <SearchX className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#e31540]">
            Choose a topic first
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-[#313337]">
            Choose a topic
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#6b6e75]">
            Start from search to open a topic workspace.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#e31540] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#c61137]"
          >
            Find a topic
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    );
  }
  return (
    <AdaptiveStudySession
      scope={scope}
      initialTab={learningTabFromSearchParams(searchParams)}
    />
  );
}
