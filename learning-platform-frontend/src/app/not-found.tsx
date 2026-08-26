import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5 premium-mesh">
      <div className="w-full max-w-md rounded-[1.5rem] border border-hairline bg-surface p-8 text-center shadow-premium animate-rise premium-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-tint text-primary">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-heading text-xl font-semibold tracking-tight text-ink">
          Page not found
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-soft">
          The page you&apos;re looking for doesn&apos;t exist or may have
          moved. Check the address or return to your dashboard.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(63,111,87,0.25)] transition hover:bg-primary-strong hover:shadow-[0_12px_28px_rgba(63,111,87,0.3)] hover:-translate-y-[0.5px] active:translate-y-0"
          >
            Back to dashboard
          </Link>
          <Link
            href="/journey"
            className="inline-flex items-center justify-center rounded-full border border-hairline bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas"
          >
            Explore journey
          </Link>
        </div>
      </div>
    </div>
  );
}
