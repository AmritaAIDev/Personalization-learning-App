'use client';

import { useEffect } from 'react';

/**
 * Freezes the page behind a full-surface dialog. Without this, scrolling on a
 * flashcard or a submit sheet drags the workspace underneath it, which is
 * especially disorienting on a phone.
 */
export function useBodyScrollLock(active = true): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
