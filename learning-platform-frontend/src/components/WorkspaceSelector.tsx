"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Layers3 } from "lucide-react";
import TopicPickerDialog from "@/components/search/TopicPickerDialog";
import { apiFetch } from "@/lib/api";
import type {
  LearningDashboardPayload,
} from "@/lib/learning-types";

/**
 * Sidebar card that shows the learner's active topic and opens the topic
 * picker. Destination links intentionally live in the sidebar's Study
 * section — duplicating them here caused drifting labels and hrefs.
 */
export default function WorkspaceSelector({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [dashboard, setDashboard] = useState<LearningDashboardPayload | null>(
    null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(
        await apiFetch<LearningDashboardPayload>("/api/learning/dashboard"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const scope =
    dashboard?.activeTopics[0] ?? dashboard?.completedTopics[0] ?? null;

  return (
    <section className="relative hidden lg:block">
      <div
        className={`rounded-[1.35rem] border transition ${compact ? "border-transparent bg-transparent p-0" : "p-1.5"} ${
          pickerOpen
            ? "border-primary/25 bg-surface shadow-[0_12px_30px_rgba(28,78,56,0.07)]"
            : "border-hairline bg-canvas/50"
        }`}
      >
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className={`flex w-full items-center gap-2.5 rounded-[0.95rem] bg-surface text-left ring-1 ring-hairline transition hover:bg-primary-tint/45 hover:ring-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${compact ? "mx-auto h-10 w-10 justify-center p-0" : "p-2.5"}`}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-solid text-white shadow-sm">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className={compact ? "sr-only" : "min-w-0 flex-1"}>
            {loading ? (
              <span className="block h-7 w-28 rounded-full skeleton" />
            ) : scope ? (
              <>
                <span className="block truncate text-[11px] font-medium text-ink-mute">
                  {scope.subject} / {scope.chapter}
                </span>
                <span className="block truncate text-[13px] font-bold text-ink">
                  {scope.topic}
                </span>
              </>
            ) : (
              <>
                <span className="block text-[11px] font-medium text-ink-mute">
                  Current workspace
                </span>
                <span className="block text-[13px] font-semibold text-ink">
                  Choose a workspace
                </span>
              </>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink-mute ${compact ? "sr-only" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>
      <TopicPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </section>
  );
}
