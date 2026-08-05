"use client";

import { Compass, Layers3, Target } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { LearningTab } from "@/lib/learning-types";

const TABS: Array<{
  value: LearningTab;
  label: string;
  hint: string;
  Icon: typeof Compass;
}> = [
  {
    value: "overview",
    label: "Overview",
    hint: "Mastery, history, and concept map",
    Icon: Compass,
  },
  {
    value: "practice",
    label: "Practice",
    hint: "Adaptive rounds with the linked tutor",
    Icon: Target,
  },
  {
    value: "flashcards",
    label: "Flashcards",
    hint: "Spaced recall for this topic",
    Icon: Layers3,
  },
];

/**
 * Workspace navigation. The three surfaces are always one tap apart, and the
 * active tab is reflected in the URL so a session can be shared or resumed.
 */
export default function LearningTabs({
  activeTab,
  onChange,
}: {
  activeTab: LearningTab;
  onChange: (tab: LearningTab) => void;
}) {
  const reduce = useReducedMotion();
  // Arrow-key roving focus keeps the tablist keyboard-navigable per ARIA.
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + delta + TABS.length) % TABS.length;
    onChange(TABS[next].value);
  };

  return (
    <div
      role="tablist"
      aria-label="Topic workspace"
      className="flex w-full gap-1 rounded-2xl border border-hairline bg-surface p-1 shadow-[0_8px_22px_rgba(20,20,30,0.04)] sm:w-auto"
    >
      {TABS.map(({ value, label, hint, Icon }, index) => {
        const isActive = value === activeTab;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            title={hint}
            onClick={() => onChange(value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`relative inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors sm:flex-none sm:px-4 ${
              isActive
                ? "text-white"
                : "text-ink-soft hover:bg-canvas hover:text-ink"
            }`}
          >
            {isActive ? (
              <motion.span
                layoutId="learning-tab-indicator"
                className="absolute inset-0 rounded-xl bg-primary shadow-[0_8px_18px_rgba(20,20,30,0.16)]"
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 460, damping: 34 }
                }
              />
            ) : null}
            <span className="relative z-10 inline-flex items-center gap-2">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
