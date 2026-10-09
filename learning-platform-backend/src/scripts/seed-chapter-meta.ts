/**
 * Phase 1 of the JEE Compass adoption plan (docs/JEE-COMPASS-ADOPTION-PLAN.md):
 * seeds `chapter_meta` for every CHAPTER-level topic in our syllabus.
 *
 * Inputs are all repo-reviewed data:
 *   - COMPASS_CHAPTERS  (extracted as text from jee-compass, never executed)
 *   - COMPASS_CHAPTER_MAP + CHAPTER_UNITS (mapping onto our JEE chapters)
 *   - AUTHORED_CHAPTER_META (hand drafts for chapters Compass lacks)
 * The pure decisions live in catalog/chapter-meta.plan.ts; this script only
 * resolves chapters against the database, prints the dry-run report, and
 * persists rows idempotently (keyed by topic_id).
 *
 * Idempotency: re-running refreshes rows this seed owns. Rows whose source
 * is ADMIN are never touched, and `jee_weightage_note` (an admin-only field)
 * is never written here.
 *
 * Usage:
 *   npm run seed:chapter-meta:dry   -- review the report first
 *   npm run seed:chapter-meta       -- apply
 * Requires a database whose chapter topics exist (npm run seed:syllabus).
 */
import { DataSource, In, Repository } from 'typeorm';
import dataSource from '../database/data-source';
import { Topic, TopicLevel } from '../topics/topic.entity';
import { ChapterMeta, ChapterMetaSource } from '../catalog/chapter-meta.entity';
import { buildChapterMetaPlan } from '../catalog/chapter-meta.plan';
import type { ChapterRef, CompassChapter } from '../catalog/chapter-meta.types';
import { COMPASS_CHAPTERS } from './content/compass-chapters';
import {
  CHAPTER_CLASS_LEVELS,
  CHAPTER_UNITS,
  COMPASS_CHAPTER_MAP,
  chapterKey,
} from './content/compass-chapter-map';
import { AUTHORED_CHAPTER_META } from './content/authored-chapter-meta';

const DRY_RUN = process.argv.includes('--dry-run');

interface OurChapter {
  ref: ChapterRef;
  topicId: string;
  subtopicNames: string[];
}

/** Lowercase alphanumerics only, for fuzzy compass-chip vs our-subtopic matching. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Resolve CHAPTER-level topics (parented to a SUBJECT row with one of our
 * three subject names) plus their direct SUB_TOPIC names for the cross-check.
 */
async function loadOurChapters(
  topics: Repository<Topic>,
): Promise<OurChapter[]> {
  const subjects = await topics.find({ where: { level: TopicLevel.SUBJECT } });
  const wanted = new Map(
    subjects
      .filter((s) => ['Physics', 'Chemistry', 'Mathematics'].includes(s.name))
      .map((s) => [s.id, s.name]),
  );
  if (wanted.size === 0) {
    throw new Error(
      'No Physics/Chemistry/Mathematics SUBJECT topics found. ' +
        'Run "npm run seed:syllabus" first.',
    );
  }
  const chapters = await topics.find({
    where: { level: TopicLevel.CHAPTER, parent: In([...wanted.keys()]) },
    relations: { parent: true },
    order: { name: 'ASC' },
  });
  const subtopics = await topics.find({
    where: {
      level: TopicLevel.SUB_TOPIC,
      parent: In(chapters.map((c) => c.id)),
    },
  });
  const subtopicsByChapter = new Map<string, string[]>();
  for (const sub of subtopics) {
    const parentId = sub.parent?.id;
    if (!parentId) continue;
    subtopicsByChapter.set(parentId, [
      ...(subtopicsByChapter.get(parentId) ?? []),
      sub.name,
    ]);
  }
  return chapters.map((chapter) => ({
    ref: {
      subject: wanted.get(chapter.parent!.id) as ChapterRef['subject'],
      chapter: chapter.name,
    },
    topicId: chapter.id,
    subtopicNames: subtopicsByChapter.get(chapter.id) ?? [],
  }));
}

/** Compass chips for one target chapter that our sub-topic tree may be missing. */
function missingChips(
  chapter: CompassChapter,
  ourSubtopics: string[],
): string[] {
  const ours = ourSubtopics.map(normalize);
  return chapter.topics.filter((chip) => {
    const n = normalize(chip);
    return !ours.some((our) => our === n || our.includes(n) || n.includes(our));
  });
}

function printDryRunReport(
  our: OurChapter[],
  compassRows: Map<string, CompassChapter[]>,
): void {
  const chipGaps: string[] = [];
  for (const chapter of our) {
    const sources = compassRows.get(
      chapterKey(chapter.ref.subject, chapter.ref.chapter),
    );
    if (!sources) continue;
    for (const src of sources) {
      const missing = missingChips(src, chapter.subtopicNames);
      if (missing.length > 0) {
        chipGaps.push(
          `  ${chapter.ref.subject} / ${chapter.ref.chapter}  <- ${compassId(src)} chips not matched: ${missing.join(', ')}`,
        );
      }
    }
  }
  console.log(
    '\n[topic-name diff] compass topic chips with no close match in our sub-topic tree:',
  );
  if (chipGaps.length === 0) {
    console.log('  none');
  } else {
    for (const line of chipGaps) console.log(line);
    console.log(
      `  (${chipGaps.length} line(s); cross-check only — our sub-topics are the source of truth)`,
    );
  }

  console.log('\n[formula sample] UTF-8 round-trip check:');
  const sample: Array<{ label: string; keyFormulas: string[] }> = [
    ...COMPASS_CHAPTERS.slice(0, 3).map((c) => ({
      label: c.name,
      keyFormulas: c.keyFormulas,
    })),
    ...AUTHORED_CHAPTER_META.slice(0, 2).map((c) => ({
      label: c.chapter,
      keyFormulas: c.keyFormulas,
    })),
  ];
  for (const item of sample) {
    console.log(`  ${item.label}: ${item.keyFormulas.slice(0, 2).join(' | ')}`);
  }
}

