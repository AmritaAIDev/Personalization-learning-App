import { buildAliasResolver, type ChapterAlias } from './catalog-aliases';

export interface ChapterRef {
  subject: string;
  chapter: string;
}

export interface CountedChapter extends ChapterRef {
  count: number;
}

export interface AlignmentInput {
  /** Every CHAPTER node in the `topics` tree. */
  treeChapters: readonly ChapterRef[];
  /** Name aliases the catalog applies; defaults to the app's CHAPTER_ALIASES. */
  aliases?: readonly ChapterAlias[];
  /** PUBLISHED questions grouped by their (subject, chapter) tag. */
  questionChapters: readonly CountedChapter[];
  /** Adaptive learning states grouped by (subject, chapter). */
  stateChapters: readonly CountedChapter[];
}

export interface UnmatchedChapter extends CountedChapter {
  /**
   * The tree chapter an alias already folds this name into, or null when
   * nothing handles it (those are the ones that still need a decision).
   */
  aliasedTo: string | null;
  /** Empty tree chapters of the same subject that this might belong to. */
  candidates: string[];
}

export interface AlignmentReport {
  /** Tree chapters that have at least one published question. */
  aligned: number;
  /** Tree chapters with no published question: the catalog shows them empty. */
  emptyTreeChapters: ChapterRef[];
  /** Question tags with no matching tree chapter: invisible to the catalog. */
  unmatchedQuestionChapters: UnmatchedChapter[];
  /** Learning states with no matching tree chapter: invisible to the catalog. */
  unmatchedStateChapters: UnmatchedChapter[];
}

const keyOf = (ref: ChapterRef) => `${ref.subject}|${ref.chapter}`;

const words = (value: string) =>
  new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2 && !['and', 'the'].includes(word)),
  );

/** Shared meaningful words between two chapter names (a hint, never a decision). */
function similarity(a: string, b: string): number {
  const other = words(b);
  return [...words(a)].filter((word) => other.has(word)).length;
}

function candidatesFor(
  unmatched: CountedChapter,
  empty: readonly ChapterRef[],
): string[] {
  return empty
    .filter((ref) => ref.subject === unmatched.subject)
    .map((ref) => ({
      name: ref.chapter,
      score: similarity(unmatched.chapter, ref.chapter),
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((entry) => entry.name);
}

/**
 * Finds where the curriculum tree and the content disagree about a chapter's
 * name. The catalog joins questions and learning state to the tree by exact
 * name, so any disagreement shows up as an empty chapter in one place and
 * invisible content in another. This only reports; deciding which name is
 * right is a human call.
 */
export function compareAlignment(input: AlignmentInput): AlignmentReport {
  const tree = new Set(input.treeChapters.map(keyOf));
  const resolver = buildAliasResolver(input.treeChapters, input.aliases);
  const canonicalOf = (entry: ChapterRef): ChapterRef => ({
    subject: entry.subject,
    chapter: resolver.canonical(entry.subject, entry.chapter),
  });
  // Content folded onto a chapter by an alias counts as that chapter's content.
  const withQuestions = new Set(
    input.questionChapters.map((entry) => keyOf(canonicalOf(entry))),
  );

  const emptyTreeChapters = input.treeChapters
    .filter((ref) => !withQuestions.has(keyOf(ref)))
    .sort((a, b) => keyOf(a).localeCompare(keyOf(b)));

  const unmatched = (list: readonly CountedChapter[]): UnmatchedChapter[] =>
    list
      .filter((entry) => !tree.has(keyOf(entry)))
      .sort((a, b) => b.count - a.count || keyOf(a).localeCompare(keyOf(b)))
      .map((entry) => {
        const target = canonicalOf(entry).chapter;
        return {
          ...entry,
          aliasedTo: target === entry.chapter ? null : target,
          candidates: candidatesFor(entry, emptyTreeChapters),
        };
      });

  return {
    aligned: input.treeChapters.length - emptyTreeChapters.length,
    emptyTreeChapters,
    unmatchedQuestionChapters: unmatched(input.questionChapters),
    unmatchedStateChapters: unmatched(input.stateChapters),
  };
}
