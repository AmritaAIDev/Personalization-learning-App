"use client";

import type { ReactNode } from "react";
import { Check, LoaderCircle } from "lucide-react";

/**
 * A big, accessible checkbox row for study-plan tasks. It is a single button
 * (`role="checkbox"`), so the whole row is one 44px+ touch target and one
 * keyboard stop. While a save is in flight it is `aria-busy` and ignores taps,
 * so a double-tap cannot send two requests.
 */
export default function TaskCheckbox({
  checked,
  onChange,
  label,
  children,
  pending = false,
  disabled = false,
}: {
  checked: boolean;
  /** Called with the value the student is asking for. */
  onChange: (next: boolean) => void;
  /** Accessible name, e.g. "Physics: Kinematics". */
  label: string;
  /** Extra visible content (time estimate, subtitle ...). */
  children?: ReactNode;
  pending?: boolean;
  disabled?: boolean;
}) {
  const blocked = disabled || pending;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      aria-busy={pending || undefined}
      disabled={blocked}
      onClick={() => onChange(!checked)}
      className="group flex min-h-11 w-full items-center gap-3 rounded-xl text-left transition disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transition-none"
    >
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition motion-reduce:transition-none ${
          checked
            ? "border-primary bg-primary text-white"
            : "border-hairline bg-surface text-transparent group-hover:border-primary/50"
        }`}
        aria-hidden="true"
      >
        {pending ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin text-ink-mute" />
        ) : (
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        )}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}
