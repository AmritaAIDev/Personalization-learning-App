import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentService, RetrievedSource } from '../agent/agent.service';
import { TutorMessageType } from '../adaptive/adaptive.types';
import { toCitations } from '../citation.util';
import { LearningSessionItem } from '../adaptive/learning-session-item.entity';
import { GeneratedLearningQuestion } from '../adaptive/generated-learning-question.entity';
import { Question } from '../question.entity';
import type { CreateDoubtDto } from './doubts.dto';
import { Doubt, DoubtStatus } from './doubt.entity';
import type { DoubtCard, DoubtsResponse } from './doubts.types';

const DEFAULT_LIMIT = 30;

/**
 * The question a doubt was raised from, assembled server-side so the tutor can
 * answer "why is this wrong?" against the real item instead of the topic alone.
 */
interface DoubtQuestionContext {
  questionText: string;
  options: string[];
  correctAnswer: string;
  solution: string;
  commonErrors: string[];
  selectedOption?: string;
}

@Injectable()
export class DoubtsService {
  private readonly logger = new Logger(DoubtsService.name);

  constructor(
    @InjectRepository(Doubt)
    private readonly doubtsRepository: Repository<Doubt>,
    @InjectRepository(LearningSessionItem)
    private readonly sessionItemsRepository: Repository<LearningSessionItem>,
    @InjectRepository(GeneratedLearningQuestion)
    private readonly generatedQuestionsRepository: Repository<GeneratedLearningQuestion>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    private readonly agentService: AgentService,
  ) {}

  async list(userId: string, limit = DEFAULT_LIMIT): Promise<DoubtsResponse> {
    const doubts = await this.doubtsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    const cards = doubts.map((doubt) => this.toCard(doubt));

    return {
      doubts: cards,
      total: cards.length,
      summary: {
        open: cards.filter((doubt) => doubt.status === DoubtStatus.OPEN).length,
        answered: cards.filter((doubt) => doubt.status === DoubtStatus.ANSWERED)
          .length,
        recentTopics: this.getRecentTopics(cards),
      },
    };
  }

  async create(userId: string, dto: CreateDoubtDto): Promise<DoubtCard> {
    const doubt = this.doubtsRepository.create({
      userId,
      subject: dto.subject.trim(),
      chapter: dto.chapter.trim(),
      topic: dto.topic.trim(),
      message: dto.message.trim(),
      questionId: dto.questionId ?? null,
      learningSessionId: dto.learningSessionId ?? null,
      learningSessionItemId: dto.learningSessionItemId ?? null,
      practiceAttemptId: dto.practiceAttemptId ?? null,
      notebookCardId: dto.notebookCardId ?? null,
      status: DoubtStatus.OPEN,
      assistantResponse: null,
      answeredAt: null,
    });

    // The tutor response is generated out-of-band so the create call returns
    // immediately; the frontend polls until the doubt flips to ANSWERED.
    const saved = await this.doubtsRepository.save(doubt);
    void this.resolveDoubtInBackground(saved.id);
    return this.toCard(saved);
  }

  private async resolveDoubtInBackground(doubtId: string): Promise<void> {
    try {
      const doubt = await this.doubtsRepository.findOne({
        where: { id: doubtId },
      });
      if (!doubt || doubt.status !== DoubtStatus.OPEN) return;
      const tutorResponse = await this.tryGenerateTutorResponse(doubt);
      if (!tutorResponse) return;
      doubt.assistantResponse = tutorResponse;
      // Grounding is best-effort; a missing/slow vector store just means no
      // citations, never a failed or delayed answer.
      const sources = await this.agentService
        .retrieveSupplementalSources(doubt.topic)
        .catch(() => [] as RetrievedSource[]);
      const citations = toCitations(sources);
      doubt.sources = citations.length > 0 ? citations : null;
      doubt.status = DoubtStatus.ANSWERED;
      doubt.answeredAt = new Date();
      await this.doubtsRepository.save(doubt);
    } catch (error) {
      this.logger.warn(
        `Background tutor response failed for doubt ${doubtId}.`,
        error as Error,
      );
    }
  }

