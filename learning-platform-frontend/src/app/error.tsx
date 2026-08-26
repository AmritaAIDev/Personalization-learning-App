"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";

export default function Error({
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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-tint">
          <CircleAlert className="h-6 w-6 text-danger" aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-heading text-xl font-semibold text-ink">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          This part of the app hit an unexpected error. You can try again, or
          head back to the dashboard.
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
            className="inline-flex items-center justify-center rounded-full border border-hairline px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-primary-tint"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
