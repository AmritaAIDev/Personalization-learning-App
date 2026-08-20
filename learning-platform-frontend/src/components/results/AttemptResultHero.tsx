import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface AttemptResultHeroProps {
  icon?: LucideIcon;
  eyebrow: string;
  score: ReactNode;
  title?: ReactNode;
  statsLine?: ReactNode;
  caption?: ReactNode;
  progressPercent?: number;
  corner?: ReactNode;
  children?: ReactNode;
}

/**
 * Shared dark hero card for the three post-attempt result screens
 * (Diagnostic analysis, Mock Test results, Practice review). Each screen
 * supplies its own score visual/title since those genuinely differ
 * (score ring vs raw percent, grade word vs none) — this standardizes the
 * container chrome, spacing, and typography so the three feel consistent.
 */
export default function AttemptResultHero({
  icon: Icon,
  eyebrow,
  score,
  title,
  statsLine,
  caption,
  progressPercent,
  corner,
  children,
}: AttemptResultHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.8rem] bg-ink-solid p-7 text-white shadow-[0_22px_70px_rgba(20,20,30,0.16)] sm:p-9">
      <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative grid gap-7 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="flex items-center gap-4 lg:block">{score}</div>
        <div>
          <p className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/55">
            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
            {eyebrow}
          </p>
          {title ? (
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
          ) : null}
          {statsLine ? (
            <p className="mt-3 text-sm font-semibold text-white sm:mt-5">
              {statsLine}
            </p>
          ) : null}
          {caption ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-white/8 px-4 py-3 text-sm font-medium leading-6 text-white/85">
              {caption}
            </div>
          ) : null}
          {typeof progressPercent === "number" ? (
            <div className="mt-6 h-2 max-w-md overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white/80 transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          ) : null}
          {children}
        </div>
        {corner ? (
          <div className="self-start rounded-2xl bg-white/8 px-4 py-3 text-xs font-semibold text-white/70">
            {corner}
          </div>
        ) : null}
      </div>
    </section>
  );
}
