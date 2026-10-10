import { Target } from "lucide-react";
import type { RevisionTarget } from "@/lib/revision-types";

const PHASE_COPY: Record<RevisionTarget["phase"], { label: string; hint: string }> = {
  foundation: {
    label: "Building foundations",
    hint: "Plenty of time. Fix weak topics now and practice stays balanced.",
  },
  consolidation: {
    label: "Consolidating",
    hint: "Practice is leaning harder and your revision list is longer.",
  },
  sprint: {
    label: "Final sprint",
    hint: "Exam-like practice and the widest weak-topic list. Topics your plan schedules soon come first.",
  },
};

function formatMonth(month: string): string {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function TargetBanner({ target }: { target: RevisionTarget }) {
  const copy = PHASE_COPY[target.phase];
  return (
    <div
      role="note"
      className="mt-6 flex items-start gap-3 rounded-2xl border border-hairline bg-primary-tint p-4"
    >
      <Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">
          {copy.label} · {target.daysLeft} {target.daysLeft === 1 ? "day" : "days"} to{" "}
          {formatMonth(target.targetMonth)}
        </p>
        <p className="mt-0.5 text-xs text-ink-mute">{copy.hint}</p>
      </div>
    </div>
  );
}
