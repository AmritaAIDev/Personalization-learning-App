/**
 * Fails when the migration history no longer produces the schema the entities
 * describe.
 *
 * TypeORM's own `schema:log` is too noisy to gate on: it always proposes
 * dropping and recreating foreign keys, check constraints, and indexes whose
 * names it did not generate itself, which every hand-written migration here
 * does. Those statements are cosmetic. What is never cosmetic is a table or
 * column that exists in one place and not the other -- that is the drift that
 * makes a deploy fail at runtime, so only those statements are treated as
 * errors.
 */
import dataSource from '../database/data-source';

/** Statements that mean an entity and the migrated schema genuinely disagree. */
const STRUCTURAL_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'table create', pattern: /^CREATE TABLE/i },
  { label: 'table drop', pattern: /^DROP TABLE/i },
  { label: 'column add', pattern: /^ALTER TABLE .+ ADD (COLUMN )?"/i },
  { label: 'column drop', pattern: /^ALTER TABLE .+ DROP COLUMN/i },
  { label: 'column alter', pattern: /^ALTER TABLE .+ ALTER COLUMN/i },
];

function isStructural(statement: string): string | null {
  const normalized = statement.trim();
  for (const { label, pattern } of STRUCTURAL_PATTERNS) {
    // `ADD CONSTRAINT` shares a prefix with `ADD COLUMN`; only the latter is drift.
    if (pattern.test(normalized) && !/ADD CONSTRAINT/i.test(normalized)) {
      return label;
    }
  }
  return null;
}

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    const pending = await dataSource.showMigrations();
    if (pending) {
      console.error(
        'Unapplied migrations found. Run `npm run migration:run` before checking drift.',
      );
      process.exitCode = 1;
      return;
    }

    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
    const statements = [...sqlInMemory.upQueries.map((query) => query.query)];

    const drift = statements
      .map((statement) => ({ statement, label: isStructural(statement) }))
      .filter((entry): entry is { statement: string; label: string } =>
        Boolean(entry.label),
      );

    if (drift.length > 0) {
      console.error(
        `Schema drift detected: the entities describe ${drift.length} structural ` +
          'change(s) that no migration performs.\n',
      );
      for (const { label, statement } of drift) {
        console.error(`  [${label}] ${statement}`);
      }
      console.error(
        '\nGenerate a migration for these changes before deploying.',
      );
      process.exitCode = 1;
      return;
    }

    console.log(
      `Schema is in sync: no structural drift across ${statements.length} ` +
        'candidate statement(s) (constraint/index naming differences ignored).',
    );
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error) => {
  console.error('Schema drift check failed to run:', error);
  process.exitCode = 1;
});
