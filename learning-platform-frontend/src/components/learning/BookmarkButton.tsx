"use client";

import { Bookmark } from "lucide-react";

export default function BookmarkButton({
  bookmarked,
  pending,
  onToggle,
}: {
  bookmarked: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={bookmarked}
      disabled={pending}
      title={bookmarked ? "Remove bookmark" : "Bookmark for later"}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
        bookmarked
          ? "bg-primary-tint text-primary"
          : "text-ink-mute hover:bg-canvas hover:text-ink-soft"
      }`}
    >
      <Bookmark
        className="h-4 w-4"
        aria-hidden="true"
        fill={bookmarked ? "currentColor" : "none"}
      />
      <span className="sr-only">
        {bookmarked ? "Remove bookmark" : "Bookmark for later"}
      </span>
    </button>
  );
}
