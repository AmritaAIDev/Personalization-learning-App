"use client";

/**
 * Applies the product-wide motion policy: anyone whose OS asks for reduced
 * motion gets every framer-animation (springs, layout glides, fades)
 * switched off instantly — component-level guards don't have to remember.
 */

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

export default function MotionSettings({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
