"use client";

import Link from "next/link";
import { CircleAlert, SearchX } from "lucide-react";

/** Shared page-level loading skeleton for the Subjects screens. */
export function CatalogSkeleton({ label }: { label: string }) {
  return (
    <div className="mt-8 space-y-6" role="status" aria-label={label}>
      <div className="h-40 rounded-[1.75rem] skeleton" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-56 rounded-2xl skeleton" />
        ))}
      </div>
    </div>
  );
}

/** Error with a retry; `notFound` swaps in a "doesn't exist" message and a way out. */
export function CatalogError({
  message,
  onRetry,
  notFound,
  backHref,
  backLabel,
}: {
  message: string;
  onRetry: () => void;
  notFound?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  const Icon = notFound ? SearchX : CircleAlert;
  return (
    <div
      className="mt-8 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-tint p-4 text-sm text-danger premium-card"
      role="alert"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold">
          {notFound ? "We couldn't find that" : "Something needs attention"}
        </p>
        <p className="mt-1 leading-6">{message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {notFound ? null : (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-9 items-center rounded-full bg-danger px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-danger/90"
            >
              Try again
            </button>
          )}
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex min-h-9 items-center rounded-full border border-danger/30 px-4 py-1.5 text-xs font-semibold transition hover:bg-danger/10"
            >
              {backLabel ?? "Go back"}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
