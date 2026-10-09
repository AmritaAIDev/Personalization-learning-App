import { slugify } from './catalog.slug';

export interface ChapterAlias {
  subject: string;
  /** The chapter name some content is tagged with. */
  from: string;
  /** The curriculum-tree chapter it belongs to. */
  to: string;
}

/**
 * Content tagged under a chapter name the curriculum tree does not use.
 *
 * Found with `npm run audit:catalog` against the real database: the older
 * Electrostatics question bank (seed-diagnostic and friends) is tagged with
 * the NCERT chapter names, while the syllabus tree (seed:syllabus) has a single
 * "Electrostatics" chapter, so that content, and every student's progress on
 * it, would otherwise be invisible on the Subjects screens.
 *
 * An alias only applies while `from` is NOT itself a chapter in the tree and
 * `to` is; the moment the tree gains a real "from" chapter the alias switches
 * itself off, so it can never double-count.
 */
export const CHAPTER_ALIASES: readonly ChapterAlias[] = [
  {
    subject: 'Physics',
    from: 'Electric Charges and Fields',
    to: 'Electrostatics',
  },
  {
    subject: 'Physics',
    from: 'Electrostatic Potential and Capacitance',
    to: 'Electrostatics',
  },
  {
    subject: 'Chemistry',
    from: 'Thermodynamics',
    to: 'Chemical Thermodynamics',
  },
];

export interface TreeChapterRef {
  subject: string;
  chapter: string;
}

export interface AliasResolver {
  /** The tree chapter a content-side chapter name belongs to (itself if none). */
  canonical(subject: string, chapter: string): string;
  /** Aliases that apply to one subject. */
  forSubject(subject: string): ChapterAlias[];
  /** All content-side names that fold into a tree chapter, itself included. */
  sources(subject: string, chapter: string): string[];
  /** Resolves a URL slug that is an alias's slug to the tree chapter name. */
  chapterForSlug(subject: string, slug: string): string | null;
}

const keyOf = (subject: string, chapter: string) => `${subject}|${chapter}`;

export function buildAliasResolver(
  treeChapters: readonly TreeChapterRef[],
  aliases: readonly ChapterAlias[] = CHAPTER_ALIASES,
): AliasResolver {
  const inTree = new Set(treeChapters.map((c) => keyOf(c.subject, c.chapter)));
  const active = aliases.filter(
    (alias) =>
      !inTree.has(keyOf(alias.subject, alias.from)) &&
      inTree.has(keyOf(alias.subject, alias.to)),
  );
  const byFrom = new Map(
    active.map((alias) => [keyOf(alias.subject, alias.from), alias.to]),
  );

  return {
    canonical: (subject, chapter) =>
      byFrom.get(keyOf(subject, chapter)) ?? chapter,
    forSubject: (subject) => active.filter((a) => a.subject === subject),
    sources: (subject, chapter) => [
      chapter,
      ...active
        .filter((a) => a.subject === subject && a.to === chapter)
        .map((a) => a.from),
    ],
    chapterForSlug: (subject, slug) => {
      const wanted = slugify(slug);
      return (
        active.find((a) => a.subject === subject && slugify(a.from) === wanted)
          ?.to ?? null
      );
    },
  };
}
