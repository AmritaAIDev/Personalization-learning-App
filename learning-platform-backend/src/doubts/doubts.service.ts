import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentService } from '../agent/agent.service';
import { TutorMessageType } from '../adaptive/adaptive.types';
import type { CreateDoubtDto } from './doubts.dto';
import { Doubt, DoubtStatus } from './doubt.entity';
import type { DoubtCard, DoubtsResponse } from './doubts.types';

const DEFAULT_LIMIT = 30;

@Injectable()
export class DoubtsService {
  private readonly logger = new Logger(DoubtsService.name);

  constructor(
    @InjectRepository(Doubt)
    private readonly doubtsRepository: Repository<Doubt>,
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
      return await this.agentService.generateTutorResponse({
        subject: doubt.subject,
        chapter: doubt.chapter,
        topic: doubt.topic,
        learnerMessage: doubt.message,
        mode: TutorMessageType.GENERAL,
        answerRevealed: false,
      });
    } catch (error) {
      this.logger.warn(
        `Tutor response unavailable for doubt ${doubt.id}; saved as open.`,
        error as Error,
      );
      return null;
    }
  }

  private toCard(doubt: Doubt): DoubtCard {
    return {
      id: doubt.id,
      subject: doubt.subject,
      chapter: doubt.chapter,
      topic: doubt.topic,
      message: doubt.message,
      assistantResponse: doubt.assistantResponse,
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
