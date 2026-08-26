import { Injectable, Logger } from '@nestjs/common';
import { embedText } from './embedding.util';

/**
 * Thin injectable wrapper around the local embedding model so it can be provided
 * and mocked through NestJS dependency injection.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly embedCache = new Map<string, number[]>();

  async embed(text: string): Promise<number[]> {
    const cached = this.embedCache.get(text);
    if (cached) {
      this.logger.debug(`Embed cache hit for "${text}".`);
      return cached;
    }
    const vector = await embedText(text);
    this.embedCache.set(text, vector);
    // Keep cache bounded: evict oldest when over 200 entries.
    if (this.embedCache.size > 200) {
      const firstKey = this.embedCache.keys().next().value;
      if (firstKey !== undefined) {
        this.embedCache.delete(firstKey);
      }
    }
    this.logger.debug(`Embedded "${text}" into a ${vector.length}-dim vector.`);
    return vector;
  }
}
