"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { requestProfileSetup } from "@/lib/personalization";
import { generatePlanRequest } from "@/lib/study-plan";

/** Shown when the student has no plan yet: build it, or set the target month first. */
export default function PlanEmptyState({ hasTarget }: { hasTarget: boolean }) {
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = async () => {
    setError(null);
    setBuilding(true);
    try {
      await generatePlanRequest();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Your plan could not be built. Please try again.",
      );
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div>
      <EmptyState
        icon={CalendarPlus}
        title={hasTarget ? "Build your study plan" : "Set your target month"}
        description={
          hasTarget
            ? "We will schedule your remaining topics day by day, up to your target month."
            : "Tell us the month you want to be ready by and we will build a day-by-day plan."
        }
        actionLabel={
          hasTarget ? (building ? "Building..." : "Build my plan") : "Set up my plan"
        }
        onAction={hasTarget ? () => void build() : requestProfileSetup}
      />
      {error ? (
        <p className="mt-3 text-center text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
