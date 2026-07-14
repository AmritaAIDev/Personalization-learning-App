import { pipeline } from '@xenova/transformers';

/**
 * Real local text embeddings using the `all-MiniLM-L6-v2` sentence-transformer.
 *
 * This runs entirely on-device (no external API, no HuggingFace Inference call),
 * and produces 384-dimensional vectors that exactly match the size of the
 * `learning_concepts` Qdrant collection. The model (~90MB) is downloaded once
 * from the HuggingFace CDN and cached locally for subsequent runs.
 *
 * The same helper is used by both the NestJS AgentService (query side) and the
 * Qdrant seed scripts (index side) so that queries and stored vectors live in the
 * same embedding space — a hard requirement for semantic search to work at all.
 */
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_DIM = 384;

type FeatureExtractor = (
  text: string,
  options?: { pooling?: 'mean' | 'cls' | 'none'; normalize?: boolean },
) => Promise<{ data: ArrayLike<number> }>;

let extractorPromise: Promise<FeatureExtractor> | null = null;

function getExtractor(): Promise<FeatureExtractor> {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      'feature-extraction',
      EMBEDDING_MODEL,
    ) as unknown as Promise<FeatureExtractor>;
  }
  return extractorPromise;
}

/**
 * Embed a piece of text into a normalized 384-dim vector suitable for cosine search.
 */
export async function embedText(text: string): Promise<number[]> {
  const trimmed = text?.trim();
  if (!trimmed) {
    throw new Error('Cannot embed empty text.');
  }
  const extractor = await getExtractor();
  const output = await extractor(trimmed, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
