import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { AdaptiveContentService } from '../adaptive/adaptive-content.service';
import { normalizeBloomLevel } from '../adaptive/adaptive.types';
import { AgentService } from '../agent/agent.service';
import {
  MIN_SERVABLE_QUALITY_SCORE,
  scoreQuestionQuality,
} from '../question-quality.util';
import { GenerateTargetedQuestionDto } from './targeted-practice.dto';
import {
  TargetedPracticeQuestion,
  TargetedPracticeReason,
} from './targeted-practice-question.entity';

/** Repeated clicks within this window reuse the same unanswered question instead of generating (and paying for) another one. */
const CACHE_WINDOW_MS = 10 * 60_000;

export interface TargetedQuestionPayload {
  id: string;
  reason: TargetedPracticeReason;
  subject: string;
  chapter: string;
  topic: string;
  questionText: string;
  options: string[];
  hint: string;
  conceptTags: string[];
  bloomLevel: string;
  difficulty: string;
}

export interface TargetedAnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  solution: string;
}

@Injectable()
export class TargetedPracticeService {
  constructor(
    @InjectRepository(TargetedPracticeQuestion)
    private readonly questionsRepository: Repository<TargetedPracticeQuestion>,
    private readonly agentService: AgentService,
    private readonly contentService: AdaptiveContentService,
  ) {}

  async generate(
    userId: string,
    input: GenerateTargetedQuestionDto,
  ): Promise<TargetedQuestionPayload> {
    const scope = {
      subject: input.subject,
      chapter: input.chapter,
      topic: input.topic,
    };
    const focusHash = this.hash(`${input.reason}:${input.focusText}`);
    const cached = await this.questionsRepository.findOne({
      where: {
        userId,
        subject: scope.subject,
        topic: scope.topic,
        reason: input.reason,
        focusHash,
      },
      order: { createdAt: 'DESC' },
    });
    if (
      cached &&
      cached.answeredAt === null &&
      Date.now() - cached.createdAt.getTime() < CACHE_WINDOW_MS
    ) {
      return this.toPayload(cached);
    }

    const sourceMaterial = await this.contentService.buildSourceMaterial(scope);
    const bloomLevel = normalizeBloomLevel(input.bloomLevel ?? 'Application');
    const difficulty = input.difficulty ?? 'Medium';
    const focusHint =
      input.reason === 'MISCONCEPTION'
        ? `Write one question that specifically tests whether the student still holds this misconception: "${input.focusText}". The correct answer must be unambiguous only if that misconception is avoided.`
        : `Write one question that is isomorphic to this source question (same underlying concept, same difficulty, different surface numbers/phrasing). Do not repeat it verbatim: "${input.focusText}"`;

    const [generated] = await this.agentService.generateLearningQuestionBatch({
      ...scope,
      bloomLevel,
      difficulty,
      count: 1,
      sourceMaterial,
      focusHint,
    });
    if (
      !generated ||
      scoreQuestionQuality(generated) < MIN_SERVABLE_QUALITY_SCORE
    ) {
      throw new ServiceUnavailableException(
        'Could not generate a usable question right now. Please try again.',
      );
    }

    const saved = await this.questionsRepository.save(
      this.questionsRepository.create({
        userId,
        subject: scope.subject,
        chapter: scope.chapter,
        topic: scope.topic,
        reason: input.reason,
        focusText: input.focusText,
        focusHash,
        sourceQuestionId: input.sourceQuestionId ?? null,
        questionText: generated.question_text,
        options: generated.options,
        correctAnswer: generated.correct_answer,
        solution: generated.explanation,
        hint: generated.hint,
        conceptTags: generated.concept_tags,
        bloomLevel,
        difficulty,
        selectedOption: null,
        isCorrect: null,
        answeredAt: null,
      }),
    );
    return this.toPayload(saved);
  }

  async submitAnswer(
    userId: string,
    id: string,
    selectedOption: string,
  ): Promise<TargetedAnswerResult> {
    const question = await this.questionsRepository.findOne({
      where: { id, userId },
    });
    if (!question) {
      throw new NotFoundException('Targeted practice question not found.');
    }
    if (question.answeredAt) {
      throw new ConflictException('This question has already been answered.');
    }
    if (!question.options.includes(selectedOption)) {
      throw new BadRequestException(
        'Selected option is not valid for this question.',
      );
    }
    const isCorrect = selectedOption === question.correctAnswer;
    question.selectedOption = selectedOption;
    question.isCorrect = isCorrect;
    question.answeredAt = new Date();
    await this.questionsRepository.save(question);
    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      solution: question.solution,
    };
  }

  private toPayload(
    question: TargetedPracticeQuestion,
  ): TargetedQuestionPayload {
    return {
      id: question.id,
      reason: question.reason,
      subject: question.subject,
      chapter: question.chapter,
      topic: question.topic,
      questionText: question.questionText,
      options: question.options,
      hint: question.hint,
      conceptTags: question.conceptTags,
      bloomLevel: question.bloomLevel,
      difficulty: question.difficulty,
    };
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 40);
  }
}
