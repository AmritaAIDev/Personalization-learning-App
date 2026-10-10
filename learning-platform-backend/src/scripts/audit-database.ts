/**
 * Database audit — read-only schema and data-quality review.
 *
 * Reports structural gaps (unindexed FKs, missing constraints, naming
 * drift) and data-integrity violations (out-of-range values, orphans,
 * stale states) against whatever DATABASE_URL points at. Safe to run on
 * production: every query is a SELECT.
 *
 * Usage:  npm run audit:database            (prints findings)
 *         npm run audit:database -- --strict (exit 1 on CRITICAL)
 *
 * Severity contract:
 *   CRITICAL  data corruption or missing referential integrity in live use
 *   WARNING   structural gap that should be fixed by a corrective migration
 *   INFO      convention/consistency notes, no action required now
 */
import dataSource from '../database/data-source';

interface Finding {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  code: string;
  message: string;
}

const findings: Finding[] = [];
const add = (severity: Finding['severity'], code: string, message: string) =>
  findings.push({ severity, code, message });

async function rows(
  sql: string,
  params?: unknown[],
): Promise<Record<string, string>[]> {
  return dataSource.query(sql, params);
}

async function auditSchemaShape(): Promise<void> {
  // S1: FK child columns without a supporting index (Postgres does not
  // index FKs automatically; unindexed FKs lock parent rows on delete).
  const unindexedFks = await rows(`
    SELECT c.conname, ns.nspname || '.' || cl.relname AS table_name,
           a.attname AS column_name
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid
       AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f' AND ns.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = c.conrelid
          AND i.indkey::int[] @> ARRAY[a.attnum::int]
      )
  `);
  for (const row of unindexedFks) {
    add(
      'WARNING',
      'S1.unindexed-fk',
      `${row.table_name}.${row.column_name} (constraint ${row.conname})`,
    );
  }

  // S7: *_id columns without a foreign key (missing referential integrity).
  const fkColumns = new Set(
    (
      await rows(`
        SELECT cl.relname || '.' || a.attname AS key
        FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.contype = 'f'
      `)
    ).map((r) => String(r.key)),
  );
  const pkColumns = new Set(
    (
      await rows(`
        SELECT cl.relname || '.' || a.attname AS key
        FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.contype = 'p'
      `)
    ).map((r) => String(r.key)),
  );
  const idColumns = await rows(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'uuid'
      AND column_name LIKE '%\\_id'
  `);
  for (const col of idColumns) {
    const key = `${col.table_name}.${col.column_name}`;
    if (!fkColumns.has(key) && !pkColumns.has(key)) {
      add('WARNING', 'S7.fk-less-uuid', key);
    }
  }

  // S4: quoted camelCase columns (mixed naming conventions).
  const camel = await rows(`
    SELECT cl.relname AS table_name, a.attname AS column_name
    FROM pg_attribute a
    JOIN pg_class cl ON cl.oid = a.attrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public' AND a.attnum > 0 AND NOT a.attisdropped
      AND a.attname ~ '[a-z][A-Z]'
  `);
  for (const col of camel) {
    add('INFO', 'S4.camel-column', `${col.table_name}.${col.column_name}`);
  }

  // S2: tables without audit timestamps.
  const noTimestamps = await rows(`
    SELECT cl.relname AS table_name
    FROM pg_class cl
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public' AND cl.relkind = 'r'
      AND NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        WHERE a.attrelid = cl.oid AND a.attname = 'created_at'
      )
      AND NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        WHERE a.attrelid = cl.oid AND a.attname = 'createdAt'
      )
  `);
  for (const row of noTimestamps) {
    add('INFO', 'S2.no-created-at', String(row.table_name));
  }

  // S3: status/role-like columns stored as plain varchar, not enums.
  const varchars = await rows(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type = 'character varying'
      AND (column_name ~ '(status|role|state)$' OR column_name ~ '_(status|role)$')
  `);
  for (const col of varchars) {
    add('INFO', 'S3.varchar-status', `${col.table_name}.${col.column_name}`);
  }
}

