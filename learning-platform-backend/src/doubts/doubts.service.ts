import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
import { DoubtThread } from './doubt-thread.entity';
import type {
  DoubtCard,
  DoubtsResponse,
  DoubtThreadCard,
} from './doubts.types';

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
    @InjectRepository(DoubtThread)
    private readonly threadsRepository: Repository<DoubtThread>,
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
    const [threads, doubts] = await Promise.all([
      this.threadsRepository.find({
        where: { userId },
        relations: { doubts: true },
        order: { updatedAt: 'DESC' },
        take: limit,
      }),
      this.doubtsRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
    ]);
    const cards = doubts.map((doubt) => this.toCard(doubt));

    return {
      doubts: cards,
      threads: this.toThreadCards(userId, threads, cards),
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
    const thread = dto.threadId
      ? await this.threadsRepository.findOne({
          where: { id: dto.threadId, userId },
        })
      : await this.createImplicitThread(userId, dto);
    if (!thread) throw new BadRequestException('Doubt thread was not found.');

    const doubt = this.doubtsRepository.create({
      userId,
      threadId: thread.id,
      subject: thread.subject,
      chapter: thread.chapter,
      topic: thread.topic,
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
    await this.threadsRepository.update(thread.id, { updatedAt: new Date() });
    void this.resolveDoubtInBackground(saved.id);
    return this.toCard(saved);
  }

  async createThread(
    userId: string,
    dto: Pick<CreateDoubtDto, 'subject' | 'chapter' | 'topic'> & {
      title?: string;
    },
  ): Promise<DoubtThreadCard> {
    const thread = await this.threadsRepository.save(
      this.threadsRepository.create({
        userId,
        subject: dto.subject.trim(),
        chapter: dto.chapter.trim(),
        topic: dto.topic.trim(),
        title:
          dto.title?.trim() || `${dto.topic.trim()} doubt chat`.slice(0, 120),
      }),
    );
    return {
      id: thread.id,
      title: thread.title,
      subject: thread.subject,
      chapter: thread.chapter,
      topic: thread.topic,
      status: 'ANSWERED',
      turns: 0,
      lastMessageAt: thread.createdAt.toISOString(),
      doubts: [],
    };
  }

  private async createImplicitThread(
    userId: string,
    dto: CreateDoubtDto,
  ): Promise<DoubtThread> {
    return this.threadsRepository.save(
      this.threadsRepository.create({
        userId,
        subject: dto.subject.trim(),
        chapter: dto.chapter.trim(),
        topic: dto.topic.trim(),
        title: this.titleFromMessage(dto.message.trim(), dto.topic.trim()),
      }),
    );
  }

  private titleFromMessage(message: string, topic: string): string {
    const cleaned = message.replace(/\s+/g, ' ').trim();
    if (cleaned.length >= 12) return cleaned.slice(0, 72);
    return `${topic} doubt chat`;
  }

  private async resolveDoubtInBackground(doubtId: string): Promise<void> {
    try {
      const doubt = await this.doubtsRepository.findOne({
        where: { id: doubtId },
      });
      if (!doubt || doubt.status !== DoubtStatus.OPEN) return;
      const tutorResponse = await this.tryGenerateTutorResponse(doubt);
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

  private async tryGenerateTutorResponse(doubt: Doubt): Promise<string> {
    const question = await this.resolveQuestionContext(doubt);
    try {
      // When the doubt was raised from a specific question, fold that question
      // in so the answer addresses the learner's actual attempt. Resolution is
      // best-effort: a missing reference degrades to a topic-level explanation.
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
        `Tutor response unavailable for doubt ${doubt.id}; using deterministic fallback.`,
        error as Error,
      );
      return this.buildFallbackTutorResponse(doubt, question);
    }
  }

  private buildFallbackTutorResponse(
    doubt: Doubt,
    question: DoubtQuestionContext | null,
  ): string {
    const scope = `${doubt.topic} (${doubt.chapter})`;
    if (question) {
      const selected = question.selectedOption
        ? `\n\n**Your selected answer:** ${question.selectedOption}`
        : '';
      return [
        `### ${doubt.topic} doubt`,
        `I could not reach the AI tutor right now, but I can still ground this answer in the reviewed question data.`,
        '',
        `**Question focus:** ${question.questionText}`,
        selected,
        `\n**Correct answer:** ${question.correctAnswer}`,
        `\n**Why:** ${question.solution}`,
        question.commonErrors.length
          ? `\n**Common trap:** ${question.commonErrors[0]}`
          : '',
        `\nIf you want a deeper Socratic breakdown, send one follow-up in this same doubt chat once the tutor is back.`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    return [
      `### ${doubt.topic} doubt`,
      `I could not reach the AI tutor right now, so I saved a safe fallback instead of leaving this doubt unanswered.`,
      '',
      `For ${scope}, start from the definition, identify the given condition, and connect it to the governing law before substituting values.`,
      '',
      `Ask one follow-up in this chat if you want the tutor to expand this into a full step-by-step explanation.`,
    ].join('\n');
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
      threadId: doubt.threadId,
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

  private toThreadCards(
    userId: string,
    threads: DoubtThread[],
    cards: DoubtCard[],
  ): DoubtThreadCard[] {
    const cardsByThread = new Map<string, DoubtCard[]>();
    const legacyByScope = new Map<string, DoubtCard[]>();

    for (const card of cards) {
      if (card.threadId) {
        cardsByThread.set(card.threadId, [
          ...(cardsByThread.get(card.threadId) ?? []),
          card,
        ]);
      } else {
        const key = `${card.subject}:${card.chapter}:${card.topic}`;
        legacyByScope.set(key, [...(legacyByScope.get(key) ?? []), card]);
      }
    }

    const threadCards = threads.map((thread) => {
      const relationCards = (thread.doubts ?? [])
        .map((doubt) => this.toCard(doubt))
        .sort(
          (left, right) =>
            new Date(left.createdAt).getTime() -
            new Date(right.createdAt).getTime(),
        );
      const fallbackCards = cardsByThread.get(thread.id) ?? [];
      const doubts = relationCards.length > 0 ? relationCards : fallbackCards;
      return {
        id: thread.id,
        title: thread.title,
        subject: thread.subject,
        chapter: thread.chapter,
        topic: thread.topic,
        status: doubts.some((doubt) => doubt.status === DoubtStatus.OPEN)
          ? ('OPEN' as const)
          : ('ANSWERED' as const),
        turns: doubts.length,
        lastMessageAt:
          doubts.at(-1)?.createdAt ?? thread.updatedAt.toISOString(),
        doubts,
      };
    });

    const legacyThreads = Array.from(legacyByScope.entries()).map(
      ([key, doubts]) => {
        const [subject, chapter, topic] = key.split(':');
        const sorted = doubts.sort(
          (left, right) =>
            new Date(left.createdAt).getTime() -
            new Date(right.createdAt).getTime(),
        );
        return {
          id: `legacy:${userId}:${key}`,
          title: `${topic} doubts`,
          subject,
          chapter,
          topic,
          status: sorted.some((doubt) => doubt.status === DoubtStatus.OPEN)
            ? ('OPEN' as const)
            : ('ANSWERED' as const),
          turns: sorted.length,
          lastMessageAt: sorted.at(-1)?.createdAt ?? new Date().toISOString(),
          doubts: sorted,
        };
      },
    );

    return [...threadCards, ...legacyThreads].sort(
      (left, right) =>
        new Date(right.lastMessageAt).getTime() -
        new Date(left.lastMessageAt).getTime(),
    );
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
