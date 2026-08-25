"use client";

import { RotateCcw, WifiOff } from "lucide-react";

/**
 * Consistent presentation for "an AI feature could not run right now."
 *
 * The AI provider being unreachable is common enough here that it reads as
 * an expected, handled state rather than a crash — so this is deliberately
 * calm (warning tint, not danger red) and structured like a real UI block
 * (icon + heading + explanation), never a bare line of caught-exception text.
 * Use this instead of printing an `ApiError.message` directly.
 */
export function AiUnavailableBlock({
  title = "AI is taking a moment",
  description,
  onRetry,
  retryLabel = "Try again",
  className = "",
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`mx-auto my-auto flex w-full max-w-md flex-col items-center gap-3 rounded-[1.5rem] border border-hairline bg-surface p-6 text-center shadow-[0_16px_40px_rgba(20,20,30,0.06)] ${className}`}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-warning-tint text-warning">
        <WifiOff className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <p className="font-heading text-base font-bold text-ink">{title}</p>
        <p className="mt-1.5 text-sm leading-6 text-ink-soft">
          {description}
        </p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-hairline px-3 text-xs font-bold text-ink-soft transition hover:border-primary/30 hover:text-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Compact inline sibling of {@link AiUnavailableBlock} for a notice under a
 * button or inside a panel that shouldn't collapse into a full empty state.
 */
export function AiUnavailableNote({
  description,
  onRetry,
  retryLabel = "Try again",
  className = "",
}: {
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-xl border border-warning/20 bg-warning-tint px-3.5 py-2.5 text-sm text-warning ${className}`}
    >
      <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="leading-5">{description}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold underline underline-offset-2 hover:opacity-80"
          >
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
