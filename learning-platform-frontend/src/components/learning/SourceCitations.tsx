import { BookMarked } from "lucide-react";
import type { Citation } from "@/lib/diagnostic-types";

/**
 * Renders the reviewed concept notes an AI answer was grounded on. Shows
 * nothing when there are no sources (Qdrant empty/unavailable), so an
 * ungrounded answer simply carries no citation strip.
 */
export default function SourceCitations({
  sources,
}: {
  sources: Citation[] | undefined;
}) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-3 border-t border-hairline pt-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-mute">
        <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
        Sources
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <li
            key={`${source.title}-${index}`}
            className="rounded-lg border border-hairline bg-canvas px-2.5 py-1"
          >
            <span className="text-xs font-bold text-ink">{source.title}</span>
            {source.topic ? (
              <span className="ml-1 text-[11px] text-ink-mute">
                · {source.topic}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
