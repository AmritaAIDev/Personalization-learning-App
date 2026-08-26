"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center px-5 py-12">
      <div className="w-full rounded-[1.5rem] border border-hairline bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-tint">
          <CircleAlert className="h-6 w-6 text-danger" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-heading text-xl font-semibold text-ink">This workspace hit a snag</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
          Something went wrong loading this section. It’s usually transient — try again. Your progress is safe.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-hairline px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
