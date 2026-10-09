"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabDef<Id extends string> {
  id: Id;
  label: string;
}

/**
 * Accessible tabs (roving tabindex; arrow keys, Home and End). The tab row
 * scrolls inside itself on narrow screens. Panels render lazily: only the
 * active one is mounted, so a tab that fetches data fetches on first open.
 */
export default function Tabs<Id extends string>({
  tabs,
  label,
  idPrefix,
  initial,
  render,
}: {
  tabs: readonly TabDef<Id>[];
  label: string;
  idPrefix: string;
  initial?: Id;
  render: (active: Id) => ReactNode;
}) {
  const [active, setActive] = useState<Id>(initial ?? tabs[0].id);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") {
      next = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <section className="rounded-2xl border border-hairline bg-surface shadow-[0_8px_22px_rgba(20,20,30,0.04)]">
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-1 overflow-x-auto border-b border-hairline px-2 pt-2 [scrollbar-width:thin]"
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                refs.current[index] = node;
              }}
              id={`${idPrefix}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${idPrefix}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`min-h-11 shrink-0 whitespace-nowrap rounded-t-xl border-b-2 px-4 text-sm font-semibold transition motion-reduce:transition-none ${
                selected
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-mute hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${idPrefix}-panel-${active}`}
        aria-labelledby={`${idPrefix}-tab-${active}`}
        className="min-w-0 p-4 sm:p-6"
      >
        {render(active)}
      </div>
    </section>
  );
}