  private async tryGenerateTutorResponse(doubt: Doubt): Promise<string | null> {
    try {
      // When the doubt was raised from a specific question, fold that question
      // in so the answer addresses the learner's actual attempt. Resolution is
      // best-effort: a missing reference degrades to a topic-level explanation.
      const question = await this.resolveQuestionContext(doubt);
      return await this.agentService.generateTutorResponse({
        subject: doubt.subject,
        chapter: doubt.chapter,
        topic: doubt.topic,
        learnerMessage: doubt.message,
        mode: TutorMessageType.GENERAL,
        // A doubt is a genuine question to teach, not a practice item whose
        // answer must be hidden — ask for a complete, grounded explanation.
        explanatory: true,
        questionText: question?.questionText,
        options: question?.options,
        selectedOption: question?.selectedOption,
        correctAnswer: question?.correctAnswer,
        solution: question?.solution,
        commonErrors: question?.commonErrors,
        // The learner is reviewing an item they already faced, so the worked
        // answer is theirs to see.
        answerRevealed: Boolean(question),
      });
    } catch (error) {
      this.logger.warn(
        `Tutor response unavailable for doubt ${doubt.id}; saved as open.`,
        error as Error,
      );
      return null;
    }
  }

  /**
   * Resolves the question a doubt points at. A learning-session item is richest
   * (it carries the learner's selected option), so it wins; otherwise a bare
   * question id is matched against the curated bank first, then the learner's
   * generated pool. Any lookup failure returns null and the caller falls back
   * to a topic-level explanation.
   */
  private async resolveQuestionContext(
    doubt: Doubt,
  ): Promise<DoubtQuestionContext | null> {
    try {
      if (doubt.learningSessionItemId) {
        const fromItem = await this.contextFromSessionItem(
          doubt.learningSessionItemId,
        );
        if (fromItem) return fromItem;
      }
      if (doubt.questionId) {
        const fromQuestionId = await this.contextFromQuestionId(
          doubt.questionId,
        );
        if (fromQuestionId) return fromQuestionId;
      }
    } catch (error) {
      this.logger.warn(
        `Could not resolve question context for doubt ${doubt.id}: ${(error as Error).message}`,
      );
    }
    return null;
  }

  private async contextFromSessionItem(
    sessionItemId: string,
  ): Promise<DoubtQuestionContext | null> {
    const item = await this.sessionItemsRepository.findOne({
      where: { id: sessionItemId },
      relations: { question: true, generatedQuestion: true, answers: true },
    });
    if (!item) return null;
    const selectedOption = (item.answers ?? [])
      .slice()
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0]?.selectedOption;
    if (item.question) {
      return { ...this.fromCurated(item.question), selectedOption };
    }
    if (item.generatedQuestion) {
      return { ...this.fromGenerated(item.generatedQuestion), selectedOption };
    }
    return null;
  }

  private async contextFromQuestionId(
    questionId: string,
  ): Promise<DoubtQuestionContext | null> {
    const curated = await this.questionsRepository.findOne({
      where: { id: questionId },
    });
    if (curated) return this.fromCurated(curated);
    const generated = await this.generatedQuestionsRepository.findOne({
      where: { id: questionId },
    });
    if (generated) return this.fromGenerated(generated);
    return null;
  }

  private fromCurated(question: Question): DoubtQuestionContext {
    return {
      questionText: question.question_text,
      options: question.options ?? [],
      correctAnswer: question.correct_answer,
      solution: question.solution,
      commonErrors: question.common_errors ?? [],
    };
  }

  private fromGenerated(
    question: GeneratedLearningQuestion,
  ): DoubtQuestionContext {
    return {
      questionText: question.questionText,
      options: question.options ?? [],
      correctAnswer: question.correctAnswer,
      solution: question.solution,
      commonErrors: question.commonErrors ?? [],
    };
  }

  private toCard(doubt: Doubt): DoubtCard {
    return {
      id: doubt.id,
      subject: doubt.subject,
      chapter: doubt.chapter,
      topic: doubt.topic,
      message: doubt.message,
      assistantResponse: doubt.assistantResponse,
      sources: doubt.sources ?? [],
      status: doubt.status,
      questionId: doubt.questionId,
      learningSessionId: doubt.learningSessionId,
      learningSessionItemId: doubt.learningSessionItemId,
      practiceAttemptId: doubt.practiceAttemptId,
      notebookCardId: doubt.notebookCardId,
      createdAt: doubt.createdAt.toISOString(),
      answeredAt: doubt.answeredAt?.toISOString() ?? null,
    };
  }

  private getRecentTopics(doubts: DoubtCard[]): string[] {
    const seen = new Set<string>();
    for (const doubt of doubts) {
      seen.add(`${doubt.subject} • ${doubt.chapter} • ${doubt.topic}`);
      if (seen.size === 4) break;
    }
    return Array.from(seen);
  }
}
