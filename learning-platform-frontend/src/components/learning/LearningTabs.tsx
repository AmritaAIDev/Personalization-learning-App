"use client";

import { Compass, Layers3, Target } from "lucide-react";
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
  return (
    <div
      role="tablist"
      aria-label="Topic workspace"
      className="flex w-full gap-1 rounded-2xl border border-hairline bg-surface p-1 shadow-[0_8px_22px_rgba(20,20,30,0.04)] sm:w-auto"
    >
      {TABS.map(({ value, label, hint, Icon }) => {
        const isActive = value === activeTab;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={hint}
            onClick={() => onChange(value)}
            className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition sm:flex-none sm:px-4 ${
              isActive
                ? "bg-primary text-white shadow-[0_8px_18px_rgba(20,20,30,0.16)]"
                : "text-ink-soft hover:bg-canvas hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
