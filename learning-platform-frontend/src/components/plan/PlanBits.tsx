"use client";

import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

/** A labelled percentage bar used across the plan screens. */
export function PercentBar({
  label,
  percent,
  barClass = "bg-primary",
  height = "h-2",
}: {
  label: string;
  percent: number;
  barClass?: string;
  height?: string;
}) {
  return (
    <div
      className={`${height} overflow-hidden rounded-full bg-canvas`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <span
        className={`block h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${barClass}`}
        style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
      />
    </div>
  );
}

/** A small headline number with a caption. */
export function StatTile({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-canvas px-3 py-3">
      <dt className="truncate text-[11px] font-medium text-ink-mute">{label}</dt>
      <dd className="mt-0.5 truncate font-heading text-xl font-bold text-ink">
        {value}
      </dd>
    </div>
  );
}

export function PanelLoading({ label }: { label: string }) {
  return (
    <div className="space-y-3" role="status" aria-label={label}>
      <div className="h-6 w-1/3 rounded skeleton" />
      <div className="h-20 rounded-xl skeleton" />
      <div className="h-20 rounded-xl skeleton" />
    </div>
  );
}

export function PanelError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger-tint px-4 py-3 text-sm text-danger"
      role="alert"
    >
      <span className="flex items-center gap-2">
        <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
        {message}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-9 items-center rounded-full bg-danger px-4 text-xs font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}

/** Previous / label / next controls for walking through weeks or months. */
export function Stepper({
  label,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  subject,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  /** What is being stepped, for the button names ("week", "month"). */
  subject: string;
}) {
  const button =
    "inline-flex min-h-10 items-center rounded-full border border-hairline px-4 text-sm font-semibold text-ink-soft transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button type="button" onClick={onPrev} disabled={prevDisabled} className={button}>
        Previous {subject}
      </button>
      <p
        className="min-w-0 truncate text-center font-heading text-base font-bold text-ink"
        aria-live="polite"
      >
        {label}
      </p>
      <button type="button" onClick={onNext} disabled={nextDisabled} className={button}>
        Next {subject}
      </button>
    </div>
  );
}
