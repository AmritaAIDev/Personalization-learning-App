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
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  BLOOM_LEVELS,
  normalizeBloomLevel,
  TutorMessageType,
} from '../adaptive/adaptive.types';
import { AgentService, RetrievedSource } from '../agent/agent.service';
import { calibrationFor } from '../confidence.util';
import { ExplanationResult, toCitations } from '../citation.util';
import { Question, QuestionPublicationStatus } from '../question.entity';
import { PracticeAnswer } from './practice-answer.entity';
import { PracticeAttempt } from './practice-attempt.entity';
import {
  CreatePracticeSessionDto,
  ExplainQuestionDto,
  SavePracticeAnswerDto,
} from './practice.dto';
import {
  PRACTICE_DIFFICULTIES,
  PRACTICE_PER_DIFFICULTY,
  PracticeAnalysis,
  PracticeAttemptStatus,
  PracticePerformanceRow,
} from './practice.types';

type PublicPracticeQuestion = {
  id: string;
  questionId: string;
  subject: string;
  chapter: string;
  topic: string;
  questionText: string;
  options: string[];
  difficulty: string;
  bloomLevel: string;
  marks: number;
  position: number;
};

type PracticeAttemptPayload = {
  attempt: {
    id: string;
    title: string;
    subject: string;
    chapter: string;
    topic: string;
    status: PracticeAttemptStatus;
    totalQuestions: number;
    startedAt: Date;
    /** Real composition of this attempt, never a hardcoded UI assumption. */
    difficultyMix: Array<{ label: string; count: number }>;
  };
  questions: PublicPracticeQuestion[];
  answers: Array<{ questionId: string; selectedOption: string }>;
};

type ScoreBucket = {
  correct: number;
  total: number;
};

@Injectable()
export class PracticeService {
  constructor(
    @InjectRepository(PracticeAttempt)
    private readonly attemptsRepository: Repository<PracticeAttempt>,
    @InjectRepository(PracticeAnswer)
    private readonly answersRepository: Repository<PracticeAnswer>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    private readonly agentService: AgentService,
  ) {}

  async createOrResume(
    user: AuthenticatedUser,
    input: CreatePracticeSessionDto,
  ): Promise<PracticeAttemptPayload> {
    const activeAttempt = await this.attemptsRepository.findOne({
      where: {
        userId: user.id,
        subject: input.subject,
        chapter: input.chapter,
        topic: input.topic,
        status: PracticeAttemptStatus.IN_PROGRESS,
      },
      relations: { answers: true },
      order: { startedAt: 'DESC' },
    });

    if (activeAttempt) {
      return this.toAttemptPayload(activeAttempt);
    }

    // Only the columns the balancer reads are loaded here; the full rows are
    // fetched once for the selected fifteen when the payload is built.
    const candidates = await this.questionsRepository.find({
      where: {
        subject: input.subject,
        chapter: input.chapter,
        topic: input.topic,
        status: QuestionPublicationStatus.PUBLISHED,
      },
      select: {
        id: true,
        topic: true,
        difficulty: true,
        bloom_level: true,
        concept_tags: true,
      },
      order: { created_at: 'ASC' },
    });
    const questions = this.selectBalancedQuestionSet(candidates);
    const startedAt = new Date();
    const attempt = this.attemptsRepository.create({
      userId: user.id,
      subject: input.subject,
      chapter: input.chapter,
      topic: input.topic,
      title: input.topic + ' practice set',
      questionIds: questions.map((question) => question.id),
      status: PracticeAttemptStatus.IN_PROGRESS,
      totalQuestions: questions.length,
      correctCount: 0,
      scorePercent: 0,
      analysis: null,
      startedAt,
      submittedAt: null,
    });
    await this.attemptsRepository.save(attempt);
    return this.toAttemptPayload({ ...attempt, answers: [] });
  }

  async getAttempt(
    userId: string,
    attemptId: string,
  ): Promise<PracticeAttemptPayload> {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    return this.toAttemptPayload(attempt);
  }

