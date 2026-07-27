import type { ReactNode } from 'react';

export default function PageHero({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-heading text-[2.15rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[2.75rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft sm:text-[15px]">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
