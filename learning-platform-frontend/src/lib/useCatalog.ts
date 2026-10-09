"use client";

import { useCallback, useEffect } from "react";
import { LEARNING_DATA_UPDATED_EVENT, apiFetch } from "./api";
import type {
  CatalogChapterDetail,
  CatalogSubjectChapters,
  CatalogSubjectSummary,
  ChapterAnalytics,
  SubjectAnalytics,
  SyllabusProgress,
} from "./catalog-types";
import { useApiResource } from "./useApiResource";

/** Re-fetches in the background whenever the student finishes some learning. */
function useRefreshOnLearning(reload: () => Promise<void>) {
  useEffect(() => {
    const refresh = () => void reload();
    window.addEventListener(LEARNING_DATA_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(LEARNING_DATA_UPDATED_EVENT, refresh);
  }, [reload]);
}

export function useCatalogSubjects() {
  const fetcher = useCallback(
    () => apiFetch<CatalogSubjectSummary[]>("/api/catalog/subjects"),
    [],
  );
  const resource = useApiResource(fetcher, "Subjects could not be loaded.");
  useRefreshOnLearning(resource.reload);
  return resource;
}

/** Overall and per-subject syllabus completion: the one shared definition. */
export function useSyllabusProgress() {
  const fetcher = useCallback(
    () => apiFetch<SyllabusProgress>("/api/catalog/progress"),
    [],
  );
  const resource = useApiResource(fetcher, "Progress could not be loaded.");
  useRefreshOnLearning(resource.reload);
  return resource;
}

export function useSubjectChapters(subject: string) {
  const fetcher = useCallback(
    () =>
      apiFetch<CatalogSubjectChapters>(
        `/api/catalog/subjects/${encodeURIComponent(subject)}/chapters`,
      ),
    [subject],
  );
  const resource = useApiResource(fetcher, "Chapters could not be loaded.");
  useRefreshOnLearning(resource.reload);
  return resource;
}

export function useChapterDetail(subject: string, chapter: string) {
  const fetcher = useCallback(
    () =>
      apiFetch<CatalogChapterDetail>(
        `/api/catalog/subjects/${encodeURIComponent(subject)}/chapters/${encodeURIComponent(chapter)}`,
      ),
    [subject, chapter],
  );
  const resource = useApiResource(fetcher, "This chapter could not be loaded.");
  useRefreshOnLearning(resource.reload);
  return resource;
}

export function useSubjectAnalytics(subject: string) {
  const fetcher = useCallback(
    () =>
      apiFetch<SubjectAnalytics>(
        `/api/catalog/subjects/${encodeURIComponent(subject)}/analytics`,
      ),
    [subject],
  );
  const resource = useApiResource(fetcher, "Analytics could not be loaded.");
  useRefreshOnLearning(resource.reload);
  return resource;
}

/** Mount the consumer only when the data is needed: loading starts on mount. */
export function useChapterAnalytics(subject: string, chapter: string) {
  const fetcher = useCallback(
    () =>
      apiFetch<ChapterAnalytics>(
        `/api/catalog/subjects/${encodeURIComponent(subject)}/chapters/${encodeURIComponent(chapter)}/analytics`,
      ),
    [subject, chapter],
  );
  return useApiResource(fetcher, "Bloom analytics could not be loaded.");
}