async function auditData(): Promise<void> {
  const table = async (name: string): Promise<boolean> => {
    const r = await rows(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
      [name],
    );
    return r.length > 0;
  };

  if (await table('skill_mastery')) {
    const bad = await rows(
      'SELECT count(*)::int AS n FROM skill_mastery WHERE p_know < 0 OR p_know > 1',
    );
    if (Number(bad[0].n) > 0)
      add('CRITICAL', 'D1.pknow-range', `${bad[0].n} rows outside [0,1]`);
    const dup = await rows(`
      SELECT count(*)::int AS n FROM (
        SELECT user_id, subject, chapter, topic, count(*) c
        FROM skill_mastery GROUP BY 1,2,3,4 HAVING count(*) > 1) d
    `);
    if (Number(dup[0].n) > 0)
      add(
        'CRITICAL',
        'D1.duplicate-skill',
        `${dup[0].n} duplicated skill keys`,
      );
  }

  if (await table('users')) {
    const neg = await rows(
      'SELECT count(*)::int AS n FROM users WHERE xp < 0 OR streak < 0 OR "level" < 1',
    );
    if (Number(neg[0].n) > 0)
      add(
        'CRITICAL',
        'D2.negative-growth',
        `${neg[0].n} users with negative xp/streak/level`,
      );
    const blank = await rows(
      "SELECT count(*)::int AS n FROM users WHERE btrim(name) = ''",
    );
    if (Number(blank[0].n) > 0)
      add(
        'WARNING',
        'D3.blank-name',
        `${blank[0].n} users with empty display name`,
      );
  }

  if (await table('doubts')) {
    const blank = await rows(
      "SELECT count(*)::int AS n FROM doubts WHERE btrim(message) = ''",
    );
    if (Number(blank[0].n) > 0)
      add('CRITICAL', 'D3.blank-doubt', `${blank[0].n} empty doubt messages`);
    const stale = await rows(
      "SELECT count(*)::int AS n FROM doubts WHERE status = 'OPEN' AND created_at < now() - interval '24 hours'",
    );
    if (Number(stale[0].n) > 0)
      add(
        'WARNING',
        'D5.stale-open-doubts',
        `${stale[0].n} OPEN doubts older than 24h`,
      );
  }

  if (await table('topics')) {
    const dup = await rows(`
      SELECT count(*)::int AS n FROM (
        SELECT name, level, parent_id
        FROM topics GROUP BY name, level, parent_id HAVING count(*) > 1) d
    `);
    if (Number(dup[0].n) > 0)
      add(
        'WARNING',
        'D6.duplicate-topics',
        `${dup[0].n} duplicated topic nodes (name+level+parent)`,
      );
  }

  // D4: future timestamps on core tables (clock or write-path bug).
  for (const name of ['doubts', 'practice_attempts', 'learning_sessions']) {
    if (!(await table(name))) continue;
    const col = (
      await rows(
        `SELECT column_name FROM information_schema.columns
       WHERE table_name=$1 AND column_name IN ('created_at','createdAt','started_at')`,
        [name],
      )
    )[0];
    if (!col) continue;
    const column = String(col.column_name);
    const future = await rows(
      `SELECT count(*)::int AS n FROM ${name} WHERE "${column}" > now() + interval '1 hour'`,
    );
    if (Number(future[0].n) > 0)
      add(
        'WARNING',
        'D4.future-timestamp',
        `${name}: ${future[0].n} rows more than 1h in the future`,
      );
  }
}

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    await auditSchemaShape();
    await auditData();
  } finally {
    await dataSource.destroy();
  }

  const order = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const;
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  const counts = {
    CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
    WARNING: findings.filter((f) => f.severity === 'WARNING').length,
    INFO: findings.filter((f) => f.severity === 'INFO').length,
  };

  console.log(
    `\n===== database audit (${process.env.DATABASE_URL?.includes('neon') ? 'neon' : 'local'}) =====`,
  );
  if (findings.length === 0) console.log('clean — no findings');
  for (const f of findings) {
    console.log(`[${f.severity}] ${f.code}: ${f.message}`);
  }
  console.log(
    `\n${counts.CRITICAL} critical / ${counts.WARNING} warnings / ${counts.INFO} info`,
  );
  if (process.argv.includes('--strict') && counts.CRITICAL > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  const err = error as { message?: string; query?: string };
  console.error('database audit failed to run:', err?.message);
  if (err?.query) console.error('failing query:', err.query.slice(0, 300));
  process.exitCode = 1;
});
