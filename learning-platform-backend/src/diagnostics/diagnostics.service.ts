import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { In, Repository } from 'typeorm';
import { Question, QuestionPublicationStatus } from '../question.entity';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import { LearningTopicStatus } from '../adaptive/adaptive.types';
import {
  BLOOM_LEVELS,
  normalizeBloomLevel,
  TutorMessageType,
} from '../adaptive/adaptive.types';
import {
  AgentService,
  type ExplanationDepth,
  RetrievedSource,
} from '../agent/agent.service';
import { User } from '../users/user.entity';
import { levelForXp } from '../users/user-progress';
import type { AuthenticatedUser } from '../auth/auth.types';
import { calibrationFor } from '../confidence.util';
import { ExplanationResult, toCitations } from '../citation.util';
import { DiagnosticAnswer } from './diagnostic-answer.entity';
import { DiagnosticAttempt } from './diagnostic-attempt.entity';
import {
  ClearDiagnosticHistoryDto,
  CreateDiagnosticDto,
  ExplainQuestionDto,
  SaveDiagnosticAnswerDto,
} from './diagnostic.dto';
import { LearningResource } from './learning-resource.entity';
// XP awarded per submitted diagnostic.
const XP_PER_DIAGNOSTIC_SUBMITTED = 50;
const XP_PER_CORRECT_ANSWER = 10;
const XP_HIGH_SCORE_BONUS = 20;
const XP_MINIMUM_ATTEMPT = 15;

import {
  DiagnosticAnalysis,
  DiagnosticAttemptMode,
  DiagnosticAttemptStatus,
  DiagnosticReviewItem,
  DiagnosticReviewPayload,
  IntegritySignal,
  DIAGNOSTIC_DURATION_MINUTES,
  DIAGNOSTIC_QUESTION_COUNT,
  DIAGNOSTIC_QUESTIONS_PER_DIFFICULTY,
  DIAGNOSTIC_SUBJECT,
  ELECTROSTATICS_CHAPTERS,
  LearningResourceType,
  PerformanceRow,
} from './diagnostic.types';

type PublicDiagnosticQuestion = {
  id: string;
  questionId: string;
  chapter: string;
  topic: string;
  questionText: string;
  options: string[];
  difficulty: string;
  bloomLevel: string;
  marks: number;
};

@Injectable()
export class DiagnosticsService {
  constructor(
    @InjectRepository(DiagnosticAttempt)
    private readonly attemptsRepository: Repository<DiagnosticAttempt>,
    @InjectRepository(DiagnosticAnswer)
    private readonly answersRepository: Repository<DiagnosticAnswer>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(LearningResource)
    private readonly resourcesRepository: Repository<LearningResource>,
    @InjectRepository(LearningTopicState)
    private readonly topicStatesRepository: Repository<LearningTopicState>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly agentService: AgentService,
  ) {}

  async createAttempt(user: AuthenticatedUser, input: CreateDiagnosticDto) {
    const mode = input.mode ?? DiagnosticAttemptMode.PROGRAM;
    const isTopicPlacement = mode === DiagnosticAttemptMode.TOPIC_PLACEMENT;
    if (isTopicPlacement && (!input.chapter?.trim() || !input.topic?.trim())) {
      throw new BadRequestException(
        'A topic placement check needs a subject, chapter, and topic.',
      );
    }
    const subject = input.subject ?? DIAGNOSTIC_SUBJECT;
    const chapter = isTopicPlacement ? input.chapter!.trim() : null;
    const topic = isTopicPlacement ? input.topic!.trim() : null;
    const activeAttempt = await this.attemptsRepository.findOne({
      where: {
        userId: user.id,
        status: DiagnosticAttemptStatus.IN_PROGRESS,
      },
      relations: { answers: true },
      order: { startedAt: 'DESC' },
    });

    if (
      activeAttempt &&
      activeAttempt.expiresAt.getTime() > Date.now() &&
      activeAttempt.mode === mode &&
      activeAttempt.subject === subject &&
      activeAttempt.chapter === chapter &&
      activeAttempt.topic === topic
    ) {
      return this.toAttemptPayload(activeAttempt);
    }

    if (activeAttempt && activeAttempt.expiresAt.getTime() > Date.now()) {
      throw new ConflictException(
        'Finish or resume your current placement check before starting another one.',
      );
    }

    if (activeAttempt) {
      await this.finalizeAttempt(activeAttempt, true);
    }

    const questions = await this.getQuestionSet(
      user.id,
      subject,
      chapter,
      topic,
    );
    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + DIAGNOSTIC_DURATION_MINUTES * 60 * 1000,
    );
    const attempt = this.attemptsRepository.create({
      userId: user.id,
      subject,
      mode,
      chapter,
      topic,
      title: isTopicPlacement
        ? `${topic} placement check`
        : 'Class XII Physics - Electrostatics Diagnostic',
      chapterScope: chapter ? [chapter] : [...ELECTROSTATICS_CHAPTERS],
      questionIds: questions.map((question) => question.id),
      status: DiagnosticAttemptStatus.IN_PROGRESS,
      totalQuestions: questions.length,
      startedAt,
      expiresAt,
      submittedAt: null,
      analysis: null,
    });
    await this.attemptsRepository.save(attempt);

