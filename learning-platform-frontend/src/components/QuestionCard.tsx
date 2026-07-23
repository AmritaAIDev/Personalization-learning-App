'use client';

import { Check } from 'lucide-react';

/**
 * Safe reusable question selector. It intentionally has no answer key,
 * explanation, or client-side correctness calculation; those stay server-side.
 */
export default function QuestionCard({
  questionText,
  options,
  selectedOption,
  disabled = false,
  onSelect,
}: {
  questionText: string;
  options: string[];
  selectedOption?: string;
  disabled?: boolean;
  onSelect: (option: string) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#ececf0] bg-white p-5 shadow-[0_16px_38px_rgba(20, 20, 30,0.06)] sm:p-7">
      <h2 className="font-heading text-xl font-bold leading-8 text-[#1a1a1f] sm:text-2xl">{questionText}</h2>
      <div className="mt-6 space-y-3" role="radiogroup" aria-label="Answer options">
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
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-medium transition sm:p-5 ${selected ? 'border-[#3f6f57] bg-[#eef3f0] text-[#83112b] ring-1 ring-[#3f6f57]' : 'border-[#ececf0] text-[#1a1a1f] hover:border-[#3f6f57]/45 hover:bg-[#f7faf8]'} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {option}
              {selected && <Check className="h-5 w-5 text-[#3f6f57]" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
