import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentService, TutorPromptContext } from '../agent/agent.service';
import { LearningQuestionReference } from './adaptive-content.service';
import { TutorMessageRole, TutorMessageType } from './adaptive.types';
import { LearningSession } from './learning-session.entity';
import { TutorConversation } from './tutor-conversation.entity';
import { TutorMessage } from './tutor-message.entity';

/**
 * Hints and explanations are written in the background while the learner reads
 * the question, so they can afford a realistic model budget. A direct chat
 * message is answered inside the request, so it gets the tighter budget.
 */
const TUTOR_BACKGROUND_TIMEOUT_MS = 20_000;
const TUTOR_INTERACTIVE_TIMEOUT_MS = 14_000;

/** Safety valve so a lost background call cannot pin the UI in "writing…". */
const TUTOR_PENDING_TTL_MS = 30_000;

export interface TutorMessagePayload {
  id: string;
  role: TutorMessageRole;
  messageType: TutorMessageType;
  content: string;
  relatedSessionItemId: string | null;
  createdAt: Date;
}

/** Persists the tutor timeline and applies answer-reveal rules before AI calls. */
@Injectable()
export class TutorService {
  private readonly logger = new Logger(TutorService.name);
  /** Sessions with a background tutor reply in flight, with an expiry stamp. */
  private readonly pendingBySession = new Map<string, number>();

  constructor(
    private readonly agentService: AgentService,
    @InjectRepository(TutorConversation)
    private readonly conversationsRepository: Repository<TutorConversation>,
    @InjectRepository(TutorMessage)
    private readonly messagesRepository: Repository<TutorMessage>,
  ) {}

  /**
   * Marks a session as waiting on a background tutor reply. The client uses it
   * to show a live "writing" state instead of polling blindly.
   */
  markPending(sessionId: string): void {
    this.pendingBySession.set(sessionId, Date.now() + TUTOR_PENDING_TTL_MS);
  }

  isPending(sessionId: string): boolean {
    const expiresAt = this.pendingBySession.get(sessionId);
    if (expiresAt === undefined) return false;
    if (expiresAt <= Date.now()) {
      this.pendingBySession.delete(sessionId);
      return false;
    }
    return true;
  }

  private clearPending(sessionId: string): void {
    this.pendingBySession.delete(sessionId);
  }

