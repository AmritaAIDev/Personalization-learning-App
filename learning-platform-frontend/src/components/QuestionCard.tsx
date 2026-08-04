"use client";

import { Check } from "lucide-react";

/**
 * Safe reusable question selector. It intentionally has no answer key,
 * explanation, or client-side correctness calculation; those stay server-side.
 */
export default function QuestionCard({
  questionText,
  options,
  selectedOption,
  disabled = false,
  compact = false,
  onSelect,
}: {
  questionText: string;
  options: string[];
  selectedOption?: string;
  disabled?: boolean;
  compact?: boolean;
  onSelect: (option: string) => void;
}) {
  return (
    <section
      className={`rounded-[1.4rem] border border-[#ececf0] bg-white shadow-[0_12px_28px_rgba(20,20,30,0.05)] ${compact ? "p-4 sm:p-5" : "p-5 sm:p-7"}`}
    >
      <h2
        className={`font-heading font-bold text-[#1a1a1f] ${compact ? "text-lg leading-7 sm:text-xl sm:leading-8" : "text-xl leading-8 sm:text-2xl"}`}
      >
        {questionText}
      </h2>
      <div
        className={compact ? "mt-4 space-y-2.5" : "mt-6 space-y-3"}
        role="radiogroup"
        aria-label="Answer options"
      >
        {options.map((option) => {
          const selected = option === selectedOption;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onSelect(option)}
              className={`flex w-full items-center justify-between rounded-xl border text-left text-sm font-medium transition ${compact ? "min-h-11 px-3 py-2.5" : "rounded-2xl p-4 sm:p-5"} ${selected ? "border-[#3f6f57] bg-[#eef3f0] text-[#2c4c3d] ring-1 ring-[#3f6f57]" : "border-[#ececf0] text-[#1a1a1f] hover:border-[#3f6f57]/45 hover:bg-[#f7faf8]"} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {option}
              {selected && (
                <Check className="h-5 w-5 text-[#3f6f57]" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
