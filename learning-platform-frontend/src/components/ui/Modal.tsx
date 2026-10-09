"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Buttons row, pinned under the content. */
  footer?: ReactNode;
  /**
   * When false the dialog can only be closed by its own buttons (Escape, the
   * backdrop and the X do nothing). Use for a step the student must answer.
   */
  dismissible?: boolean;
  /** Tailwind max-width class for the panel on larger screens. */
  maxWidth?: string;
}

/**
 * Accessible modal dialog: portal, labelled by its title, focus moves in on
 * open and returns on close, Tab stays inside, Escape closes, and the page
 * behind does not scroll. A bottom sheet on phones, a centred card from `sm`.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
  maxWidth = "sm:max-w-lg",
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const target =
      panel?.querySelector<HTMLElement>("[data-autofocus]") ??
      panel?.querySelector<HTMLElement>(FOCUSABLE) ??
      panel;
    target?.focus();
    return () => returnFocusRef.current?.focus?.();
  }, [open]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" && dismissible) {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [dismissible, onClose],
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-solid/45 backdrop-blur-sm sm:items-center sm:p-6"
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={dismissible ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[calc(100dvh-0.75rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-hairline bg-surface shadow-[0_28px_90px_rgba(20,20,30,0.28)] outline-none sm:max-h-[calc(100dvh-3rem)] sm:rounded-[1.75rem] ${maxWidth}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-heading text-xl font-bold tracking-tight text-ink"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-6 text-ink-soft"
              >
                {description}
              </p>
            ) : null}
          </div>
          {dismissible ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-mute transition hover:bg-canvas hover:text-ink"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {children}
        </div>
        {footer ? (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-hairline bg-surface px-5 py-4 sm:flex-row sm:justify-end sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
