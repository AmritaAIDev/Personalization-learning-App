import {
  ChapterDifficulty,
  ChapterMetaSource,
  ChapterMetaStatus,
} from './chapter-meta.entity';
import type {
  AuthoredChapterMeta,
  ChapterMetaDraft,
  ChapterMetaReport,
  ChapterRef,
  CompassChapter,
  PlannedChapterMeta,
} from './chapter-meta.types';

const DIFFICULTY_ORDER: ChapterDifficulty[] = [
  ChapterDifficulty.EASY,
  ChapterDifficulty.MEDIUM,
  ChapterDifficulty.HARD,
];

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function toDifficulty(value: CompassChapter['difficulty']): ChapterDifficulty {
  return value as ChapterDifficulty;
}

/**
 * Folds the metadata of every jee-compass chapter that maps onto one of our
 * chapters into a single draft: overviews are joined, objectives and
 * formulas are unioned in order, the hardest difficulty wins, and study
 * time is summed.
 */
export function mergeCompassChapters(
  chapters: readonly CompassChapter[],
): ChapterMetaDraft {
  if (chapters.length === 0) {
    throw new Error('mergeCompassChapters needs at least one chapter.');
  }
  const ordered = [...chapters].sort((a, b) => a.chapterId - b.chapterId);
  const hardest = ordered
    .map((chapter) => toDifficulty(chapter.difficulty))
    .reduce((best, current) =>
      DIFFICULTY_ORDER.indexOf(current) > DIFFICULTY_ORDER.indexOf(best)
        ? current
        : best,
    );
  return {
    overview: unique(ordered.map((chapter) => chapter.overview)).join(' '),
    objectives: unique(ordered.flatMap((chapter) => chapter.objectives)),
    keyFormulas: unique(ordered.flatMap((chapter) => chapter.keyFormulas)),
    difficulty: hardest,
    studyMinutes: ordered.reduce(
      (total, chapter) => total + chapter.studyTimeMinutes,
      0,
    ),
  };
}

export interface ChapterMetaPlanInput {
  ourChapters: readonly ChapterRef[];
  compass: readonly CompassChapter[];
  compassMap: Readonly<Record<string, ChapterRef | null>>;
  units: Readonly<Record<string, string>>;
  authored: readonly AuthoredChapterMeta[];
}

export interface ChapterMetaPlan {
  rows: PlannedChapterMeta[];
  report: ChapterMetaReport;
}

const keyOf = (ref: ChapterRef) => `${ref.subject}|${ref.chapter}`;
const compassKeyOf = (c: CompassChapter) => `${c.subjectId}:${c.chapterId}`;

/**
 * Pure planning step of the chapter-meta seed: decides, for every chapter in
 * our syllabus, what row to write and why, and reports any integrity
 * problem. Nothing here touches the database.
 */
export function buildChapterMetaPlan(
  input: ChapterMetaPlanInput,
): ChapterMetaPlan {
  const errors: string[] = [];
  const ours = new Map(input.ourChapters.map((ref) => [keyOf(ref), ref]));
  const compassByTarget = new Map<string, CompassChapter[]>();
  const skippedCompass: string[] = [];

  for (const chapter of input.compass) {
    const mapKey = compassKeyOf(chapter);
    if (!(mapKey in input.compassMap)) {
      errors.push(`Compass chapter ${mapKey} (${chapter.name}) is not mapped.`);
      continue;
    }
    const target = input.compassMap[mapKey];
    if (target === null) {
      skippedCompass.push(`${mapKey} ${chapter.name}`);
      continue;
    }
    if (!ours.has(keyOf(target))) {
      errors.push(
        `Compass chapter ${mapKey} maps to unknown chapter ${keyOf(target)}.`,
      );
      continue;
    }
    compassByTarget.set(keyOf(target), [
      ...(compassByTarget.get(keyOf(target)) ?? []),
      chapter,
    ]);
  }

  const authoredByKey = new Map<string, AuthoredChapterMeta>();
  for (const entry of input.authored) {
    const key = keyOf(entry);
    if (!ours.has(key)) {
      errors.push(`Authored metadata targets unknown chapter ${key}.`);
    } else if (authoredByKey.has(key)) {
      errors.push(`Authored metadata for ${key} is duplicated.`);
    } else if (compassByTarget.has(key)) {
      errors.push(
        `${key} has both compass and authored metadata; keep only one.`,
      );
    }
    authoredByKey.set(key, entry);
  }

  const rows: PlannedChapterMeta[] = [];
  const unitOnly: string[] = [];
  const mergedTargets: ChapterMetaReport['mergedTargets'] = [];

  for (const ref of input.ourChapters) {
    const key = keyOf(ref);
    const unit = input.units[key];
    if (!unit) {
      errors.push(`No unit defined for ${key}.`);
      continue;
    }
    const base = { subject: ref.subject, chapter: ref.chapter, unit };
    const compassSources = compassByTarget.get(key);
    const authored = authoredByKey.get(key);

    if (compassSources) {
      const sourceIds = compassSources
        .sort((a, b) => a.chapterId - b.chapterId)
        .map(compassKeyOf);
      if (sourceIds.length > 1) {
        mergedTargets.push({ target: key, sources: sourceIds });
      }
      rows.push({
        ...base,
        ...mergeCompassChapters(compassSources),
        source: ChapterMetaSource.COMPASS_IMPORT,
        status: ChapterMetaStatus.PUBLISHED,
        compassSources: sourceIds,
      });
    } else if (authored) {
      rows.push({
        ...base,
        overview: authored.overview,
        objectives: unique(authored.objectives),
        keyFormulas: unique(authored.keyFormulas),
        difficulty: authored.difficulty as ChapterDifficulty,
        studyMinutes: authored.studyMinutes,
        source: ChapterMetaSource.AI_DRAFT,
        status: ChapterMetaStatus.DRAFT,
        compassSources: [],
      });
    } else {
      unitOnly.push(key);
      rows.push({
        ...base,
        overview: null,
        objectives: [],
        keyFormulas: [],
        difficulty: null,
        studyMinutes: null,
        source: ChapterMetaSource.AI_DRAFT,
        status: ChapterMetaStatus.DRAFT,
        compassSources: [],
      });
    }
  }

  return {
    rows,
    report: {
      planned: rows.length,
      fromCompass: rows.filter(
        (row) => row.source === ChapterMetaSource.COMPASS_IMPORT,
      ).length,
      mergedTargets,
      authored: rows.filter(
        (row) => row.source === ChapterMetaSource.AI_DRAFT && row.overview,
      ).length,
      unitOnly,
      skippedCompass,
      errors,
    },
  };
}
