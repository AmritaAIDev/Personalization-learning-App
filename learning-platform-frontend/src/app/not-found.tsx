import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-5">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint">
          <Compass className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-heading text-xl font-semibold text-ink">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          The page you&apos;re looking for doesn&apos;t exist or may have
          moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
