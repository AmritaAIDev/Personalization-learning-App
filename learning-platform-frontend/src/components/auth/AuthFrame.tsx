import type { ReactNode } from "react";
import { Atom } from "lucide-react";

interface AuthFrameProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthFrame({
  title,
  subtitle,
  children,
}: AuthFrameProps) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4 py-6 sm:p-6 lg:p-10">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[1.5rem] bg-surface hairline elevate sm:rounded-[1.75rem] lg:grid-cols-[1.02fr_0.98fr] animate-rise">
        {/* Brand panel — calm, typographic, no glow or grid. */}
        <section className="relative hidden flex-col justify-between bg-ink-solid p-12 text-white lg:flex">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white">
              <Atom className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              JEE AI
            </span>
          </div>

          <div className="max-w-sm">
            <h1 className="font-heading text-[2.65rem] font-semibold leading-[1.08] tracking-tight">
              Study with clarity, not guesswork.
            </h1>
            <p className="mt-6 text-[15px] leading-7 text-white/60">
              Mastery built from reviewed questions, a secure baseline, and
              feedback that shows exactly what to practise next.
            </p>
          </div>

          <div className="space-y-4 text-sm text-white/70">
            <p className="border-t border-white/10 pt-4">
              Private account sessions
            </p>
            <p className="border-t border-white/10 pt-4">
              Server-verified results
            </p>
          </div>
        </section>

        {/* Form panel. */}
        <section className="min-w-0 flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white">
                <Atom className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-ink">
                JEE AI
              </span>
            </div>
            <h2 className="font-heading text-[2rem] font-semibold tracking-tight text-ink">
              {title}
            </h2>
            <p className="mt-2 text-[15px] leading-6 text-ink-soft">
              {subtitle}
            </p>
            <div className="mt-9">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
