import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { NotebookMistakeCard } from './notebook.types';

/**
 * Isolated LLM boundary for the notebook (AGENTS.md §4): the only place that
 * talks to the model to synthesise concept-level summaries. It owns no state
 * and always degrades to a deterministic fallback, so the notebook never
 * blocks on the model being available.
 */
export interface ConceptSummaryResult {
  conceptLabel: string;
  misconceptionSummary: string;
  source: 'LLM' | 'FALLBACK';
}

export interface ConceptGroupInput {
  topic: string;
  chapter: string;
  subject: string;
  cards: NotebookMistakeCard[];
}

const SYSTEM_PROMPT =
  'You are a concise JEE physics/chemistry/maths tutor. You analyse a learner ' +
  'repeated wrong answers on one topic and name the single recurring conceptual ' +
  'gap. You must reply as a JSON object only. Use safe Markdown (no HTML).';

const MAX_LABEL_LENGTH = 80;
const MAX_SUMMARY_LENGTH = 240;

@Injectable()
export class NotebookConceptService {
  private readonly logger = new Logger(NotebookConceptService.name);
  private readonly model: OpenAI | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    this.model = apiKey
      ? new OpenAI({
          baseURL:
            this.configService.get<string>('DEEPSEEK_BASE_URL') ??
            'https://api.deepseek.com',
          apiKey,
          timeout: 20_000,
          maxRetries: 1,
        })
      : null;
  }

  /**
   * Produces a short concept label and a one-sentence recurring-gap summary.
   * Only groups with at least two mistakes are worth a model call; singletons
   * and any error path fall back to deterministic text.
   */
  async summariseGroup(
    group: ConceptGroupInput,
  ): Promise<ConceptSummaryResult> {
    if (!this.model || group.cards.length < 2) {
      return this.fallback(group);
    }
    try {
      const prompt = this.buildPrompt(group);
      const response = await this.model.chat.completions.create({
        model:
          this.configService.get<string>('DEEPSEEK_MODEL') ?? 'deepseek-chat',
        temperature: 0.3,
        max_tokens: 220,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('DeepSeek returned an empty response.');
      return this.parseResponse(content, group);
    } catch (error) {
      this.logger.warn(
        `Concept summary fell back for topic "${group.topic}": ${(error as Error).message}`,
      );
      return this.fallback(group);
    }
  }

  private buildPrompt(group: ConceptGroupInput): string {
    const samples = group.cards
      .slice(0, 6)
      .map(
        (card, index) =>
          `${index + 1}. Q: ${this.truncate(card.questionText, 200)}\n` +
          `   Chose: ${this.truncate(card.selectedOption ?? '—', 80)}\n` +
          `   Correct: ${this.truncate(card.correctOption, 80)}\n` +
          `   Gap: ${this.truncate(card.misconception, 160)}`,
      )
      .join('\n');
    return (
      `Topic: ${group.subject} → ${group.chapter} → ${group.topic}\n` +
      `Wrong answers on this topic:\n${samples}\n\n` +
      `Reply as JSON: {"label": "<= 8 word concept name>", ` +
      `"summary": "one sentence naming the recurring conceptual gap, " +
      "specific to these mistakes, <= 30 words"}.`
    );
  }

  private parseResponse(
    content: string,
    group: ConceptGroupInput,
  ): ConceptSummaryResult {
    try {
      const parsed = JSON.parse(content) as {
        label?: unknown;
        summary?: unknown;
      };
      const label =
        typeof parsed.label === 'string' && parsed.label.trim().length > 0
          ? this.truncate(parsed.label.trim(), MAX_LABEL_LENGTH)
          : group.topic;
      const summary =
        typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
          ? this.truncate(parsed.summary.trim(), MAX_SUMMARY_LENGTH)
          : this.deterministicSummary(group);
      return {
        conceptLabel: label,
        misconceptionSummary: summary,
        source: 'LLM',
      };
    } catch {
      return this.fallback(group);
    }
  }

  private fallback(group: ConceptGroupInput): ConceptSummaryResult {
    return {
      conceptLabel: group.topic,
      misconceptionSummary: this.deterministicSummary(group),
      source: 'FALLBACK',
    };
  }

  private deterministicSummary(group: ConceptGroupInput): string {
    const first = group.cards[0]?.misconception?.trim();
    if (first && first.length > 0)
      return this.truncate(first, MAX_SUMMARY_LENGTH);
    return `Review the core idea behind ${group.topic} and compare your reasoning with the worked solutions.`;
  }

  private truncate(value: string, limit: number): string {
    const clean = value.replace(/\s+/g, ' ').trim();
    return clean.length > limit
      ? `${clean.slice(0, limit - 1).trimEnd()}…`
      : clean;
  }
}
