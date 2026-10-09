"use client";

import { useRef, type KeyboardEvent } from "react";
import { ALL_UNITS } from "@/lib/catalog";

export interface UnitOption {
  name: string;
  count: number;
}

/**
 * Horizontally scrollable unit filter (a roving-tabindex tablist). Scrolls
 * inside its own row on narrow screens instead of wrapping or overflowing.
 */
export default function UnitFilterTabs({
  units,
  total,
  selected,
  onSelect,
}: {
  units: readonly UnitOption[];
  total: number;
  selected: string;
  onSelect: (unit: string) => void;
}) {
  const options = [{ name: ALL_UNITS, label: "All chapters", count: total }].concat(
    units.map((unit) => ({ name: unit.name, label: unit.name, count: unit.count })),
  );
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (event: KeyboardEvent, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % options.length;
    else if (event.key === "ArrowLeft") {
      next = (index - 1 + options.length) % options.length;
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else return;
    event.preventDefault();
    onSelect(options[next].name);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Filter chapters by unit"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
    >
      {options.map((option, index) => {
        const active = option.name === selected;
        return (
          <button
            key={option.name}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(option.name)}
            onKeyDown={(event) => move(event, index)}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition motion-reduce:transition-none ${
              active
                ? "border-transparent bg-primary text-white shadow-[0_8px_20px_rgba(63,111,87,0.22)]"
                : "border-hairline bg-surface text-ink-soft hover:border-primary/30 hover:text-primary"
            }`}
          >
            {option.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                active ? "bg-white/20 text-white" : "bg-canvas text-ink-mute"
              }`}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
