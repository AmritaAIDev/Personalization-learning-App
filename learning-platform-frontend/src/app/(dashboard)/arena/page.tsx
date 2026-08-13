"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, SearchX } from "lucide-react";
import PracticeSession from "@/components/practice/PracticeSession";
import { practiceScopeFromSearchParams } from "@/lib/practice";

export default function ArenaPage() {
  const searchParams = useSearchParams();
  const scope = practiceScopeFromSearchParams(searchParams);

  if (!scope) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl items-center p-6 sm:p-10">
        <section className="w-full rounded-[2rem] border border-hairline bg-surface p-8 text-center shadow-[0_18px_45px_rgba(20,20,30,0.07)] sm:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-tint text-primary">
            <SearchX className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-7 text-xs font-medium text-ink-mute">
            Practice needs a topic
          </p>
          <h1 className="mt-3 font-heading page-title text-ink">
            Choose a verified learning unit first.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-ink-soft">
            Search the question bank from your dashboard. Only units with five
            reviewed Easy, Medium, and Hard questions can start a balanced
            session.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-strong"
          >
            Find a topic <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    );
  }

  return <PracticeSession scope={scope} />;
}
