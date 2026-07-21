import type { ReactNode } from 'react';
import { Atom, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AuthFrameProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthFrame({ title, subtitle, children }: AuthFrameProps) {
  return (
    <main className="min-h-screen bg-[#fafafa] p-4 sm:p-6 lg:p-10">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-[#e8e1e3] bg-white shadow-[0_28px_84px_rgba(49,51,55,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#313337] p-10 text-white lg:flex lg:flex-col">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(227,21,64,0.52),transparent_31%),radial-gradient(circle_at_86%_86%,rgba(255,255,255,0.12),transparent_42%)]" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:46px_46px]" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#e31540] shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
              <Atom className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="leading-tight">
              <span className="block font-heading text-xl font-bold tracking-tight">JEE AI</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.17em] text-[#f7b9c8]">Competency engine</span>
            </span>
          </div>

          <div className="relative my-auto max-w-md">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-[#f7b9c8]">Evidence-led learning</p>
            <h1 className="font-heading text-5xl font-bold leading-[1.04] tracking-tight">
              Study with clarity, not guesswork.
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-[#d6d7da]">
              Build JEE mastery from reviewed questions, a secure baseline, and feedback that explains what to practise next.
            </p>
          </div>

          <div className="relative space-y-3 text-sm text-[#e7e8ea]">
            <p className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#f7b9c8]" aria-hidden="true" /> Private account sessions</p>
            <p className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-[#f7b9c8]" aria-hidden="true" /> Server-verified results</p>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-7 flex items-center gap-3 text-[#313337]">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e31540] text-white">
                  <Atom className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="font-heading text-xl font-bold tracking-tight">JEE AI</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-[#e31540]">Student workspace</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#313337]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#6b6e75]">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
