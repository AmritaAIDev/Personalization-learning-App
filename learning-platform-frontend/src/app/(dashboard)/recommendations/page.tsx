"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import type { DashboardPayload } from "@/lib/diagnostic-types";
import { LoaderCircle } from "lucide-react";

/**
 * Fallback recommendations page: redirects to the latest diagnostic
 * attempt recommendations, or shows a helpful empty state.
 */
export default function RecommendationsIndexPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = async () => {
      try {
        const dashboard = await apiFetch<DashboardPayload>(
          "/api/diagnostics/dashboard",
        );
        const latest = dashboard.recentAttempts[0];
        if (latest) {
          router.replace("/recommendations/" + latest.id);
        } else {
          setError("no-attempts");
        }
      } catch (reason) {
        setError(
          reason instanceof ApiError
            ? reason.message
            : "Unable to load your recommendations.",
        );
      }
    };
    void redirect();
  }, [router]);

  if (error === "no-attempts") {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-12 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Recommendations</p>
        <h1 className="mt-3 font-heading text-2xl font-bold text-ink">No recommendations yet</h1>
        <p className="mt-3 text-sm leading-6 text-ink-mute">Take a diagnostic test to get personalised study recommendations and a recovery plan tailored to your weak topics.</p>
        <a href="/tests" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90">Go to tests</a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-12 text-center">
        <p className="text-sm font-medium text-ink-soft">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl items-center justify-center px-5 pt-12">
      <div className="flex items-center gap-3 text-sm font-semibold text-ink-soft">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        Loading your recommendations…
      </div>
    </div>
  );
}