import { Injectable, Logger } from '@nestjs/common';
import { embedText } from './embedding.util';

/**
 * Thin injectable wrapper around the local embedding model so it can be provided
 * and mocked through NestJS dependency injection.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  async embed(text: string): Promise<number[]> {
    const vector = await embedText(text);
    this.logger.debug(`Embedded "${text}" into a ${vector.length}-dim vector.`);
    return vector;
  }
}
