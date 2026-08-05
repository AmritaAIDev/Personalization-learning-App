import type { RetrievedSource } from './agent/agent.service';

/**
 * A learner-facing citation. Deliberately excludes the raw `snippet` used to
 * ground generation — only the human-readable label leaves the server.
 */
export interface Citation {
  title: string;
  topic: string;
  chapter: string;
}

/** The shape returned by the on-demand explanation endpoints. */
export interface ExplanationResult {
  explanation: string;
  grounded: boolean;
  /** Reviewed concept notes the explanation was grounded on; empty when none. */
  sources: Citation[];
}

/**
 * Reduces retrieved sources to a short, de-duplicated citation list. Titles are
 * de-duplicated case-insensitively and capped so the UI stays tidy.
 */
export function toCitations(sources: RetrievedSource[]): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const source of sources) {
    const title = source.title?.trim();
    if (!title) continue;
    const key = title.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ title, topic: source.topic, chapter: source.chapter });
    if (citations.length === 3) break;
  }
  return citations;
}