  /**
   * Autosave path. It runs on every option tap, so it stays deliberately lean:
   * one attempt lookup, one option check, and one conflict-safe upsert. No
   * answer relations are loaded and no correctness is ever computed here.
   */
  async saveAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    input: SavePracticeAnswerDto,
  ) {
    const attempt = await this.attemptsRepository.findOne({
      where: { id: attemptId, userId },
      select: { id: true, status: true, questionIds: true },
    });
    if (!attempt) {
      throw new NotFoundException('Practice session not found.');
    }
    if (attempt.status !== PracticeAttemptStatus.IN_PROGRESS) {
      throw new ConflictException(
        'This practice session has already been submitted.',
      );
    }
    if (!attempt.questionIds.includes(questionId)) {
      throw new NotFoundException(
        'Question is not part of this practice session.',
      );
    }

    const question = await this.questionsRepository.findOne({
      where: { id: questionId },
      select: { id: true, options: true },
    });
    if (!question) {
      throw new NotFoundException('Question not found.');
    }
    if (!question.options.includes(input.selectedOption)) {
      throw new BadRequestException(
        'Selected option is not valid for this question.',
      );
    }

    const savedAt = new Date();
    await this.answersRepository.upsert(
      {
        attemptId: attempt.id,
        questionId,
        selectedOption: input.selectedOption,
        elapsedSeconds: input.elapsedSeconds ?? null,
        confidence: input.confidence ?? null,
        isCorrect: null,
      },
      { conflictPaths: ['attemptId', 'questionId'] },
    );
    return {
      questionId,
      selectedOption: input.selectedOption,
      savedAt,
    };
  }

  async submitAttempt(userId: string, attemptId: string) {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (attempt.status !== PracticeAttemptStatus.IN_PROGRESS) {
      throw new ConflictException(
        'This practice session has already been submitted.',
      );
    }

    const questions = await this.getQuestionsForAttempt(attempt);
    const answers =
      attempt.answers ??
      (await this.answersRepository.find({ where: { attemptId: attempt.id } }));
    const answerByQuestion = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );
    let correctCount = 0;
    const changedAnswers: PracticeAnswer[] = [];

    for (const question of questions) {
      const answer = answerByQuestion.get(question.id);
      if (!answer) {
        continue;
      }
      answer.isCorrect = answer.selectedOption === question.correct_answer;
      if (answer.isCorrect) {
        correctCount += 1;
      }
      changedAnswers.push(answer);
    }

    if (changedAnswers.length > 0) {
      await this.answersRepository.save(changedAnswers);
    }

    const analysis = this.buildAnalysis(
      questions,
      answerByQuestion,
      correctCount,
    );
    attempt.correctCount = correctCount;
    attempt.scorePercent = analysis.scorePercent;
    attempt.analysis = analysis;
    attempt.status = PracticeAttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    await this.attemptsRepository.save(attempt);

    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
      },
      analysis,
    };
  }

  async getReview(userId: string, attemptId: string) {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (
      attempt.status !== PracticeAttemptStatus.SUBMITTED ||
      !attempt.analysis
    ) {
      throw new ConflictException(
        'Submit this practice session before viewing explanations.',
      );
    }
    const questions = await this.getQuestionsForAttempt(attempt);
    const answers =
      attempt.answers ??
      (await this.answersRepository.find({ where: { attemptId: attempt.id } }));
    const answerByQuestion = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );

    return {
      attempt: {
        id: attempt.id,
        title: attempt.title,
        subject: attempt.subject,
        chapter: attempt.chapter,
        topic: attempt.topic,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
      },
      analysis: attempt.analysis,
      results: questions.map((question, index) => {
        const answer = answerByQuestion.get(question.id);
        const isCorrect = answer?.isCorrect ?? false;
        return {
          position: index + 1,
          id: question.id,
          questionId: question.question_id,
          questionText: question.question_text,
          options: question.options,
          selectedOption: answer?.selectedOption ?? null,
          correctOption: question.correct_answer,
          isCorrect,
          solution: question.solution,
          conceptTags: question.concept_tags ?? [],
          commonErrors: question.common_errors ?? [],
          difficulty: question.difficulty,
          bloomLevel: question.bloom_level,
          confidence: answer?.confidence ?? null,
          calibration: calibrationFor(answer?.confidence ?? null, isCorrect),
        };
      }),
    };
  }

  /**
   * On-demand "Explain this" for a single reviewed question. The attempt is
   * already submitted, so the answer key is the learner's to see — the tutor is
   * asked to teach it fully at the requested depth. If the model is
   * unavailable, it degrades to the reviewed stored solution so the button
   * never dead-ends.
   */
  async explainReviewQuestion(
    userId: string,
    attemptId: string,
    questionId: string,
    input: ExplainQuestionDto,
  ): Promise<ExplanationResult> {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (
      attempt.status !== PracticeAttemptStatus.SUBMITTED ||
      !attempt.analysis
    ) {
      throw new ConflictException(
        'Submit this practice session before requesting an explanation.',
      );
    }
    if (!attempt.questionIds.includes(questionId)) {
      throw new NotFoundException(
        'Question is not part of this practice session.',
      );
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
        ),
        grounded: false,
        sources: toCitations(sources),
      };
    }
  }

  /** Deterministic explanation used when the model is unavailable. */
  private fallbackExplanation(
    question: Question,
    selectedOption: string | null,
  ): string {
    const misconception = (question.common_errors ?? [])[0];
    const lines = ['### Correct answer', `**${question.correct_answer}**`];
    if (selectedOption && selectedOption !== question.correct_answer) {
      lines.push(
        '### Where your choice went wrong',
        misconception
          ? `A common cause of “${selectedOption}” is: ${misconception}`
          : `Compare “${selectedOption}” against the governing relationship for this topic.`,
      );
    }
    lines.push('### Worked reasoning', question.solution);
    return lines.join('\n\n');
  }

  private async getOwnedAttempt(
    userId: string,
    attemptId: string,
    withAnswers: boolean,
  ): Promise<PracticeAttempt> {
    const attempt = await this.attemptsRepository.findOne({
      where: { id: attemptId, userId },
      relations: withAnswers ? { answers: true } : undefined,
    });
    if (!attempt) {
      throw new NotFoundException('Practice session not found.');
    }
    return attempt;
  }

  private async getQuestionsForAttempt(
    attempt: PracticeAttempt,
  ): Promise<Question[]> {
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
        'A practice question is no longer available. Please start a new session.',
      );
    }
    return orderedQuestions as Question[];
  }

  private selectBalancedQuestionSet(candidates: Question[]): Question[] {
    // Adaptive sizing: aim for five per difficulty, but degrade gracefully to
    // the largest balanced set the topic actually has (minimum one per tier) so
    // a topic with a thinner bank still opens instead of 503-ing. Well-stocked
    // topics still get the full 15-question set.
    const selected: Question[] = [];
    for (const difficulty of PRACTICE_DIFFICULTIES) {
      const tier = candidates.filter(
        (question) => question.difficulty === difficulty,
      );
      if (tier.length === 0) {
        throw new ServiceUnavailableException(
          'This topic needs at least one published Easy, Medium, and Hard question before practice can start.',
        );
      }
      const target = Math.min(PRACTICE_PER_DIFFICULTY, tier.length);
      selected.push(...this.pickDiverseQuestions(tier, target));
    }
    return this.shuffle(selected);
  }

  private pickDiverseQuestions(
    candidates: Question[],
    count: number,
  ): Question[] {
    const pool = this.shuffle(candidates);
    const selected: Question[] = [];
    const bloomUsage = new Map<string, number>();
    const conceptUsage = new Map<string, number>();

    while (selected.length < count && pool.length > 0) {
      let bestIndex = 0;
      let bestScore = Number.POSITIVE_INFINITY;
      for (let index = 0; index < pool.length; index += 1) {
        const candidate = pool[index];
        const primaryConcept = candidate.concept_tags?.[0] ?? candidate.topic;
        const score =
          (bloomUsage.get(candidate.bloom_level) ?? 0) * 10 +
          (conceptUsage.get(primaryConcept) ?? 0) * 3;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      }

      const next = pool.splice(bestIndex, 1)[0];
      const primaryConcept = next.concept_tags?.[0] ?? next.topic;
      selected.push(next);
      bloomUsage.set(
        next.bloom_level,
        (bloomUsage.get(next.bloom_level) ?? 0) + 1,
      );
      conceptUsage.set(
        primaryConcept,
        (conceptUsage.get(primaryConcept) ?? 0) + 1,
      );
    }
    return selected;
  }

  private buildAnalysis(
    questions: Question[],
    answers: Map<string, PracticeAnswer>,
    correctCount: number,
  ): PracticeAnalysis {
    const difficulties = new Map<string, ScoreBucket>();
    const blooms = new Map<string, ScoreBucket>();
    const concepts = new Map<string, ScoreBucket>();

    for (const question of questions) {
      const correct =
        answers.get(question.id)?.selectedOption === question.correct_answer;
      this.addScore(difficulties, question.difficulty, correct);
      this.addScore(blooms, normalizeBloomLevel(question.bloom_level), correct);
      for (const concept of question.concept_tags ?? []) {
        this.addScore(concepts, concept, correct);
      }
    }

    const makePerformance = (
      label: string,
      value: ScoreBucket,
    ): PracticePerformanceRow => {
      const score = Math.round((value.correct / value.total) * 100);
      return {
        label,
        correct: value.correct,
        total: value.total,
        score,
        status: score >= 70 ? 'strong' : score >= 40 ? 'average' : 'weak',
      };
    };

    const difficultyPerformance = PRACTICE_DIFFICULTIES.filter((difficulty) =>
      difficulties.has(difficulty),
    ).map((difficulty) =>
      makePerformance(difficulty, difficulties.get(difficulty)!),
    );
    const bloomPerformance = BLOOM_LEVELS.filter((level) =>
      blooms.has(level),
    ).map((level) => makePerformance(level, blooms.get(level)!));
    const conceptPerformance = Array.from(concepts.entries()).map(
      ([label, value]) => makePerformance(label, value),
    );
    const scorePercent = Math.round((correctCount / questions.length) * 100);

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
      difficultyPerformance,
      bloomPerformance,
      weakConcepts: conceptPerformance
        .filter((performance) => performance.score < 50)
        .sort((left, right) => left.label.localeCompare(right.label))
        .map((performance) => performance.label),
      calculatedAt: new Date().toISOString(),
    };
  }

  private addScore(
    collection: Map<string, ScoreBucket>,
    label: string,
    correct: boolean,
  ): void {
    const current = collection.get(label) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (correct) {
      current.correct += 1;
    }
    collection.set(label, current);
  }

  private async toAttemptPayload(
    attempt: PracticeAttempt,
  ): Promise<PracticeAttemptPayload> {
    const questions = await this.getQuestionsForAttempt(attempt);
    const answers =
      attempt.answers ??
      (await this.answersRepository.find({ where: { attemptId: attempt.id } }));
    return {
      attempt: {
        id: attempt.id,
        title: attempt.title,
        subject: attempt.subject,
        chapter: attempt.chapter,
        topic: attempt.topic,
        status: attempt.status,
        totalQuestions: attempt.totalQuestions,
        startedAt: attempt.startedAt,
        difficultyMix: PRACTICE_DIFFICULTIES.map((difficulty) => ({
          label: difficulty,
          count: questions.filter(
            (question) => question.difficulty === difficulty,
          ).length,
        })).filter((entry) => entry.count > 0),
      },
      questions: questions.map((question, index) => ({
        id: question.id,
        questionId: question.question_id,
        subject: question.subject,
        chapter: question.chapter,
        topic: question.topic,
        questionText: question.question_text,
        options: question.options,
        difficulty: question.difficulty,
        bloomLevel: question.bloom_level,
        marks: question.marks,
        position: index + 1,
      })),
      answers: answers
        .filter(
          (answer): answer is PracticeAnswer & { selectedOption: string } =>
            typeof answer.selectedOption === 'string',
        )
        .map((answer) => ({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
        })),
    };
  }

  private shuffle<T>(values: T[]): T[] {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = randomInt(index + 1);
      [result[index], result[randomIndex]] = [
        result[randomIndex],
        result[index],
      ];
    }
    return result;
  }
}
