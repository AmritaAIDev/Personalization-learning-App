import type { ReactNode } from "react";

export default function FeatureCard({
  eyebrow,
  title,
  description,
  icon,
  children,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <section
      className={`rounded-[1.65rem] p-6 shadow-[0_14px_34px_rgba(20,20,30,0.05)] ${
        dark
          ? "bg-ink text-white"
          : "border border-hairline bg-surface text-ink"
      }`}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
              dark ? "bg-white/10 text-white" : "bg-primary-tint text-primary"
            }`}
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
              dark ? "text-white/60" : "text-ink-mute"
            }`}
          >
            {eyebrow}
          </p>
          <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight">
            {title}
          </h2>
          <p
            className={`mt-2 text-sm leading-6 ${
              dark ? "text-white/72" : "text-ink-soft"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
