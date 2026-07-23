/**
 * One-time data migration: rewrite legacy 5/6-level Bloom labels to the
 * four-level proficiency model across every table that stores bloom_level.
 *
 *   Remember                     -> Recall
 *   Understand                   -> Comprehension
 *   Apply                        -> Application
 *   Analyze/Analyse/Evaluate/Create -> Higher-Order
 *
 * Idempotent: already-migrated rows are left unchanged.
 */
import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const MAP = {
  Remember: 'Recall',
  Understand: 'Comprehension',
  Apply: 'Application',
  Analyze: 'Higher-Order',
  Analyse: 'Higher-Order',
  Evaluate: 'Higher-Order',
  Create: 'Higher-Order',
};

const TABLES = [
  'questions',
  'learning_sessions',
  'learning_generated_questions',
  'learning_generation_jobs',
];

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function columnExists(table) {
  const res = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'bloom_level' LIMIT 1`,
    [table],
  );
  return res.rowCount > 0;
}

async function main() {
  await client.connect();
  console.log('Connected. Running Bloom 4-level migration…\n');
  await client.query('BEGIN');
  try {
    for (const table of TABLES) {
      if (!(await columnExists(table))) {
        console.log(`- ${table}: no bloom_level column, skipped`);
        continue;
      }
      // Snapshot distribution before.
      const before = await client.query(
        `SELECT bloom_level, COUNT(*)::int AS n FROM ${table} GROUP BY bloom_level ORDER BY bloom_level`,
      );
      let updated = 0;
      for (const [from, to] of Object.entries(MAP)) {
        const res = await client.query(
          `UPDATE ${table} SET bloom_level = $1 WHERE bloom_level = $2`,
          [to, from],
        );
        updated += res.rowCount;
      }
      const after = await client.query(
        `SELECT bloom_level, COUNT(*)::int AS n FROM ${table} GROUP BY bloom_level ORDER BY bloom_level`,
      );
      console.log(`- ${table}: ${updated} row(s) updated`);
      console.log(
        `    before: ${before.rows.map((r) => `${r.bloom_level}=${r.n}`).join(', ') || '(empty)'}`,
      );
      console.log(
        `    after:  ${after.rows.map((r) => `${r.bloom_level}=${r.n}`).join(', ') || '(empty)'}`,
      );
    }
    await client.query('COMMIT');
    console.log('\n✅ Migration committed.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Rolled back:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

void main();
