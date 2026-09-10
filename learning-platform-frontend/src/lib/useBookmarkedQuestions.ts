"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/**
 * Hydrates which questions the student has already bookmarked (for toggle
 * buttons on a review list) and exposes an optimistic toggle. One instance
 * of this hook per review page keeps this to a single GET regardless of how
 * many question rows render, instead of each row fetching its own state.
 */
export function useBookmarkedQuestions() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    void apiFetch<string[]>("/api/bookmarks/ids")
      .then((data) => {
        if (active) setIds(new Set(data));
      })
      .catch(() => {
        // Non-critical — toggle buttons just start in the "not bookmarked"
        // state; a real toggle attempt will still fail loudly if the API is
        // actually down.
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback(async (questionId: string) => {
    setPendingIds((prev) => new Set(prev).add(questionId));
    const wasBookmarked = ids.has(questionId);
    // Optimistic: flip immediately, reconcile with the server's answer.
    setIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
    try {
      const result = await apiFetch<{ bookmarked: boolean }>(
        `/api/bookmarks/${questionId}/toggle`,
        { method: "POST" },
      );
      setIds((prev) => {
        const next = new Set(prev);
        if (result.bookmarked) next.add(questionId);
        else next.delete(questionId);
        return next;
      });
    } catch {
      // Revert the optimistic flip on failure.
      setIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.add(questionId);
        else next.delete(questionId);
        return next;
      });
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  }, [ids]);

  return { bookmarkedIds: ids, pendingIds, toggleBookmark: toggle };
}
