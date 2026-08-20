import type { ReactNode } from "react";

interface AttemptResultStat {
  label: string;
  value: ReactNode;
  tone?: "positive" | "negative" | "neutral";
}

const toneClasses: Record<NonNullable<AttemptResultStat["tone"]>, string> = {
  positive: "border-success/25 bg-success-tint text-success",
  negative: "border-danger/25 bg-danger-tint text-danger",
  neutral: "border-hairline bg-surface text-primary",
};

/** Shared score-summary stat row used across the post-attempt result screens. */
export default function AttemptResultStatRow({
  stats,
}: {
  stats: AttemptResultStat[];
}) {
  return (
    <section
      className="mt-5 grid gap-4 sm:grid-cols-3"
      aria-label="Score summary"
    >
      {stats.map((stat) => {
        const tone = stat.tone ?? "neutral";
        return (
          <div
            key={stat.label}
            className={`rounded-2xl border p-5 ${toneClasses[tone]}`}
          >
            <p className="text-sm font-semibold opacity-90">{stat.label}</p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {stat.value}
            </p>
          </div>
        );
      })}
    </section>
  );
}
