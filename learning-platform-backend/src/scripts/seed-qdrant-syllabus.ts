import { QdrantClient } from '@qdrant/js-client-rest';
import { createHash } from 'node:crypto';
import * as dotenv from 'dotenv';
import { NEW_CHAPTERS } from './content';
import { EMBEDDING_DIM, embedText } from '../agent/embedding.util';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION ?? 'learning_concepts';

/**
 * Deterministic UUID v5 (RFC 4122) from a string key — same input always
 * yields the same point ID, so re-running is idempotent and never creates
 * duplicates. Uses the URL namespace as the base.
 */
const UUID_NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

function uuidV5(name: string): string {
  const ns = Buffer.from(UUID_NAMESPACE_URL.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(ns).update(name, 'utf8').digest();
  // Set version = 5
  hash[6] = (hash[6] & 0x0f) | 0x50;
  // Set variant = RFC 4122
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function ensureCollection(client: QdrantClient): Promise<void> {
  const collections = await client.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === COLLECTION_NAME,
  );
  if (exists) return;
  console.log(
    `Creating Qdrant collection ${COLLECTION_NAME} (dim=${EMBEDDING_DIM}, Cosine)...`,
  );
  await client.createCollection(COLLECTION_NAME, {
    vectors: { size: EMBEDDING_DIM, distance: 'Cosine' },
  });
}

async function main() {
  if (!QDRANT_URL || !QDRANT_API_KEY) {
    console.error(
      'Missing QDRANT_URL or QDRANT_API_KEY in environment. Set them in .env or learning-platform-backend/.env',
    );
    process.exit(1);
  }

  const client = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY });
  await ensureCollection(client);

  console.log(
    'Loading local embedding model (all-MiniLM-L6-v2) — first run downloads ~90MB...',
  );
  // Warm the model once before looping so progress is clear.
  await embedText('warmup probe for jee syllabus seeding');

  let totalConcepts = 0;
  let upserted = 0;

  for (const chapter of NEW_CHAPTERS) {
    for (const sub of chapter.subtopics) {
      for (const concept of sub.concepts ?? []) {
        totalConcepts += 1;
        const pointId = uuidV5(
          `${chapter.subject}|${chapter.chapter}|${sub.name}|${concept.title}`,
        );
        const textToEmbed = `${concept.title}\n\n${concept.content}`;
        let vector: number[];
        try {
          vector = await embedText(textToEmbed);
        } catch (error) {
          console.error(`Failed to embed concept "${concept.title}":`, error);
          continue;
        }

        await client.upsert(COLLECTION_NAME, {
          wait: true,
          points: [
            {
              id: pointId,
              vector,
              payload: {
                subject: chapter.subject,
                chapter: chapter.chapter,
                topic: sub.name,
                concept: concept.title,
                title: concept.title,
                content: concept.content,
                text: textToEmbed,
              },
            },
          ],
        });
        upserted += 1;
        if (upserted % 20 === 0) {
          console.log(
            `  ...upserted ${upserted}/${totalConcepts} concepts so far`,
          );
        }
      }
    }
  }

  console.log(
    `Qdrant syllabus seed complete: ${upserted}/${totalConcepts} concept chunks upserted into ${COLLECTION_NAME}.`,
  );

  // Quick verification: count points in collection
  try {
    const info = await client.getCollection(COLLECTION_NAME);
    console.log(
      `Collection now holds ~${(info as unknown as { points_count?: number }).points_count ?? 'unknown'} points.`,
    );
  } catch {
    // non-fatal
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