  async getConversationMessages(
    userId: string,
    session: LearningSession,
  ): Promise<{
    conversationId: string;
    messages: TutorMessagePayload[];
    pending: boolean;
  }> {
    const conversation = await this.getOrCreateConversation(userId, session);
    const messages = await this.messagesRepository.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'ASC' },
      take: 60,
    });
    return {
      conversationId: conversation.id,
      messages: messages.map((message) => this.toPayload(message)),
      pending: this.isPending(session.id),
    };
  }

  async createSocraticHint(
    userId: string,
    session: LearningSession,
    sessionItemId: string,
    question: LearningQuestionReference,
    selectedOption: string,
  ): Promise<TutorMessagePayload> {
    try {
      return await this.writeSocraticHint(
        userId,
        session,
        sessionItemId,
        question,
        selectedOption,
      );
    } finally {
      this.clearPending(session.id);
    }
  }

  private async writeSocraticHint(
    userId: string,
    session: LearningSession,
    sessionItemId: string,
    question: LearningQuestionReference,
    selectedOption: string,
  ): Promise<TutorMessagePayload> {
    const conversation = await this.getOrCreateConversation(userId, session);
    const generatedContent = await this.withFallback(
      async () =>
        this.agentService.generateTutorResponse({
          subject: session.subject,
          chapter: session.chapter,
          topic: session.topic,
          learnerMessage:
            'I chose this option and want a hint before I try again.',
          mode: TutorMessageType.SOCRATIC_HINT,
          questionText: question.questionText,
          options: question.options,
          selectedOption,
          commonErrors: question.commonErrors,
          answerRevealed: false,
          recentMessages: await this.recentMessages(conversation.id),
        }),
      () => this.fallbackHint(question),
      TUTOR_BACKGROUND_TIMEOUT_MS,
    );
    const content = this.enforceSocraticAnswerBoundary(
      generatedContent,
      question,
    );
    return this.saveAssistantMessage(
      conversation.id,
      TutorMessageType.SOCRATIC_HINT,
      content,
      sessionItemId,
    );
  }

  async createAnswerExplanation(
    userId: string,
    session: LearningSession,
    sessionItemId: string,
    question: LearningQuestionReference,
    selectedOption: string,
  ): Promise<TutorMessagePayload> {
    try {
      return await this.writeAnswerExplanation(
        userId,
        session,
        sessionItemId,
        question,
        selectedOption,
      );
    } finally {
      this.clearPending(session.id);
    }
  }

  private async writeAnswerExplanation(
    userId: string,
    session: LearningSession,
    sessionItemId: string,
    question: LearningQuestionReference,
    selectedOption: string,
  ): Promise<TutorMessagePayload> {
    const conversation = await this.getOrCreateConversation(userId, session);
    const content = await this.withFallback(
      async () =>
        this.agentService.generateTutorResponse({
          subject: session.subject,
          chapter: session.chapter,
          topic: session.topic,
          learnerMessage:
            'I made a second attempt and need to understand the mistake.',
          mode: TutorMessageType.ANSWER_EXPLANATION,
          questionText: question.questionText,
          options: question.options,
          selectedOption,
          correctAnswer: question.correctAnswer,
          solution: question.solution,
          commonErrors: question.commonErrors,
          answerRevealed: true,
          recentMessages: await this.recentMessages(conversation.id),
        }),
      () => this.fallbackExplanation(question, selectedOption),
      TUTOR_BACKGROUND_TIMEOUT_MS,
    );
    return this.saveAssistantMessage(
      conversation.id,
      TutorMessageType.ANSWER_EXPLANATION,
      content,
      sessionItemId,
    );
  }

  async answerLearnerMessage(
    userId: string,
    session: LearningSession,
    sessionItemId: string | null,
    question: LearningQuestionReference | null,
    answerRevealed: boolean,
    message: string,
  ): Promise<TutorMessagePayload> {
    const conversation = await this.getOrCreateConversation(userId, session);
    await this.messagesRepository.save(
      this.messagesRepository.create({
        conversationId: conversation.id,
        role: TutorMessageRole.USER,
        messageType: TutorMessageType.GENERAL,
        content: message.trim(),
        relatedSessionItemId: sessionItemId,
      }),
    );
    const content = await this.withFallback(
      async () =>
        this.agentService.generateTutorResponse({
          subject: session.subject,
          chapter: session.chapter,
          topic: session.topic,
          learnerMessage: message.trim(),
          mode: TutorMessageType.GENERAL,
          questionText: question?.questionText,
          options: question?.options,
          selectedOption: undefined,
          correctAnswer: answerRevealed ? question?.correctAnswer : undefined,
          solution: answerRevealed ? question?.solution : undefined,
          commonErrors: question?.commonErrors,
          answerRevealed,
          recentMessages: await this.recentMessages(conversation.id),
        }),
      () =>
        question
          ? answerRevealed
            ? this.fallbackExplanation(question, '')
            : this.fallbackHint(question)
          : 'Tell me which part of the topic feels uncertain, and we can isolate one idea at a time.',
      TUTOR_INTERACTIVE_TIMEOUT_MS,
    );
    return this.saveAssistantMessage(
      conversation.id,
      TutorMessageType.GENERAL,
      content,
      sessionItemId,
    );
  }

  /**
   * Streaming counterpart of {@link answerLearnerMessage}: yields text
   * chunks as the model generates them, then returns (as the generator's
   * final value) the persisted assistant message — same DB write and
   * fallback behavior as the non-streaming path, just progressive.
   */
  async *answerLearnerMessageStream(
    userId: string,
    session: LearningSession,
    sessionItemId: string | null,
    question: LearningQuestionReference | null,
    answerRevealed: boolean,
    message: string,
  ): AsyncGenerator<string, TutorMessagePayload, void> {
    const conversation = await this.getOrCreateConversation(userId, session);
    await this.messagesRepository.save(
      this.messagesRepository.create({
        conversationId: conversation.id,
        role: TutorMessageRole.USER,
        messageType: TutorMessageType.GENERAL,
        content: message.trim(),
        relatedSessionItemId: sessionItemId,
      }),
    );

    const context: TutorPromptContext = {
      subject: session.subject,
      chapter: session.chapter,
      topic: session.topic,
      learnerMessage: message.trim(),
      mode: TutorMessageType.GENERAL,
      questionText: question?.questionText,
      options: question?.options,
      selectedOption: undefined,
      correctAnswer: answerRevealed ? question?.correctAnswer : undefined,
      solution: answerRevealed ? question?.solution : undefined,
      commonErrors: question?.commonErrors,
      answerRevealed,
      recentMessages: await this.recentMessages(conversation.id),
    };

    let full = '';
    const deadline = Date.now() + TUTOR_INTERACTIVE_TIMEOUT_MS;
    try {
      for await (const chunk of this.agentService.generateTutorResponseStream(
        context,
      )) {
        full += chunk;
        yield chunk;
        if (Date.now() > deadline) {
          this.logger.warn(
            `Tutor stream exceeded its ${TUTOR_INTERACTIVE_TIMEOUT_MS}ms budget; finalizing with the partial response.`,
          );
          break;
        }
      }
    } catch (error) {
      // A stream that fails before producing anything falls back exactly
      // like the non-streaming path. A stream that fails partway keeps
      // whatever was already shown to the learner rather than discarding it.
      if (!full) {
        this.logger.warn(
          `Tutor AI unavailable; serving database-backed guidance. ${this.toErrorMessage(error)}`,
        );
        full = question
          ? answerRevealed
            ? this.fallbackExplanation(question, '')
            : this.fallbackHint(question)
          : 'Tell me which part of the topic feels uncertain, and we can isolate one idea at a time.';
        yield full;
      }
    }
    const content =
      full.trim() || 'Let’s break the idea into one smaller step.';
    return this.saveAssistantMessage(
      conversation.id,
      TutorMessageType.GENERAL,
      content,
      sessionItemId,
    );
  }

  private async getOrCreateConversation(
    userId: string,
    session: LearningSession,
  ): Promise<TutorConversation> {
    const existing = await this.conversationsRepository.findOne({
      where: { userId, sessionId: session.id },
    });
    if (existing) return existing;
    return this.conversationsRepository.save(
      this.conversationsRepository.create({
        userId,
        sessionId: session.id,
        subject: session.subject,
        chapter: session.chapter,
        topic: session.topic,
      }),
    );
  }

  private async recentMessages(
    conversationId: string,
  ): Promise<Array<{ role: 'USER' | 'ASSISTANT'; content: string }>> {
    const messages = await this.messagesRepository.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: 6,
    });
    return messages
      .reverse()
      .map((message) => ({ role: message.role, content: message.content }));
  }

  private async saveAssistantMessage(
    conversationId: string,
    messageType: TutorMessageType,
    content: string,
    relatedSessionItemId: string | null,
  ): Promise<TutorMessagePayload> {
    const message = await this.messagesRepository.save(
      this.messagesRepository.create({
        conversationId,
        role: TutorMessageRole.ASSISTANT,
        messageType,
        content,
        relatedSessionItemId,
      }),
    );
    return this.toPayload(message);
  }

  private async withFallback(
    operation: () => Promise<string>,
    fallback: () => string,
    timeoutMs: number,
  ): Promise<string> {
    try {
      return await this.withTimeout(operation(), timeoutMs);
    } catch (error) {
      this.logger.warn(
        `Tutor AI unavailable; serving database-backed guidance. ${this.toErrorMessage(error)}`,
      );
      return fallback();
    }
  }

  private async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    let timeout: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<T>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error(`Tutor AI timed out after ${timeoutMs}ms.`)),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private fallbackHint(question: LearningQuestionReference): string {
    const misconception = question.commonErrors[0];
    const storedHint = question.hint?.trim();
    return [
      '### Try this next',
      storedHint ||
        (misconception
          ? `Check whether your choice relies on this assumption: ${misconception}`
          : `Re-read the relationship named in the question and test it against your selected option.`),
      '### Self-check',
      'Which quantity or condition controls the result before you substitute any values?',
    ].join('\n\n');
  }

  /**
   * The answer key is deliberately withheld from DeepSeek for a first miss.
   * This server-side check is a second boundary: if a model nevertheless
   * states the exact stored answer, use the safe database-backed hint instead.
   */
  private enforceSocraticAnswerBoundary(
    content: string,
    question: LearningQuestionReference,
  ): string {
    const normalizedAnswer = this.normalizeForAnswerBoundary(
      question.correctAnswer,
    );
    if (normalizedAnswer.length < 3) return content;
    const normalizedContent = this.normalizeForAnswerBoundary(content);
    const includesAnswer = ` ${normalizedContent} `.includes(
      ` ${normalizedAnswer} `,
    );
    if (!includesAnswer) return content;
    this.logger.warn(
      'Tutor response crossed the unrevealed-answer boundary; using a safe hint.',
    );
    return this.fallbackHint(question);
  }

  private normalizeForAnswerBoundary(value: string): string {
    return value
      .toLocaleLowerCase('en-US')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private fallbackExplanation(
    question: LearningQuestionReference,
    selectedOption: string,
  ): string {
    const misconception = question.commonErrors[0];
    return [
      '### What to correct',
      selectedOption && misconception
        ? `The selected choice is commonly caused by: ${misconception}`
        : misconception ||
          'Compare each option against the governing relationship.',
      '### Correct reasoning',
      `${question.correctAnswer} is correct. ${question.solution}`,
      '### Next move',
      'Review the related flashcard, then retry the current coordinate with a fresh five-question set.',
    ].join('\n\n');
  }

  private toPayload(message: TutorMessage): TutorMessagePayload {
    return {
      id: message.id,
      role: message.role,
      messageType: message.messageType,
      content: message.content,
      relatedSessionItemId: message.relatedSessionItemId,
      createdAt: message.createdAt,
    };
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error.';
  }
}