    return this.toAttemptPayload({ ...attempt, answers: [] });
  }

  async getAttempt(userId: string, attemptId: string) {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (
      attempt.status === DiagnosticAttemptStatus.IN_PROGRESS &&
      attempt.expiresAt.getTime() <= Date.now()
    ) {
      await this.finalizeAttempt(attempt, true);
    }

    return this.toAttemptPayload(attempt);
  }

  async saveAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    input: SaveDiagnosticAnswerDto,
  ) {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (attempt.status !== DiagnosticAttemptStatus.IN_PROGRESS) {
      throw new ConflictException(
        'This diagnostic has already been submitted.',
      );
    }
    if (attempt.expiresAt.getTime() <= Date.now()) {
      await this.finalizeAttempt(attempt, true);
      throw new ConflictException('The diagnostic time limit has expired.');
    }
    if (!attempt.questionIds.includes(questionId)) {
      throw new NotFoundException('Question is not part of this diagnostic.');
    }

    const question = await this.questionsRepository.findOne({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException('Question not found.');
    }
    if (!question.options.includes(input.selectedOption)) {
      throw new BadRequestException(
        'Selected option is not valid for this question.',
      );
    }

    let answer = await this.answersRepository.findOne({
      where: { attemptId: attempt.id, questionId },
    });
    if (!answer) {
      answer = this.answersRepository.create({
        attemptId: attempt.id,
        questionId,
        selectedOption: input.selectedOption,
        elapsedSeconds: input.elapsedSeconds ?? null,
        confidence: input.confidence ?? null,
        isCorrect: null,
      });
    } else {
      answer.selectedOption = input.selectedOption;
      answer.elapsedSeconds = input.elapsedSeconds ?? answer.elapsedSeconds;
      answer.confidence = input.confidence ?? answer.confidence;
    }
    await this.answersRepository.save(answer);

    return {
      data: {
        attemptId: attempt.id,
        questionId,
        saved: true,
        answeredCount:
          (attempt.answers ?? []).filter(
            (savedAnswer) => savedAnswer.questionId !== questionId,
          ).length + 1,
      },
    };
  }

  async submitAttempt(userId: string, attemptId: string, isAdmin = false) {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (attempt.analysis) {
      return { data: this.toAnalysisPayload(attempt, isAdmin) };
    }

    await this.finalizeAttempt(
      attempt,
      attempt.expiresAt.getTime() <= Date.now(),
    );
    return { data: this.toAnalysisPayload(attempt, isAdmin) };
  }

  async getAnalysis(userId: string, attemptId: string, isAdmin = false) {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (!attempt.analysis && attempt.expiresAt.getTime() <= Date.now()) {
      await this.finalizeAttempt(attempt, true);
    }
    if (!attempt.analysis) {
      throw new ConflictException(
        'Submit the diagnostic before viewing its analysis.',
      );
    }
    return { data: this.toAnalysisPayload(attempt, isAdmin) };
  }

  async getReview(
    userId: string,
    attemptId: string,
  ): Promise<{ data: DiagnosticReviewPayload }> {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (!attempt.analysis) {
      throw new ConflictException(
        'Submit the diagnostic before viewing its review.',
      );
    }
    const questions = await this.questionsRepository.find({
      where: { id: In(attempt.questionIds) },
    });
    const questionById = new Map(
      questions.map((question) => [question.id, question]),
    );
    const answers = new Map(
      (attempt.answers ?? []).map((answer) => [answer.questionId, answer]),
    );
    const review: DiagnosticReviewItem[] = attempt.questionIds.map(
      (questionId, index) => {
        const question = questionById.get(questionId);
        if (!question) {
          throw new ServiceUnavailableException(
            'A diagnostic question is no longer available.',
          );
        }
        const answer = answers.get(questionId);
        const selectedOption = answer?.selectedOption ?? null;
        const isCorrect = selectedOption === question.correct_answer;
        return {
          position: index + 1,
          id: question.id,
          questionId: question.question_id,
          subject: question.subject,
          chapter: question.chapter,
          topic: question.topic,
          difficulty: question.difficulty,
          bloomLevel: question.bloom_level,
          marks: question.marks,
          questionText: question.question_text,
          options: question.options,
          selectedOption,
          correctOption: question.correct_answer,
          isCorrect,
          solution: question.solution,
          confidence: answer?.confidence ?? null,
          calibration: calibrationFor(answer?.confidence ?? null, isCorrect),
        };
      },
    );
    return {
      data: {
        attempt: {
          id: attempt.id,
          status: attempt.status,
          submittedAt: attempt.submittedAt?.toISOString() ?? null,
        },
        questions: review,
      },
    };
  }
  /**
   * On-demand "Explain this" for a single reviewed diagnostic question. The
   * attempt is submitted, so the answer key is the learner's to see; the tutor
   * teaches it fully at the requested depth, degrading to the stored solution
   * if the model is unavailable.
   */
  async explainReviewQuestion(
    userId: string,
    attemptId: string,
    questionId: string,
    input: ExplainQuestionDto,
  ): Promise<ExplanationResult> {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (!attempt.analysis) {
      throw new ConflictException(
        'Submit the diagnostic before requesting an explanation.',
      );
    }
    if (!attempt.questionIds.includes(questionId)) {
      throw new NotFoundException('Question is not part of this diagnostic.');
    }
    const question = await this.questionsRepository.findOne({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException('Question not found.');
    }
    const answer = (attempt.answers ?? []).find(
      (candidate) => candidate.questionId === questionId,
    );

    // Citations are best-effort and never block: retrieval degrades to [].
    const sources = await this.agentService
      .retrieveSupplementalSources(question.topic)
      .catch(() => [] as RetrievedSource[]);

    try {
      const explanation = await this.agentService.generateTutorResponse({
        subject: question.subject,
        chapter: question.chapter,
        topic: question.topic,
        learnerMessage:
          'Explain this question: why the correct answer is right and where the tempting choices go wrong.',
        mode: TutorMessageType.ANSWER_EXPLANATION,
        questionText: question.question_text,
        options: question.options,
        selectedOption: answer?.selectedOption ?? undefined,
        correctAnswer: question.correct_answer,
        solution: question.solution,
        commonErrors: question.common_errors ?? [],
        answerRevealed: true,
        explanatory: true,
        depth: input.depth,
      });
      return { explanation, grounded: true, sources: toCitations(sources) };
    } catch {
      return {
        explanation: this.fallbackExplanation(
          question,
          answer?.selectedOption ?? null,
          input.depth,
        ),
        grounded: false,
        sources: toCitations(sources),
      };
    }
  }

  /**
   * Deterministic explanation used when the model is unavailable. Shaped by
   * `depth` so Regenerate/Concise/Step by step/From scratch don't all render
   * the identical offline text — only the live AI call used to vary by depth.
   */
  private fallbackExplanation(
    question: Question,
    selectedOption: string | null,
    depth?: ExplanationDepth,
  ): string {
    const misconception = (question.common_errors ?? [])[0];
    if (depth === 'concise') {
      const firstSentence = question.solution.split(/(?<=[.!?])\s+/)[0];
      return [
        '### Correct answer',
        `**${question.correct_answer}**`,
        firstSentence,
      ].join('\n\n');
    }
    const lines = ['### Correct answer', `**${question.correct_answer}**`];
    if (selectedOption && selectedOption !== question.correct_answer) {
      lines.push(
        '### Where your choice went wrong',
        misconception
          ? `A common cause of “${selectedOption}” is: ${misconception}`
          : `Compare “${selectedOption}” against the governing relationship for this topic.`,
      );
    }
    if (depth === 'step-by-step') {
      lines.push(
        '### Step by step',
        `1. Identify what the question is actually asking for.`,
        `2. Apply the governing relationship: ${question.solution}`,
        `3. Check that ${question.correct_answer} is the only option consistent with step 2.`,
      );
    } else if (depth === 'from-scratch') {
      lines.push(
        '### From first principles',
        `Before using any shortcut, re-derive it: ${question.solution}`,
        `That derivation is what rules every option out except ${question.correct_answer}.`,
      );
    } else {
      lines.push('### Worked reasoning', question.solution);
    }
    return lines.join('\n\n');
  }

  async getRecommendations(userId: string, attemptId: string) {
    const attempt = await this.getOwnedAttempt(userId, attemptId, false);
    if (!attempt.analysis) {
      throw new ConflictException(
        'Submit the diagnostic before viewing recommendations.',
      );
    }

    const weakTopics = attempt.analysis.weakTopics;
    const resourceConditions = [
      { subject: attempt.subject, isGeneral: true },
      ...(weakTopics.length > 0
        ? [
            {
              subject: attempt.subject,
              isGeneral: false,
              topic: In(weakTopics),
            },
          ]
        : []),
    ];
    const resources = await this.resourcesRepository.find({
      where: resourceConditions,
      order: { topic: 'ASC', resourceType: 'ASC', title: 'ASC' },
    });

    const topicRecommendations = weakTopics.map((topic) => {
      const topicResources = resources.filter(
        (resource) => !resource.isGeneral && resource.topic === topic,
      );
      const formula = topicResources.find(
        (resource) => resource.resourceType === LearningResourceType.FORMULA,
      );
      return {
        topic,
        formula: formula?.content ?? null,
        resources: topicResources
          .filter(
            (resource) =>
              resource.resourceType !== LearningResourceType.FORMULA,
          )
          .map((resource) => this.toResourcePayload(resource)),
      };
    });

    return {
      data: {
        attemptId: attempt.id,
        hasWeakTopics: weakTopics.length > 0,
        weakTopics,
        topicRecommendations,
        generalResources: resources
          .filter((resource) => resource.isGeneral)
          .map((resource) => this.toResourcePayload(resource)),
      },
    };
  }

  async getDashboard(userId: string) {
    const [completedAttempts, activeAttempt, publishedQuestions] =
      await Promise.all([
        this.attemptsRepository.find({
          where: {
            userId,
            status: In([
              DiagnosticAttemptStatus.SUBMITTED,
              DiagnosticAttemptStatus.EXPIRED,
            ]),
          },
          order: { submittedAt: 'DESC' },
        }),
        this.attemptsRepository.findOne({
          where: { userId, status: DiagnosticAttemptStatus.IN_PROGRESS },
          order: { startedAt: 'DESC' },
        }),
        this.questionsRepository.find({
          where: {
            subject: DIAGNOSTIC_SUBJECT,
            chapter: In([...ELECTROSTATICS_CHAPTERS]),
            status: QuestionPublicationStatus.PUBLISHED,
          },
        }),
      ]);
    const scores = completedAttempts.map((attempt) => attempt.scorePercent);

    return {
      data: {
        stats: {
          testsTaken: completedAttempts.length,
          bestScore: scores.length > 0 ? Math.max(...scores) : null,
          averageScore:
            scores.length > 0
              ? Math.round(
                  scores.reduce((total, score) => total + score, 0) /
                    scores.length,
                )
              : null,
          subject: 'Physics - Electrostatics',
        },
        diagnostic: {
          title: 'Class XII Physics - Electrostatics Diagnostic',
          chapters: [...ELECTROSTATICS_CHAPTERS],
          questionCount: DIAGNOSTIC_QUESTION_COUNT,
          durationMinutes: DIAGNOSTIC_DURATION_MINUTES,
          ready: this.hasBalancedDifficultyCoverage(publishedQuestions),
        },
        activeAttempt: activeAttempt
          ? {
              id: activeAttempt.id,
              expiresAt: activeAttempt.expiresAt,
              answeredCount: await this.answersRepository.count({
                where: { attemptId: activeAttempt.id },
              }),
            }
          : null,
        recentAttempts: completedAttempts
          .slice(0, 5)
          .map((attempt) => this.toHistoryItem(attempt)),
      },
    };
  }

  async getHistory(userId: string) {
    const attempts = await this.attemptsRepository.find({
      where: {
        userId,
        status: In([
          DiagnosticAttemptStatus.SUBMITTED,
          DiagnosticAttemptStatus.EXPIRED,
        ]),
      },
      order: { submittedAt: 'DESC' },
    });
    return { data: attempts.map((attempt) => this.toHistoryItem(attempt)) };
  }

  async clearHistory(userId: string, input: ClearDiagnosticHistoryDto) {
    if (input.confirmation !== 'DELETE') {
      throw new BadRequestException(
        'History deletion must be explicitly confirmed.',
      );
    }
    const result = await this.attemptsRepository.delete({
      userId,
      status: In([
        DiagnosticAttemptStatus.SUBMITTED,
        DiagnosticAttemptStatus.EXPIRED,
      ]),
    });
    return { data: { clearedAttempts: result.affected ?? 0 } };
  }

  private async getQuestionSet(
    userId: string,
    subject: string,
    chapter: string | null = null,
    topic: string | null = null,
  ): Promise<Question[]> {
    const bank = await this.questionsRepository.find({
      where: {
        subject,
        ...(chapter
          ? { chapter }
          : { chapter: In([...ELECTROSTATICS_CHAPTERS]) }),
        ...(topic ? { topic } : {}),
        status: QuestionPublicationStatus.PUBLISHED,
      },
      order: { question_id: 'ASC' },
    });
    if (!this.hasBalancedDifficultyCoverage(bank)) {
      throw new ServiceUnavailableException(
        'This placement check needs at least five published Easy, Medium, and Hard questions for the selected topic.',
      );
    }

    // Prefer unseen published questions from the learner's recent completed
    // diagnostics. When coverage is too small, fall back safely to the full
    // reviewed bank rather than creating an incomplete or unbalanced test.
    const recentAttempts = await this.attemptsRepository.find({
      where: {
        userId,
        subject,
        status: In([
          DiagnosticAttemptStatus.SUBMITTED,
          DiagnosticAttemptStatus.EXPIRED,
        ]),
      },
      order: { submittedAt: 'DESC' },
      take: 4,
    });
    const recentlyUsed = new Set(
      recentAttempts.flatMap((attempt) => attempt.questionIds),
    );
    const unseenBank = bank.filter(
      (question) => !recentlyUsed.has(question.id),
    );
    const selectionBank = this.hasBalancedDifficultyCoverage(unseenBank)
      ? unseenBank
      : bank;

    const selected = ['Easy', 'Medium', 'Hard'].flatMap((difficulty) =>
      this.pickDiverseQuestions(
        selectionBank.filter((question) => question.difficulty === difficulty),
        DIAGNOSTIC_QUESTIONS_PER_DIFFICULTY,
      ),
    );
    return this.shuffle(selected);
  }

  private hasBalancedDifficultyCoverage(questions: Question[]): boolean {
    return (
      questions.length >= DIAGNOSTIC_QUESTION_COUNT &&
      ['Easy', 'Medium', 'Hard'].every(
        (difficulty) =>
          questions.filter((question) => question.difficulty === difficulty)
            .length >= DIAGNOSTIC_QUESTIONS_PER_DIFFICULTY,
      )
    );
  }

  private pickDiverseQuestions(
    candidates: Question[],
    count: number,
  ): Question[] {
    const pool = this.shuffle(candidates);
    const selected: Question[] = [];
    const bloomUsage = new Map<string, number>();
    const chapterUsage = new Map<string, number>();

    while (selected.length < count && pool.length > 0) {
      let bestIndex = 0;
      let bestScore = Number.POSITIVE_INFINITY;
      for (let index = 0; index < pool.length; index += 1) {
        const candidate = pool[index];
        const score =
          (bloomUsage.get(candidate.bloom_level) ?? 0) * 10 +
          (chapterUsage.get(candidate.chapter) ?? 0) * 3 -
          Math.min(candidate.quality_score ?? 0, 100) / 1000;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      }
      const next = pool.splice(bestIndex, 1)[0];
      selected.push(next);
      bloomUsage.set(
        next.bloom_level,
        (bloomUsage.get(next.bloom_level) ?? 0) + 1,
      );
      chapterUsage.set(next.chapter, (chapterUsage.get(next.chapter) ?? 0) + 1);
    }
    return selected;
  }

  private async getOwnedAttempt(
    userId: string,
    attemptId: string,
    withAnswers: boolean,
  ): Promise<DiagnosticAttempt> {
    const attempt = await this.attemptsRepository.findOne({
      where: { id: attemptId, userId },
      relations: withAnswers ? { answers: true } : undefined,
    });
    if (!attempt) {
      throw new NotFoundException('Diagnostic attempt not found.');
    }
    return attempt;
  }

  private async finalizeAttempt(
    attempt: DiagnosticAttempt,
    expired: boolean,
  ): Promise<void> {
    const questions = await this.questionsRepository.find({
      where: { id: In(attempt.questionIds) },
    });
    if (questions.length !== attempt.questionIds.length) {
      throw new ServiceUnavailableException(
        'A diagnostic question is no longer available. Please start a new diagnostic.',
      );
    }

    const answers =
      attempt.answers ??
      (await this.answersRepository.find({
        where: { attemptId: attempt.id },
      }));
    const answerByQuestion = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );
    const answeredRecords: DiagnosticAnswer[] = [];
    let correctCount = 0;

    for (const question of questions) {
      const answer = answerByQuestion.get(question.id);
      if (answer) {
        answer.isCorrect = answer.selectedOption === question.correct_answer;
        if (answer.isCorrect) {
          correctCount += 1;
        }
        answeredRecords.push(answer);
      }
    }

    if (answeredRecords.length > 0) {
      await this.answersRepository.save(answeredRecords);
    }

    const analysis = this.buildAnalysis(
      questions,
      answerByQuestion,
      correctCount,
    );
    attempt.correctCount = correctCount;
    attempt.scorePercent = analysis.scorePercent;
    attempt.analysis = analysis;
    attempt.status = expired
      ? DiagnosticAttemptStatus.EXPIRED
      : DiagnosticAttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    await this.attemptsRepository.save(attempt);
    if (!expired) {
      await this.awardXpAndStreak(
        attempt.userId,
        correctCount,
        analysis.scorePercent,
      );
      await this.syncTopicStatesFromDiagnostic(attempt, analysis);
    }
    if (attempt.mode === DiagnosticAttemptMode.TOPIC_PLACEMENT && !expired) {
      await this.applyTopicPlacement(attempt);
    }
  }

  private async applyTopicPlacement(attempt: DiagnosticAttempt): Promise<void> {
    if (!attempt.chapter || !attempt.topic || !attempt.analysis) return;
    const existing = await this.topicStatesRepository.findOne({
      where: {
        userId: attempt.userId,
        subject: attempt.subject,
        chapter: attempt.chapter,
        topic: attempt.topic,
      },
    });
    if (existing?.totalAnswered) return;
    const level = this.placementLevel(attempt.analysis.scorePercent);
    const state =
      existing ??
      this.topicStatesRepository.create({
        userId: attempt.userId,
        subject: attempt.subject,
        chapter: attempt.chapter,
        topic: attempt.topic,
        streakCounter: 0,
        totalAnswered: 0,
        totalCorrect: 0,
        masteredAt: null,
      });
    state.currentLevel = level;
    state.status = LearningTopicStatus.ACTIVE;
    state.lastActivityAt = new Date();
    await this.topicStatesRepository.save(state);
  }

  private async awardXpAndStreak(
    userId: string,
    correctCount: number,
    scorePercent: number,
  ): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return;
    const correctXp = correctCount * XP_PER_CORRECT_ANSWER;
    const bonusXp = scorePercent >= 80 ? XP_HIGH_SCORE_BONUS : 0;
    const xpEarned = Math.max(
      XP_MINIMUM_ATTEMPT,
      XP_PER_DIAGNOSTIC_SUBMITTED + correctXp + bonusXp,
    );
    user.xp += xpEarned;
    user.level = levelForXp(user.xp);
    user.streak += 1;
    await this.usersRepository.save(user);
  }

  private async syncTopicStatesFromDiagnostic(
    attempt: DiagnosticAttempt,
    analysis: DiagnosticAnalysis,
  ): Promise<void> {
    if (!analysis.topicPerformance || analysis.topicPerformance.length === 0)
      return;
    for (const row of analysis.topicPerformance) {
      const chapter = row.chapter ?? attempt.chapterScope[0] ?? '';
      const topic = row.topic ?? row.label;
      const existing = await this.topicStatesRepository.findOne({
        where: {
          userId: attempt.userId,
          subject: attempt.subject,
          chapter,
          topic,
        },
      });
      if (existing && existing.totalAnswered >= row.total) continue;
      const state =
        existing ??
        this.topicStatesRepository.create({
          userId: attempt.userId,
          subject: attempt.subject,
          chapter,
          topic,
          streakCounter: 0,
          totalAnswered: 0,
          totalCorrect: 0,
          masteredAt: null,
        });
      state.totalAnswered = row.total;
      state.totalCorrect = row.correct;
      state.status = LearningTopicStatus.ACTIVE;
      state.lastActivityAt = new Date();
      if (!existing) {
        state.currentLevel = this.placementLevel(
          row.total > 0 ? (row.correct / row.total) * 100 : 0,
        );
      }
      await this.topicStatesRepository.save(state);
    }
  }

  private placementLevel(score: number): number {
    if (score >= 85) return 9;
    if (score >= 70) return 7;
    if (score >= 55) return 5;
    if (score >= 40) return 3;
    return 1;
  }

  private buildAnalysis(
    questions: Question[],
    answers: Map<string, DiagnosticAnswer>,
    correctCount: number,
  ): DiagnosticAnalysis {
    const topics = new Map<
      string,
      { correct: number; total: number; chapter?: string; subject?: string }
    >();
    const blooms = new Map<string, { correct: number; total: number }>();

    for (const question of questions) {
      const correct =
        answers.get(question.id)?.selectedOption === question.correct_answer;
      const topic = topics.get(question.topic) ?? {
        correct: 0,
        total: 0,
        chapter: question.chapter,
        subject: question.subject,
      };
      topic.total += 1;
      if (correct) topic.correct += 1;
      topics.set(question.topic, topic);

      const bloomKey = normalizeBloomLevel(question.bloom_level);
      const bloom = blooms.get(bloomKey) ?? {
        correct: 0,
        total: 0,
      };
      bloom.total += 1;
      if (correct) bloom.correct += 1;
      blooms.set(bloomKey, bloom);
    }

    // Mark-weighted score: harder/higher-mark questions contribute more, so a
    // raw correct count no longer flattens a 1-mark and a 5-mark question.
    const totalMarks = questions.reduce(
      (sum, question) => sum + (question.marks ?? 1),
      0,
    );
    const earnedMarks = questions.reduce((sum, question) => {
      const correct =
        answers.get(question.id)?.selectedOption === question.correct_answer;
      return sum + (correct ? (question.marks ?? 1) : 0);
    }, 0);
    const scorePercent =
      totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;
    const makePerformance = (
      label: string,
      values: {
        correct: number;
        total: number;
        chapter?: string;
        subject?: string;
      },
    ): PerformanceRow => {
      const score = Math.round((values.correct / values.total) * 100);
      return {
        label,
        subject: values.subject,
        chapter: values.chapter,
        topic: label,
        correct: values.correct,
        total: values.total,
        score,
        status: score >= 70 ? 'strong' : score >= 40 ? 'average' : 'weak',
      };
    };

    const topicPerformance = Array.from(topics.entries())
      .map(([label, values]) => makePerformance(label, values))
      .sort((left, right) => left.label.localeCompare(right.label));
    const bloomPerformance = BLOOM_LEVELS.filter((level) =>
      blooms.has(level),
    ).map((level) => makePerformance(level, blooms.get(level)!));

    const grade: DiagnosticAnalysis['grade'] =
      scorePercent >= 80
        ? 'Excellent'
        : scorePercent >= 60
          ? 'Good'
          : scorePercent >= 40
            ? 'Average'
            : 'Needs work';
    const weakTopics = topicPerformance
      .filter((performance) => performance.total >= 2 && performance.score < 50)
      .map((performance) => performance.label);

    return {
      total: questions.length,
      correct: correctCount,
      incorrect: questions.length - correctCount,
      scorePercent,
      grade,
      topicPerformance,
      bloomPerformance,
      weakTopics,
      recap: this.buildRecap(scorePercent, grade, topicPerformance, weakTopics),
      integrity: this.buildIntegritySignal(questions, answers),
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * A deterministic, one-line summary of the attempt. It reads like an AI
   * recap but is assembled purely from the computed performance rows, so it is
   * instant, free, and always available — the "fallback-first" default the AI
   * roadmap asks for. No model call is made here.
   */
  private buildRecap(
    scorePercent: number,
    grade: DiagnosticAnalysis['grade'],
    topicPerformance: PerformanceRow[],
    weakTopics: string[],
  ): string {
    const strongest = (topicPerformance ?? [])
      .filter((row) => row.status === 'strong')
      .sort((left, right) => right.score - left.score)
      .slice(0, 2)
      .map((row) => row.label);

    const gradeText = grade ? grade.toLowerCase() : 'scored';
    const parts = [`You scored ${scorePercent ?? 0}% — ${gradeText}.`];
    if (strongest.length > 0) {
      parts.push(`Strongest on ${this.joinReadable(strongest)}.`);
    }
    if (weakTopics.length > 0) {
      parts.push(`Focus next on ${this.joinReadable(weakTopics.slice(0, 3))}.`);
    } else if (topicPerformance.length > 0) {
      parts.push(
        'No topic fell below the repair line — keep consolidating with mixed practice.',
      );
    }
    return parts.join(' ');
  }

  private joinReadable(items: string[]): string {
    if (items.length <= 1) return items[0] ?? '';
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
  }

  /**
   * Heuristic guess-detection for admins. Two independent signals: a burst of
   * implausibly fast wrong answers, and a lopsided reuse of one option slot
   * (the classic "all C" pattern). Deliberately conservative — it only flags,
   * never penalises, and the result is admin-visible only.
   */
  private buildIntegritySignal(
    questions: Question[],
    answers: Map<string, DiagnosticAnswer>,
  ): IntegritySignal {
    const FAST_ANSWER_SECONDS = 5;
    const MIN_ANSWERED_FOR_SIGNAL = 5;
    const FAST_WRONG_RATIO_THRESHOLD = 0.4;
    const DOMINANT_OPTION_THRESHOLD = 0.8;

    let answeredCount = 0;
    let fastWrongCount = 0;
    const optionSlotCounts = new Map<number, number>();

    for (const question of questions) {
      const answer = answers.get(question.id);
      if (!answer || answer.selectedOption == null) continue;
      answeredCount += 1;
      const correct = answer.selectedOption === question.correct_answer;
      if (
        answer.elapsedSeconds != null &&
        answer.elapsedSeconds > 0 &&
        answer.elapsedSeconds <= FAST_ANSWER_SECONDS &&
        !correct
      ) {
        fastWrongCount += 1;
      }
      const slot = Array.isArray(question.options)
        ? question.options.indexOf(answer.selectedOption)
        : -1;
      if (slot >= 0) {
        optionSlotCounts.set(slot, (optionSlotCounts.get(slot) ?? 0) + 1);
      }
    }

    const dominantCount =
      optionSlotCounts.size > 0 ? Math.max(...optionSlotCounts.values()) : 0;
    const dominantOptionShare =
      answeredCount > 0 ? dominantCount / answeredCount : 0;
    const fastWrongRatio =
      answeredCount > 0 ? fastWrongCount / answeredCount : 0;

    const enoughData = answeredCount >= MIN_ANSWERED_FOR_SIGNAL;
    const fastWrongFlag =
      enoughData && fastWrongRatio >= FAST_WRONG_RATIO_THRESHOLD;
    const patternFlag =
      enoughData && dominantOptionShare >= DOMINANT_OPTION_THRESHOLD;
    const guessingSuspected = fastWrongFlag || patternFlag;

    let note: string | null = null;
    if (guessingSuspected) {
      const reasons: string[] = [];
      if (fastWrongFlag) {
        reasons.push(
          `${fastWrongCount} of ${answeredCount} answers were both very fast (≤${FAST_ANSWER_SECONDS}s) and wrong`,
        );
      }
      if (patternFlag) {
        reasons.push(
          `${Math.round(dominantOptionShare * 100)}% of answers reused the same option position`,
        );
      }
      note = `Possible guess pattern: ${reasons.join('; ')}.`;
    }

    return {
      guessingSuspected,
      fastWrongCount,
      dominantOptionShare: Math.round(dominantOptionShare * 100) / 100,
      note,
    };
  }

  private async toAttemptPayload(attempt: DiagnosticAttempt) {
    const questions = await this.questionsRepository.find({
      where: { id: In(attempt.questionIds) },
    });
    const questionById = new Map(
      questions.map((question) => [question.id, question]),
    );
    const orderedQuestions = attempt.questionIds.map((id) =>
      questionById.get(id),
    );
    if (orderedQuestions.some((question) => !question)) {
      throw new ServiceUnavailableException(
        'The diagnostic question set is unavailable. Please begin a new diagnostic.',
      );
    }
    const answers = attempt.answers ?? [];

    return {
      data: {
        attempt: {
          id: attempt.id,
          title: attempt.title,
          subject: attempt.subject,
          chapters: attempt.chapterScope,
          status: attempt.status,
          totalQuestions: attempt.totalQuestions,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          remainingSeconds: Math.max(
            0,
            Math.ceil((attempt.expiresAt.getTime() - Date.now()) / 1000),
          ),
        },
        questions: orderedQuestions.map((question, index) =>
          this.toPublicQuestion(question!, index + 1),
        ),
        answers: answers.map((answer) => ({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
        })),
      },
    };
  }

  private toPublicQuestion(
    question: Question,
    position: number,
  ): PublicDiagnosticQuestion & { position: number } {
    return {
      id: question.id,
      questionId: question.question_id,
      chapter: question.chapter,
      topic: question.topic,
      questionText: question.question_text,
      options: question.options,
      difficulty: question.difficulty,
      bloomLevel: question.bloom_level,
      marks: question.marks,
      position,
    };
  }

  private toAnalysisPayload(attempt: DiagnosticAttempt, isAdmin = false) {
    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
      },
      analysis: this.viewAnalysisFor(attempt.analysis, isAdmin),
    };
  }

  /**
   * Prepares a stored analysis for the wire. Two concerns:
   *
   *  1. **Recap backfill.** The recap is deterministic and derived purely from
   *     rows the analysis already carries, so attempts finalized before the
   *     recap existed get one computed on read — the AI recap then shows on
   *     every historical attempt, not only new ones.
   *  2. **Integrity redaction.** The guessing heuristic is admin-only, so it is
   *     stripped before a student's own analysis leaves the server. The raw
   *     signal stays in storage; only the outward view is gated.
   */
  private viewAnalysisFor(
    analysis: DiagnosticAnalysis | null,
    isAdmin: boolean,
  ): DiagnosticAnalysis | null {
    if (!analysis) return analysis;
    const recap =
      analysis.recap ??
      this.buildRecap(
        analysis.scorePercent,
        analysis.grade,
        analysis.topicPerformance ?? [],
        analysis.weakTopics ?? [],
      );
    const integrity =
      isAdmin || !analysis.integrity
        ? analysis.integrity
        : {
            guessingSuspected: false,
            fastWrongCount: 0,
            dominantOptionShare: 0,
            note: null,
          };
    return { ...analysis, recap, integrity };
  }

  private toHistoryItem(attempt: DiagnosticAttempt) {
    return {
      id: attempt.id,
      title: attempt.title,
      status: attempt.status,
      completedAt: attempt.submittedAt,
      scorePercent: attempt.scorePercent,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      weakTopics: attempt.analysis?.weakTopics ?? [],
    };
  }

  private toResourcePayload(resource: LearningResource) {
    return {
      id: resource.id,
      type: resource.resourceType,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      content: resource.content,
    };
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(index + 1);
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }
}
