"use client";

import { useCallback, useState } from "react";
import { updateTaskRequest } from "./study-plan";
import type { StudyTaskView, TaskAction } from "./study-plan-types";

/**
 * Sends a tick / un-tick / skip for one task and tracks which tasks are in
 * flight (so a double tap cannot send twice) and the last error. The panels
 * showing the plan reload by themselves when the request succeeds.
 */
export function usePlanTaskActions() {
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (task: StudyTaskView, action: TaskAction) => {
    setError(null);
    setPending((current) => new Set(current).add(task.id));
    try {
      await updateTaskRequest(task.id, action);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "That could not be saved.",
      );
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  }, []);

  return { pending, error, run };
}
