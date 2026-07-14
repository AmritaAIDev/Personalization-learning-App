import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Question } from './question.entity';

export interface QuestionFilters {
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  bloom_level?: string;
}

/**
 * Serves the curated, human-authored question bank stored in PostgreSQL.
 *
 * This is distinct from the LLM path in AgentService: these questions are
 * pre-tagged with Bloom level and difficulty (see DOMAIN_LOGIC.md) and are the
 * source of truth for practice recommendations and competency scoring.
 */
@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
  ) {}

  /** Fetch bank questions, optionally filtered by the tagged dimensions. */
  async findAll(filters: QuestionFilters = {}): Promise<Question[]> {
    // Whitelist the allowed filter columns so arbitrary query keys can never
    // leak into the SQL WHERE clause.
    const where: FindOptionsWhere<Question> = {};
    if (filters.subject) where.subject = filters.subject;
    if (filters.chapter) where.chapter = filters.chapter;
    if (filters.topic) where.topic = filters.topic;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.bloom_level) where.bloom_level = filters.bloom_level;

    return this.questionsRepository.find({
      where,
      order: { created_at: 'ASC' },
    });
  }

  /** Fetch a single bank question by its human-readable question_id. */
  async findByQuestionId(questionId: string): Promise<Question> {
    const question = await this.questionsRepository.findOne({
      where: { question_id: questionId },
    });
    if (!question) {
      throw new NotFoundException(`Question "${questionId}" not found.`);
    }
    return question;
  }
}
