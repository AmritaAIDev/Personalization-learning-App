"use client";

/**
 * Animates a number from 0 to its target on mount with an ease-out curve.
 * Uses a plain rAF loop (reliable across framer versions) and renders the final
 * value directly under reduced-motion.
 */

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export default function CountUp({
  value,
  duration = 1,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}) {
  const reduce = useReducedMotion();
  // Initialised to the final value so the number is always correct even if the
  // animation frames never run (e.g. a background tab); the rAF loop below only
  // adds the count-up enhancement on top.
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const durationMs = Math.max(1, duration * 1000);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  const shown = reduce ? value : display;
  return (
    <>
      {shown.toFixed(decimals)}
      {suffix}
    </>
  );
}
