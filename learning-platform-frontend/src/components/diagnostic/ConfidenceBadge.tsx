import { Gauge, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ConfidenceCalibration } from "@/lib/diagnostic-types";

const CONFIG: Record<
  ConfidenceCalibration,
  { label: string; className: string; Icon: typeof Gauge }
> = {
  overconfident: {
    label: "Overconfident",
    className: "bg-danger-tint text-danger",
    Icon: ThumbsDown,
  },
  underconfident: {
    label: "Underconfident",
    className: "bg-warning-tint text-warning",
    Icon: ThumbsUp,
  },
  calibrated: {
    label: "Well calibrated",
    className: "bg-success-tint text-success",
    Icon: Gauge,
  },
};

/**
 * Compares a learner's pre-answer confidence against the outcome. Renders
 * nothing when no confidence was captured, so it never adds noise to answers
 * the learner did not rate.
 */
export default function ConfidenceBadge({
  calibration,
}: {
  calibration: ConfidenceCalibration | null;
}) {
  if (!calibration) return null;
  const { label, className, Icon } = CONFIG[calibration];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
