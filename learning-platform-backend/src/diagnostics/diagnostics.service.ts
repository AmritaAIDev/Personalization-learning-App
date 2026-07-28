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
import { BLOOM_LEVELS, normalizeBloomLevel } from '../adaptive/adaptive.types';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DiagnosticAnswer } from './diagnostic-answer.entity';
import { DiagnosticAttempt } from './diagnostic-attempt.entity';
import {
  ClearDiagnosticHistoryDto,
  CreateDiagnosticDto,
  SaveDiagnosticAnswerDto,
} from './diagnostic.dto';
import { LearningResource } from './learning-resource.entity';
import {
  DiagnosticAnalysis,
  DiagnosticAttemptStatus,
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
  ) {}

  async createAttempt(user: AuthenticatedUser, input: CreateDiagnosticDto) {
    const subject = input.subject ?? DIAGNOSTIC_SUBJECT;
    const activeAttempt = await this.attemptsRepository.findOne({
      where: {
        userId: user.id,
        status: DiagnosticAttemptStatus.IN_PROGRESS,
      },
      relations: { answers: true },
      order: { startedAt: 'DESC' },
    });

    if (activeAttempt && activeAttempt.expiresAt.getTime() > Date.now()) {
      return this.toAttemptPayload(activeAttempt);
    }

    if (activeAttempt) {
      await this.finalizeAttempt(activeAttempt, true);
    }

    const questions = await this.getQuestionSet(subject);
    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + DIAGNOSTIC_DURATION_MINUTES * 60 * 1000,
    );
    const attempt = this.attemptsRepository.create({
      userId: user.id,
      subject,
      title: 'Class XII Physics - Electrostatics Diagnostic',
      chapterScope: [...ELECTROSTATICS_CHAPTERS],
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
        isCorrect: null,
      });
    } else {
      answer.selectedOption = input.selectedOption;
      answer.elapsedSeconds = input.elapsedSeconds ?? answer.elapsedSeconds;
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

  async submitAttempt(userId: string, attemptId: string) {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (attempt.analysis) {
      return { data: this.toAnalysisPayload(attempt) };
    }

    await this.finalizeAttempt(
      attempt,
      attempt.expiresAt.getTime() <= Date.now(),
    );
    return { data: this.toAnalysisPayload(attempt) };
  }

  async getAnalysis(userId: string, attemptId: string) {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (!attempt.analysis && attempt.expiresAt.getTime() <= Date.now()) {
      await this.finalizeAttempt(attempt, true);
    }
    if (!attempt.analysis) {
      throw new ConflictException(
        'Submit the diagnostic before viewing its analysis.',
      );
    }
    return { data: this.toAnalysisPayload(attempt) };
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
    const completedAttempts = await this.attemptsRepository.find({
      where: {
        userId,
        status: In([
          DiagnosticAttemptStatus.SUBMITTED,
          DiagnosticAttemptStatus.EXPIRED,
        ]),
      },
      order: { submittedAt: 'DESC' },
    });
    const activeAttempt = await this.attemptsRepository.findOne({
      where: { userId, status: DiagnosticAttemptStatus.IN_PROGRESS },
      order: { startedAt: 'DESC' },
    });
    const publishedQuestions = await this.questionsRepository.find({
      where: {
        subject: DIAGNOSTIC_SUBJECT,
        chapter: In([...ELECTROSTATICS_CHAPTERS]),
        status: QuestionPublicationStatus.PUBLISHED,
      },
    });
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

  private async getQuestionSet(subject: string): Promise<Question[]> {
    const bank = await this.questionsRepository.find({
      where: {
        subject,
        chapter: In([...ELECTROSTATICS_CHAPTERS]),
        status: QuestionPublicationStatus.PUBLISHED,
      },
      order: { question_id: 'ASC' },
    });
    if (!this.hasBalancedDifficultyCoverage(bank)) {
      throw new ServiceUnavailableException(
        'The diagnostic question bank needs at least five published Easy, Medium, and Hard questions.',
      );
    }

    const selected = ['Easy', 'Medium', 'Hard'].flatMap((difficulty) =>
      this.pickDiverseQuestions(
        bank.filter((question) => question.difficulty === difficulty),
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
          (chapterUsage.get(candidate.chapter) ?? 0) * 3;
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
  }

  private buildAnalysis(
    questions: Question[],
    answers: Map<string, DiagnosticAnswer>,
    correctCount: number,
  ): DiagnosticAnalysis {
    const topics = new Map<string, { correct: number; total: number }>();
    const blooms = new Map<string, { correct: number; total: number }>();

    for (const question of questions) {
      const correct =
        answers.get(question.id)?.selectedOption === question.correct_answer;
      const topic = topics.get(question.topic) ?? { correct: 0, total: 0 };
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

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const makePerformance = (
      label: string,
      values: { correct: number; total: number },
    ): PerformanceRow => {
      const score = Math.round((values.correct / values.total) * 100);
      return {
        label,
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

    return {
      total: questions.length,
      correct: correctCount,
      incorrect: questions.length - correctCount,
      scorePercent,
      grade:
        scorePercent >= 80
          ? 'Excellent'
          : scorePercent >= 60
            ? 'Good'
            : scorePercent >= 40
              ? 'Average'
              : 'Needs work',
      topicPerformance,
      bloomPerformance,
      weakTopics: topicPerformance
        .filter((performance) => performance.score < 50)
        .map((performance) => performance.label),
      calculatedAt: new Date().toISOString(),
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

  private toAnalysisPayload(attempt: DiagnosticAttempt) {
    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
      },
      analysis: attempt.analysis,
    };
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
