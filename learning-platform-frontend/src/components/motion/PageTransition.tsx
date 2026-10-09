"use client";

/**
 * Soft cross-fade between routes, now with a true exit: the outgoing page
 * fades away first, then the new one settles in, so navigation reads as a
 * single choreographed move instead of a hard swap.
 *
 * Opacity-only on purpose: a transformed wrapper would become the containing
 * block for any `position: fixed` child (the flashcard modal, dialogs), so we
 * animate opacity alone to keep those overlays anchored to the viewport.
 * Mounted once in the root layout, honouring reduced-motion.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { EASE_OUT_SOFT } from "./MotionPrimitives";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.14, ease: "easeIn" } }}
        transition={{ duration: 0.3, ease: EASE_OUT_SOFT }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
