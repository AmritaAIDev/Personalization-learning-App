"use client";

/**
 * Soft cross-fade between routes. Opacity-only on purpose: a transformed
 * wrapper would become the containing block for any `position: fixed` child
 * (the flashcard modal, dialogs), so we animate opacity alone to keep those
 * overlays anchored to the viewport. Honors reduced-motion.
 */

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { EASE_OUT_SOFT } from "./MotionPrimitives";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, ease: EASE_OUT_SOFT }}
    >
      {children}
    </motion.div>
  );
}
