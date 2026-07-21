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
    <section className="rounded-[1.75rem] border border-[#e8e1e3] bg-white p-5 shadow-[0_16px_38px_rgba(49,51,55,0.06)] sm:p-7">
      <h2 className="font-heading text-xl font-bold leading-8 text-[#313337] sm:text-2xl">{questionText}</h2>
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
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-medium transition sm:p-5 ${selected ? 'border-[#e31540] bg-[#fff5f7] text-[#83112b] ring-1 ring-[#e31540]' : 'border-[#e6e1e2] text-[#313337] hover:border-[#e31540]/45 hover:bg-[#fffafb]'} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {option}
              {selected && <Check className="h-5 w-5 text-[#e31540]" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
