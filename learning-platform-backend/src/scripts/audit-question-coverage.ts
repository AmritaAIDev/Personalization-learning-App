/**
 * Audits adaptive question supply across the whole catalogue.
 *
 * The `/api/learning/coverage` endpoint answers this one topic at a time, which
 * is fine for a spot check but cannot tell you whether the platform is ready to
 * open to learners. This walks every (subject, chapter, topic) that has any
 * content at all and reports which of the 12 adaptive coordinates cannot fill a
 * five-question session from curated plus AI-pool supply.
 *
 * Read-only: it issues no writes and is safe to point at production.
 *
 *   DATABASE_URL=... npm run audit:coverage
 *   DATABASE_URL=... npm run audit:coverage -- --json
 *   DATABASE_URL=... npm run audit:coverage -- --subject Physics
 */
import dataSource from '../database/data-source';
import {
  LEARNING_COORDINATES,
  LEARNING_LEVEL_COUNT,
  LEARNING_QUESTIONS_PER_SESSION,
  bloomLevelAliases,
} from '../adaptive/adaptive.types';

interface CoordinateSupply {
  level: number;
  bloomLevel: string;
  difficulty: string;
  curated: number;
  generated: number;
  total: number;
  ready: boolean;
}

interface TopicReport {
  subject: string;
  chapter: string;
  topic: string;
  totalQuestions: number;
  readyCoordinates: number;
  firstGapLevel: number | null;
  coordinates: CoordinateSupply[];
}

function parseArgs(argv: string[]): { json: boolean; subject?: string } {
  const subjectIndex = argv.indexOf('--subject');
  return {
    json: argv.includes('--json'),
    subject: subjectIndex >= 0 ? argv[subjectIndex + 1] : undefined,
  };
}

async function loadScopes(
  subject: string | undefined,
): Promise<Array<{ subject: string; chapter: string; topic: string }>> {
  const params: string[] = [];
  let filter = '';
  if (subject) {
    params.push(subject);
    filter = 'WHERE subject = $1';
  }
  return dataSource.query(
    `SELECT DISTINCT subject, chapter, topic
       FROM questions ${filter}
      ORDER BY subject, chapter, topic`,
    params,
  );
}

async function supplyFor(scope: {
  subject: string;
  chapter: string;
  topic: string;
}): Promise<CoordinateSupply[]> {
  const supplies: CoordinateSupply[] = [];
  for (const coordinate of LEARNING_COORDINATES) {
    const aliases = bloomLevelAliases(coordinate.bloomLevel);
    const [curatedRow] = await dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*)::text AS count FROM questions
        WHERE subject = $1 AND chapter = $2 AND topic = $3
          AND bloom_level = ANY($4) AND difficulty = $5
          AND status = 'PUBLISHED'`,
      [
        scope.subject,
        scope.chapter,
        scope.topic,
        aliases,
        coordinate.difficulty,
      ],
    );
    const [generatedRow] = await dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*)::text AS count FROM learning_generated_questions
        WHERE subject = $1 AND chapter = $2 AND topic = $3
          AND bloom_level = ANY($4) AND difficulty = $5
          AND status = 'READY'`,
      [
        scope.subject,
        scope.chapter,
        scope.topic,
        aliases,
        coordinate.difficulty,
      ],
    );
    const curated = Number(curatedRow?.count ?? 0);
    const generated = Number(generatedRow?.count ?? 0);
    const total = curated + generated;
    supplies.push({
      level: coordinate.level,
      bloomLevel: coordinate.bloomLevel,
      difficulty: coordinate.difficulty,
      curated,
      generated,
      total,
      ready: total >= LEARNING_QUESTIONS_PER_SESSION,
    });
  }
  return supplies;
}

function renderTable(reports: TopicReport[]): void {
  const width = Math.max(
    ...reports.map((report) => `${report.subject} > ${report.topic}`.length),
    20,
  );
  console.log(
    `\n${'TOPIC'.padEnd(width)}  QNS  READY  ${LEARNING_COORDINATES.map(
      (coordinate) => `L${coordinate.level}`.padStart(3),
    ).join('')}`,
  );
  console.log('-'.repeat(width + 8 + LEARNING_LEVEL_COUNT * 3 + 8));
  for (const report of reports) {
    const label = `${report.subject} > ${report.topic}`.padEnd(width);
    const cells = report.coordinates
      .map((coordinate) =>
        String(coordinate.total > 99 ? 99 : coordinate.total).padStart(3),
      )
      .join('');
    console.log(
      `${label}  ${String(report.totalQuestions).padStart(3)}  ` +
        `${String(report.readyCoordinates).padStart(2)}/${LEARNING_LEVEL_COUNT}  ${cells}`,
    );
  }
}

async function main(): Promise<void> {
  const { json, subject } = parseArgs(process.argv.slice(2));
  await dataSource.initialize();
  try {
    const scopes = await loadScopes(subject);
    const reports: TopicReport[] = [];
    for (const scope of scopes) {
      const coordinates = await supplyFor(scope);
      const readyCoordinates = coordinates.filter(
        (coordinate) => coordinate.ready,
      ).length;
      const firstGap = coordinates.find((coordinate) => !coordinate.ready);
      reports.push({
        ...scope,
        totalQuestions: coordinates.reduce(
          (sum, coordinate) => sum + coordinate.total,
          0,
        ),
        readyCoordinates,
        firstGapLevel: firstGap?.level ?? null,
        coordinates,
      });
    }

    if (json) {
      console.log(JSON.stringify(reports, null, 2));
      return;
    }

    if (reports.length === 0) {
      console.log('No questions found. The catalogue is empty.');
      process.exitCode = 1;
      return;
    }

    renderTable(reports);

    const fullyReady = reports.filter(
      (report) => report.readyCoordinates === LEARNING_LEVEL_COUNT,
    );
    // A learner starts at Level 1 and can only reach the level above the first
    // gap, so a topic whose Level 1 cannot fill a session is unusable on day one.
    const blockedAtEntry = reports.filter(
      (report) => report.firstGapLevel === 1,
    );

    console.log(
      `\n${reports.length} topic(s) audited. ` +
        `${fullyReady.length} cover all ${LEARNING_LEVEL_COUNT} coordinates. ` +
        `${blockedAtEntry.length} cannot fill a Level 1 session.`,
    );
    console.log(
      `Each coordinate needs ${LEARNING_QUESTIONS_PER_SESSION} questions, so a ` +
        `fully covered topic needs ${
          LEARNING_QUESTIONS_PER_SESSION * LEARNING_LEVEL_COUNT
        }.`,
    );

    if (blockedAtEntry.length > 0) {
      console.log('\nTopics that cannot start at Level 1:');
      for (const report of blockedAtEntry) {
        console.log(
          `  - ${report.subject} > ${report.chapter} > ${report.topic}`,
        );
      }
    }

    const incomplete = reports.filter(
      (report) => report.readyCoordinates < LEARNING_LEVEL_COUNT,
    );
    if (incomplete.length > 0) {
      // Non-zero exit so this can gate a release once the catalogue is filled.
      process.exitCode = 1;
    }
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error) => {
  console.error('Coverage audit failed:', error);
  process.exitCode = 1;
});
