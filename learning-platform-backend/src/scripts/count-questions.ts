import 'dotenv/config';
import AppDataSource from '../database/data-source';

async function main() {
  await AppDataSource.initialize();
  const rows = await AppDataSource.query(`
    SELECT chapter, topic, COUNT(*)::int AS n
    FROM questions
    WHERE status = 'PUBLISHED' AND subject = 'Physics'
    GROUP BY chapter, topic
    ORDER BY chapter, topic
  `);
  for (const r of rows)
    console.log(`CHAPTER=[${r.chapter}] TOPIC=[${r.topic}] total=${r.n}`);
  await AppDataSource.destroy();
}
void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
