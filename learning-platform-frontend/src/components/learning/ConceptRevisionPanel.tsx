"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { ArrowRight, BookOpenText, LoaderCircle, X } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { scopeToParams } from "@/lib/learning";
import type { LearningScope } from "@/lib/learning-types";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import {
  AiUnavailableBlock,
  AiUnavailableNote,
} from "@/components/AiUnavailableBlock";

const StudyMarkdown = dynamic(() => import("./StudyMarkdown"), {
  ssr: false,
});

type RevisionState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: string; grounded: boolean };

/**
 * Optional pre-practice step: a short AI-generated revision of the topic.
 * Never blocks reaching Practice or Flashcards — it is a button on the
 * overview, not a gate in front of either.
 */
export default function ConceptRevisionPanel({
  scope,
  onClose,
  onStartPractice,
}: {
  scope: LearningScope;
  onClose: () => void;
  onStartPractice: () => void;
}) {
  const [state, setState] = useState<RevisionState>({ status: "loading" });
  const [requestNonce, setRequestNonce] = useState(0);
  const retry = useCallback(() => setRequestNonce((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });
      try {
        const data = await apiFetch<{ content: string; grounded: boolean }>(
          `/api/learning/revision?${scopeToParams(scope).toString()}`,
        );
        if (!cancelled) setState({ status: "ready", ...data });
      } catch (reason) {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            reason instanceof ApiError
              ? reason.message
              : "The revision couldn't be prepared right now.",
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // Re-request when the topic changes or a retry is requested; `scope` is a
    // fresh object every render otherwise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.subject, scope.chapter, scope.topic, requestNonce]);

  useBodyScrollLock();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-stretch bg-[#102017]/55 p-0 backdrop-blur-md sm:items-center sm:justify-center sm:p-6"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Revise ${scope.topic}`}
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-canvas shadow-2xl sm:h-[min(42rem,calc(100dvh-3rem))] sm:max-w-2xl sm:rounded-[2rem]"
      >
        <header className="flex items-center justify-between gap-4 border-b border-primary/10 bg-surface px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-7 sm:py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              <BookOpenText className="h-3.5 w-3.5" aria-hidden="true" />
              Revise
            </p>
            <h2 className="mt-1 truncate font-heading text-lg font-bold tracking-tight text-ink sm:text-2xl">
              {scope.topic}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-hairline bg-canvas text-ink-soft transition hover:bg-surface hover:text-ink"
            aria-label="Close revision"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))] sm:p-7">
          {state.status === "loading" ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm font-semibold text-ink-mute">
              <LoaderCircle
                className="h-6 w-6 animate-spin text-primary"
                aria-hidden="true"
              />
              Preparing a quick revision.
            </div>
          ) : null}

          {state.status === "error" ? (
            <AiUnavailableBlock
              title="This revision needs a retry"
              description={state.message}
              onRetry={retry}
            />
          ) : null}

          {state.status === "ready" ? (
            <>
              {!state.grounded ? (
                <AiUnavailableNote
                  className="mb-3"
                  description="The AI tutor is unavailable right now — this revision is built from already-reviewed material instead."
                />
              ) : null}
              <StudyMarkdown className="text-sm leading-7 text-ink-soft">
                {state.content}
              </StudyMarkdown>
            </>
          ) : null}
        </div>

        <div className="border-t border-hairline bg-surface p-4 sm:p-5">
          <button
            type="button"
            onClick={onStartPractice}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-strong sm:w-auto"
          >
            Start practice
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
