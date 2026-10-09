import { Star } from "lucide-react";
import type { MasteryLevel } from "@/lib/catalog-types";

/**
 * JEE Compass mastery level (Beginner..Master) as a label plus 1-5 stars.
 * Renders nothing meaningful for a null level (nothing answered yet), so a
 * brand-new student never sees a discouraging "Beginner".
 */
export default function MasteryStars({
  mastery,
  showNext = false,
  tone = "text-warning",
  labelTone = "text-ink",
}: {
  mastery: MasteryLevel | null;
  showNext?: boolean;
  tone?: string;
  labelTone?: string;
}) {
  if (!mastery) return null;
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className={`text-sm font-bold ${labelTone}`}>{mastery.label}</span>
        <span
          className="inline-flex items-center gap-0.5"
          role="img"
          aria-label={`${mastery.stars} of 5 stars`}
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={`h-3.5 w-3.5 ${
                index < mastery.stars ? `${tone} fill-current` : "text-hairline"
              }`}
              aria-hidden="true"
            />
          ))}
        </span>
      </div>
      {showNext ? (
        <p className="mt-1 text-xs text-ink-mute">
          {mastery.next
            ? `${mastery.next.pointsNeeded}% more to reach ${mastery.next.label}`
            : "You've reached the top level."}
        </p>
      ) : null}
    </div>
  );
}
