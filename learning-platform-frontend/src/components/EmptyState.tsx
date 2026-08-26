"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-hairline bg-canvas/50 px-6 py-12 text-center premium-card sm:px-8 sm:py-14">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-tint text-primary">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mt-5 font-heading text-lg font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-soft">{description}</p>
      {(actionLabel || secondaryLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(63,111,87,0.25)] transition hover:bg-primary-strong hover:shadow-[0_12px_28px_rgba(63,111,87,0.3)] hover:-translate-y-[0.5px] active:translate-y-0"
            >
              {actionLabel}
            </Link>
          ) : onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(63,111,87,0.25)] transition hover:bg-primary-strong hover:shadow-[0_12px_28px_rgba(63,111,87,0.3)] hover:-translate-y-[0.5px] active:translate-y-0"
            >
              {actionLabel}
            </button>
          ) : null)}
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-full border border-hairline bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
