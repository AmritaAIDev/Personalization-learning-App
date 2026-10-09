"use client";

import { pluralize, type SubjectStats } from "@/lib/catalog";
import { getSubjectTheme } from "@/lib/subject-theme";

/** Gradient header for a subject page: name plus four headline numbers. */
export default function SubjectBanner({
  name,
  stats,
}: {
  name: string;
  stats: SubjectStats;
}) {
  const theme = getSubjectTheme(name);
  const Icon = theme.icon;
  const items = [
    { label: "Chapters", value: String(stats.chapters) },
    { label: "Started", value: String(stats.started) },
    { label: "Mastered", value: String(stats.mastered) },
    {
      label: "Avg score",
      value: stats.averageScore === null ? "—" : `${stats.averageScore}%`,
    },
  ];

  return (
    <section
      className="overflow-hidden rounded-[1.75rem] p-5 text-white shadow-[0_18px_44px_rgba(20,20,30,0.12)] sm:p-7"
      style={{ background: theme.gradient }}
      aria-labelledby="subject-banner-heading"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1
              id="subject-banner-heading"
              className="truncate font-heading text-3xl font-bold tracking-tight"
            >
              {name}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {stats.started === 0
                ? `${pluralize(stats.chapters, "chapter")} ready when you are.`
                : `${stats.started} of ${pluralize(stats.chapters, "chapter")} started.`}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[26rem]">
          {items.map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-xl bg-white/12 px-3 py-2.5 text-center backdrop-blur-sm"
            >
              <dt className="truncate text-[11px] font-medium text-white/75">
                {item.label}
              </dt>
              <dd className="mt-0.5 font-heading text-xl font-bold">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-semibold text-white/85">
          <span>Overall progress</span>
          <span>{stats.startedPercent}% of chapters started</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"
          role="progressbar"
          aria-label={`${name} chapters started`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stats.startedPercent}
        >
          <span
            className="block h-full rounded-full bg-white transition-[width] duration-700 motion-reduce:transition-none"
            style={{ width: `${stats.startedPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
