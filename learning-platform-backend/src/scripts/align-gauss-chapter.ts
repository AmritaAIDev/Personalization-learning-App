import 'dotenv/config';
import AppDataSource from '../database/data-source';

/**
 * One-off data alignment: the bulk of the Gauss Law question bank was tagged
 * with chapter = 'Electrostatics' and a few with the apostrophe variant
 * "Gauss's Law". The frontend topic picker drives off the questions catalog,
 * so practice/learn look up questions by the exact (chapter, topic) the learner
 * selected. Consolidate everything onto the NCERT chapter
 * 'Electric Charges and Fields' and the canonical topic 'Gauss Law' so a
 * single catalog entry has a balanced Easy/Medium/Hard pool.
 */
async function main() {
  await AppDataSource.initialize();
  const r1 = await AppDataSource.query(
    `UPDATE questions SET chapter = 'Electric Charges and Fields'
     WHERE subject = 'Physics' AND chapter = 'Electrostatics'`,
  );
  const r2 = await AppDataSource.query(
    `UPDATE questions SET topic = 'Gauss Law'
     WHERE subject = 'Physics' AND chapter = 'Electric Charges and Fields'
       AND topic = 'Gauss''s Law'`,
  );
  console.log(
    'moved Electrostatics -> Electric Charges and Fields:',
    r1?.[1] ?? r1,
  );
  console.log("merged Gauss's Law -> Gauss Law:", r2?.[1] ?? r2);

  const rows = await AppDataSource.query(`
    SELECT difficulty, COUNT(*)::int AS n FROM questions
    WHERE status = 'PUBLISHED' AND subject = 'Physics'
      AND chapter = 'Electric Charges and Fields' AND topic = 'Gauss Law'
    GROUP BY difficulty ORDER BY difficulty
  `);
  for (const r of rows)
    console.log(
      `Gauss Law under Electric Charges and Fields -> ${r.difficulty}=${r.n}`,
    );
  await AppDataSource.destroy();
}
void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
