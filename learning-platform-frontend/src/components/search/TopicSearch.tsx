"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import TopicPickerDialog from "./TopicPickerDialog";

export default function TopicSearch({
  destination = "learn",
  compact = false,
}: {
  destination?: "learn" | "practice";
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openWithShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", openWithShortcut);
    return () => window.removeEventListener("keydown", openWithShortcut);
  }, []);

  return (
    <section className="mx-auto w-full">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group flex w-full items-center rounded-xl border border-hairline bg-surface text-left text-ink shadow-[0_8px_24px_rgba(20,20,30,0.025)] transition hover:border-primary/30 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${compact ? "h-11 px-4 text-sm" : "h-13 px-4 text-[15px]"}`}
        aria-haspopup="dialog"
        aria-label="Find a topic. Press Control K to open search."
      >
        <Search
          className="mr-3 h-[18px] w-[18px] shrink-0 text-ink-mute transition group-hover:text-primary"
          aria-hidden="true"
        />
        <span className="text-ink-mute">
          {compact
            ? "Search a concept or chapter"
            : "Search a concept, chapter, or practice unit"}
        </span>
        <kbd className="ml-auto hidden rounded-md border border-hairline bg-canvas px-1.5 py-0.5 text-[10px] font-semibold text-ink-mute sm:inline-flex">
          Ctrl K
        </kbd>
      </button>
      <TopicPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        destination={destination}
      />
    </section>
  );
}
