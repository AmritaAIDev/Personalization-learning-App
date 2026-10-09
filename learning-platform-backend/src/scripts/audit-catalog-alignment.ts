import dataSource from '../database/data-source';
import {
  compareAlignment,
  type ChapterRef,
  type CountedChapter,
  type UnmatchedChapter,
} from '../catalog/catalog-alignment';

/**
 * Read-only check that the curriculum tree and the content agree on chapter
 * names. The Subjects screens join questions and learning state to the
 * `topics` tree by exact name, so a chapter tagged one way in the tree and
 * another way in the questions shows up empty. Safe to run against production
 * (it issues SELECTs only).
 *
 *   DATABASE_URL=... npm run audit:catalog
 *   DATABASE_URL=... npm run audit:catalog -- --json
 */
async function main(): Promise<void> {
  const json = process.argv.includes('--json');
  await dataSource.initialize();
  try {
    const treeChapters: ChapterRef[] = await dataSource.query(`
      SELECT s.name AS subject, c.name AS chapter
      FROM topics c JOIN topics s ON s.id = c.parent_id
      WHERE c.level = 'CHAPTER' AND s.level = 'SUBJECT'
      ORDER BY s.name, c.name`);
    const questionChapters: CountedChapter[] = await dataSource.query(`
        SELECT subject, chapter, COUNT(*)::int AS count
        FROM questions WHERE status = 'PUBLISHED'
        GROUP BY subject, chapter`);
    const stateChapters: CountedChapter[] = await dataSource.query(`
        SELECT subject, chapter, COUNT(*)::int AS count
        FROM learning_topic_states GROUP BY subject, chapter`);

    const report = compareAlignment({
      treeChapters,
      questionChapters,
      stateChapters,
    });
    if (json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log(
      `Tree chapters: ${treeChapters.length} | with published questions: ${report.aligned} | empty: ${report.emptyTreeChapters.length}`,
    );
    const print = (
      title: string,
      list: readonly UnmatchedChapter[],
      unit: string,
    ) => {
      console.log(`\n${title}: ${list.length}`);
      for (const item of list) {
        console.log(
          `  ${item.subject} / ${item.chapter}  (${item.count} ${unit})`,
        );
        if (item.aliasedTo) {
          console.log(
            `      handled: CHAPTER_ALIASES folds it into "${item.aliasedTo}"`,
          );
        } else if (item.candidates.length > 0) {
          console.log(
            `      NOT handled. Closest empty tree chapters: ${item.candidates.slice(0, 3).join(', ')}`,
          );
        } else {
          console.log('      NOT handled and no obvious tree chapter.');
        }
      }
    };
    print(
      'Question tags with no tree chapter',
      report.unmatchedQuestionChapters,
      'published questions',
    );
    print(
      'Learning states with no tree chapter',
      report.unmatchedStateChapters,
      'topic states',
    );

    console.log(
      `\nTree chapters with no published question (show as empty): ${report.emptyTreeChapters.length}`,
    );
    for (const ref of report.emptyTreeChapters) {
      console.log(`  ${ref.subject} / ${ref.chapter}`);
    }
    const unhandled = [
      ...report.unmatchedQuestionChapters,
      ...report.unmatchedStateChapters,
    ].filter((item) => item.aliasedTo === null);
    if (unhandled.length === 0) {
      console.log(
        '\nAll name mismatches are handled: every question and learning state ' +
          'reaches a tree chapter (directly or through CHAPTER_ALIASES).',
      );
    } else {
      console.log(
        `\n${unhandled.length} mismatch(es) are NOT handled and stay invisible on Subjects. ` +
          'Decide per case whether to add a CHAPTER_ALIASES entry ' +
          '(learning-platform-backend/src/catalog/catalog-aliases.ts) or rename the tag.',
      );
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