const compassId = (c: CompassChapter) => `${c.subjectId}:${c.chapterId}`;

async function persist(
  metaRepo: Repository<ChapterMeta>,
  our: OurChapter[],
  rows: ReturnType<typeof buildChapterMetaPlan>['rows'],
): Promise<void> {
  const byKey = new Map(
    our.map((c) => [chapterKey(c.ref.subject, c.ref.chapter), c.topicId]),
  );
  const existing = new Map(
    (await metaRepo.find()).map((row) => [row.topicId, row]),
  );
  let inserted = 0;
  let updated = 0;
  let adminSkipped = 0;
  for (const row of rows) {
    const topicId = byKey.get(chapterKey(row.subject, row.chapter));
    if (!topicId) {
      throw new Error(
        `Resolved chapter missing for ${row.subject}|${row.chapter}`,
      );
    }
    const current = existing.get(topicId);
    if (current && current.source === ChapterMetaSource.ADMIN) {
      adminSkipped += 1;
      continue;
    }
    const entity: Partial<ChapterMeta> = {
      topicId,
      unit: row.unit,
      classLevel: row.classLevel,
      overview: row.overview,
      objectives: row.objectives,
      keyFormulas: row.keyFormulas,
      difficulty: row.difficulty,
      studyMinutes: row.studyMinutes,
      source: row.source,
      status: row.status,
    };
    if (current) {
      // jeeWeightageNote intentionally absent: admin-owned, never overwritten.
      metaRepo.merge(current, entity);
      await metaRepo.save(current);
      updated += 1;
    } else {
      await metaRepo.save(metaRepo.create(entity));
      inserted += 1;
    }
  }
  console.log(
    `\n[seed] inserted ${inserted}, updated ${updated}, ` +
      `admin-owned rows left untouched ${adminSkipped}.`,
  );
}

function printPlan(
  report: ReturnType<typeof buildChapterMetaPlan>['report'],
): void {
  console.log('\n===== chapter_meta dry-run report =====');
  console.log(
    `[planned] ${report.planned} rows: ${report.fromCompass} from compass ` +
      `(COMPASS_IMPORT/PUBLISHED), ${report.authored} hand drafts ` +
      `(AI_DRAFT/DRAFT), ${report.unitOnly.length} unit-only (AI_DRAFT/DRAFT).`,
  );

  if (report.mergedTargets.length > 0) {
    console.log('\n[merged] compass chapters folded into one of ours:');
    for (const m of report.mergedTargets) {
      console.log(`  ${m.target}  <- ${m.sources.join(', ')}`);
    }
  }

  console.log('\n[unmapped compass] skipped as CBSE-only (not JEE Main):');
  for (const s of report.skippedCompass) console.log(`  ${s}`);

  if (report.unitOnly.length > 0) {
    console.log('\n[our chapters without metadata after authored drafts]:');
    for (const u of report.unitOnly) console.log(`  ${u}`);
  }

  if (report.errors.length > 0) {
    console.error(`\n[ERRORS] ${report.errors.length} integrity problem(s):`);
    for (const e of report.errors) console.error(`  ${e}`);
  } else {
    console.log('\n[integrity] no errors.');
  }
}

async function main(): Promise<void> {
  const ds: DataSource = dataSource;
  await ds.initialize();
  try {
    const our = await loadOurChapters(ds.getRepository(Topic));
    console.log(
      `[seed-chapter-meta] ${DRY_RUN ? 'DRY RUN' : 'SEED'} — ` +
        `${our.length} chapter topics found, ` +
        `${COMPASS_CHAPTERS.length} compass chapters loaded.`,
    );

    const { rows, report } = buildChapterMetaPlan({
      ourChapters: our.map((c) => c.ref),
      compass: COMPASS_CHAPTERS,
      compassMap: COMPASS_CHAPTER_MAP,
      units: CHAPTER_UNITS,
      classLevels: CHAPTER_CLASS_LEVELS,
      authored: AUTHORED_CHAPTER_META,
    });
    printPlan(report);
    if (report.errors.length > 0) {
      console.error(
        '\n[aborted] fix the integrity errors above; nothing written.',
      );
      process.exitCode = 1;
      return;
    }
    if (report.planned !== our.length) {
      console.error(
        `\n[aborted] plan rows (${report.planned}) != chapter topics (${our.length}).`,
      );
      process.exitCode = 1;
      return;
    }

    if (DRY_RUN) {
      const compassRows = new Map<string, CompassChapter[]>();
      for (const chapter of COMPASS_CHAPTERS) {
        const target = COMPASS_CHAPTER_MAP[compassId(chapter)];
        if (!target) continue;
        const key = chapterKey(target.subject, target.chapter);
        compassRows.set(key, [...(compassRows.get(key) ?? []), chapter]);
      }
      printDryRunReport(our, compassRows);
      console.log(
        '\n[dry run] nothing written. Re-run without --dry-run to seed.',
      );
      return;
    }

    await persist(ds.getRepository(ChapterMeta), our, rows);
    console.log('[done] chapter_meta seeded.');
  } finally {
    await ds.destroy();
  }
}

void main().catch((error) => {
  console.error('seed-chapter-meta failed:', error);
  process.exitCode = 1;
});
