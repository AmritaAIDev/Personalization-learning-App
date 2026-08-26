"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared loading/error/data lifecycle for a client-side GET-on-mount fetch.
 * Consolidates a pattern that was previously hand-rolled (with drifting
 * error-fallback text) across several dashboard components.
 *
 * `fetcher` must be stable across renders (wrap it in your own
 * `useCallback` with its own literal deps array) — this hook re-runs the
 * fetch whenever the `fetcher` reference changes.
 */
export function useApiResource<T>(
  fetcher: () => Promise<T>,
  fallbackErrorMessage = "This could not be loaded.",
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    // Only show the loading skeleton when nothing is on screen yet. Once we
    // have data, a background refresh (e.g. triggered by
    // LEARNING_DATA_UPDATED_EVENT) keeps the current data visible instead of
    // blanking the UI back to a skeleton.
    if (!hasDataRef.current) setLoading(true);
    try {
      const next = await fetcher();
      if (!mountedRef.current || controller.signal.aborted) return;
      setData(next);
      hasDataRef.current = true;
      setError(null);
    } catch (reason) {
      if (!mountedRef.current || controller.signal.aborted) return;
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : fallbackErrorMessage);
    } finally {
      if (mountedRef.current && !controller.signal.aborted) setLoading(false);
    }
  }, [fetcher, fallbackErrorMessage]);

  useEffect(() => {
    // Deferred a macrotask so the fetch's setState calls land outside the
    // effect body itself — react-hooks/set-state-in-effect flags calling
    // setState synchronously within an effect (this mirrors the pattern the
    // call sites used before this hook existed).
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  return { data, loading, error, reload: load, setData };
}
