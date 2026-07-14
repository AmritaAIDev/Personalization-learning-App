import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../topics/topic.entity';
import { EmbeddingService } from './embedding.service';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface GeneratedQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly openai: OpenAI;
  private readonly qdrantClient: QdrantClient;
  private readonly collectionName = 'learning_concepts';

  constructor(
    private readonly configService: ConfigService,
    @Inject(EmbeddingService)
    private readonly embeddingService: EmbeddingService,
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
  ) {
    const deepseekKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (!deepseekKey) {
      this.logger.warn(
        'DEEPSEEK_API_KEY is not set; question generation will fail until it is configured.',
      );
    }

    this.openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: deepseekKey ?? '',
    });

    this.qdrantClient = new QdrantClient({
      url: this.configService.get<string>('QDRANT_URL'),
      apiKey: this.configService.get<string>('QDRANT_API_KEY'),
    });
  }

  /**
   * The frontend sends a topic *id* (UUID). Turn it into the human-readable topic
   * name so it can be embedded and fed to the LLM. If a plain name is passed
   * (e.g. from a script or test), it is used as-is.
   */
  private async resolveTopicName(topic: string): Promise<string> {
    if (UUID_REGEX.test(topic)) {
      const found = await this.topicsRepository.findOne({
        where: { id: topic },
      });
      if (found) {
        return found.name;
      }
      this.logger.warn(`No topic found for id ${topic}; using the raw value.`);
    }
    return topic;
  }

  /**
   * Retrieve the most relevant textbook chunks from Qdrant using a real semantic
   * embedding of the topic. Throws if the vector DB is unreachable so the caller
   * can surface a real error instead of hallucinating from empty context.
   */
  async retrieveContextFromQdrant(topicName: string): Promise<string> {
    this.logger.log(`Retrieving Qdrant context for: ${topicName}`);
    const queryVector = await this.embeddingService.embed(topicName);

    const searchResult = await this.qdrantClient.search(this.collectionName, {
      vector: queryVector,
      limit: 3,
      with_payload: true,
    });

    return searchResult
      .map((res) => res.payload?.text)
      .filter((text): text is string => typeof text === 'string')
      .join('\n\n');
  }

  /**
   * Generate a grounded JEE question for the given topic via retrieval-augmented
   * generation. Every failure mode (missing config, empty context, LLM error,
   * malformed output) raises an explicit error — there is no fake fallback data.
   */
  async generateDynamicQuestion(topic: string): Promise<GeneratedQuestion> {
    if (!topic?.trim()) {
      throw new ServiceUnavailableException(
        'A topic is required to generate a question.',
      );
    }

    if (!this.configService.get<string>('DEEPSEEK_API_KEY')) {
      throw new ServiceUnavailableException(
        'LLM is not configured (missing DEEPSEEK_API_KEY).',
      );
    }

    const topicName = await this.resolveTopicName(topic.trim());

    let contextText: string;
    try {
      contextText = await this.retrieveContextFromQdrant(topicName);
    } catch (error) {
      this.logger.error(
        `Qdrant retrieval failed for "${topicName}"`,
        error as Error,
      );
      throw new ServiceUnavailableException(
        'Failed to retrieve learning context from the vector database.',
      );
    }

    if (!contextText) {
      throw new ServiceUnavailableException(
        `No learning context found for "${topicName}". Seed the vector database first.`,
      );
    }

    const prompt = `
      You are an expert JEE Physics Professor.
      Based ONLY on the following textbook context, generate a high-quality, medium-difficulty multiple-choice Physics question about "${topicName}".

      CONTEXT:
      ${contextText}

      You must return your response STRICTLY as a JSON object matching this exact schema:
      {
        "question_text": "The actual physics question...",
        "options": ["A: ...", "B: ...", "C: ...", "D: ..."],
        "correct_answer": "B: ...",
        "explanation": "Step by step reasoning why B is correct..."
      }
    `;

    let raw: string;
    try {
      this.logger.log('Calling DeepSeek API...');
      const response = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a strict JSON-only API. You must return valid JSON without any markdown code blocks.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });
      raw = response.choices[0]?.message?.content ?? '';
    } catch (error) {
      this.logger.error('DeepSeek API call failed', error as Error);
      throw new ServiceUnavailableException(
        'The AI question generator is currently unavailable.',
      );
    }

    return this.parseQuestion(raw);
  }

  /** Validate the LLM output so malformed responses never reach the client. */
  private parseQuestion(raw: string): GeneratedQuestion {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new ServiceUnavailableException(
        'The AI returned a response that was not valid JSON.',
      );
    }

    const q = parsed as Partial<GeneratedQuestion>;
    const isValid =
      typeof q.question_text === 'string' &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      q.options.every((opt) => typeof opt === 'string') &&
      typeof q.correct_answer === 'string' &&
      typeof q.explanation === 'string';

    if (!isValid) {
      this.logger.error(`Malformed question from LLM: ${raw}`);
      throw new ServiceUnavailableException(
        'The AI returned a malformed question. Please try again.',
      );
    }

    return {
      question_text: q.question_text!,
      options: q.options!,
      correct_answer: q.correct_answer!,
      explanation: q.explanation!,
    };
  }
}
