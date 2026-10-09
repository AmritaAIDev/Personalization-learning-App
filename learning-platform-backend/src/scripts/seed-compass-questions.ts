import type { DataSource } from 'typeorm';
import {
  Question,
  QuestionPublicationStatus,
  QuestionSource,
} from '../question.entity';
import { COMPASS_PHYSICS_CH1_QUESTIONS } from './content/compass-questions';
import {
  COMPASS_QUESTION_TARGET,
  planCompassQuestions,
  summarizePlan,
  type PlannedQuestion,
} from './compass-questions.plan';

/**
 * Imports the jee-compass Physics Chapter 1 question bank as DRAFT questions
 * for an admin to review in Content; nothing here ever reaches a student.
 *
 *   npm run seed:compass-questions:dry   # report only (works without a DB)
 *   npm run seed:compass-questions       # write the drafts
 *
 * Idempotent: each draft has a deterministic `question_id`. Re-running
 * refreshes drafts nobody has touched, and leaves alone anything an admin has
 * reviewed, edited, published or archived.
 */

type Outcome = 'inserted' | 'refreshed' | 'left alone';

function printMap(title: string, map: Record<string, number>) {
  console.log(`  ${title}:`);
  for (const [key, count] of Object.entries(map).sort()) {
    console.log(`    ${key.padEnd(34)} ${count}`);
  }
}

function toEntity(row: PlannedQuestion): Partial<Question> {
  const { answerPosition: _answerPosition, ...fields } = row;
  void _answerPosition;
  return {
    ...fields,
    subtopic: null,
    common_errors: [],
    status: QuestionPublicationStatus.DRAFT,
    source: QuestionSource.CURATED,
    created_by_user_id: null,
  };
}

async function upsert(
  dataSource: DataSource,
  row: PlannedQuestion,
): Promise<Outcome> {
  const repo = dataSource.getRepository(Question);
  const existing = await repo.findOne({
    where: { question_id: row.question_id },
  });
  if (!existing) {
    await repo.save(repo.create(toEntity(row)));
    return 'inserted';
  }
  const untouched =
    existing.status === QuestionPublicationStatus.DRAFT &&
    existing.reviewed_by_user_id === null &&
    existing.reviewed_at === null;
  if (!untouched) return 'left alone';
  await repo.save(repo.merge(existing, toEntity(row)));
  return 'refreshed';
}

async function connect(required: boolean): Promise<DataSource | null> {
  try {
    // Loaded lazily (so a dry run works with no DATABASE_URL): the data source
    // module throws at import time when the variable is missing. A dynamic
    // import() would need a file extension under this tsconfig, so use require.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('../database/data-source') as {
      default: DataSource;
    };
    const dataSource = loaded.default;
    return dataSource.isInitialized
      ? dataSource
      : await dataSource.initialize();
  } catch (error) {
    if (required) throw error;
    console.log(
      `\n(database not reachable, skipping DB checks: ${error instanceof Error ? error.message : String(error)})`,
    );
    return null;
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const plan = planCompassQuestions(COMPASS_PHYSICS_CH1_QUESTIONS);
  const summary = summarizePlan(plan.rows);

  console.log(
    `Compass questions: ${COMPASS_PHYSICS_CH1_QUESTIONS.length} in source, ` +
      `${plan.rows.length} importable, ${plan.skipped.length} skipped.`,
  );
  console.log(
    `Target: ${COMPASS_QUESTION_TARGET.subject} / ${COMPASS_QUESTION_TARGET.chapter} (status DRAFT, source CURATED)`,
  );
  for (const skipped of plan.skipped) {
    console.log(`  skipped ${skipped.id}: ${skipped.reason}`);
  }
  printMap('by topic', summary.byTopic);
  printMap('by Bloom level', summary.byBloom);
  printMap('by difficulty', summary.byDifficulty);
  console.log(
    `  correct-answer position (A/B/C/D): ${summary.byAnswerPosition.join(' / ')}`,
  );
  console.log(`  below quality 80 (review closely): ${summary.lowQuality}`);

  const dataSource = await connect(!dryRun);
  if (dataSource) {
    const repo = dataSource.getRepository(Question);
    const existingTopics: Array<{ topic: string; count: string }> = await repo
      .createQueryBuilder('q')
      .select('q.topic', 'topic')
      .addSelect('COUNT(*)', 'count')
      .where(
        'q.subject = :subject AND q.chapter = :chapter',
        COMPASS_QUESTION_TARGET,
      )
      .groupBy('q.topic')
      .getRawMany();
    const known = new Map(
      existingTopics.map((t) => [t.topic, Number(t.count)]),
    );
    console.log(
      `\nQuestions already under ${COMPASS_QUESTION_TARGET.chapter}: ` +
        `${[...known.values()].reduce((a, b) => a + b, 0)}`,
    );
    console.log(
      'Topic names (existing = already has questions; new = admin may want to retag):',
    );
    for (const topic of Object.keys(summary.byTopic).sort()) {
      console.log(
        `    ${topic.padEnd(34)} ${known.has(topic) ? `existing (${known.get(topic)})` : 'NEW'}`,
      );
    }
  }

  if (dryRun) {
    console.log('\n[dry run] nothing written.');
  } else if (dataSource) {
    const outcomes: Record<Outcome, number> = {
      inserted: 0,
      refreshed: 0,
      'left alone': 0,
    };
    for (const row of plan.rows) outcomes[await upsert(dataSource, row)] += 1;
    console.log(
      `\nDone: ${outcomes.inserted} inserted, ${outcomes.refreshed} refreshed, ` +
        `${outcomes['left alone']} left alone (already reviewed or published). ` +
        'Review them under Content > drafts before publishing.',
    );
  }
  if (dataSource?.isInitialized) await dataSource.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
