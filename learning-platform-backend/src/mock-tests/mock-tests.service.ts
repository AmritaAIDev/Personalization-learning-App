import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { In, LessThan, Repository } from 'typeorm';
import { Question, QuestionPublicationStatus } from '../question.entity';
import { MockTestAnswer } from './mock-test-answer.entity';
import { MockTestAttempt } from './mock-test-attempt.entity';
import { SaveMockTestAnswerDto } from './mock-test.dto';
import {
  MOCK_TEST_DURATION_MINUTES,
  MOCK_TEST_MARKS_CORRECT,
  MOCK_TEST_MARKS_INCORRECT,
  MOCK_TEST_QUESTIONS_PER_SUBJECT,
  MOCK_TEST_SUBJECTS,
  MockTestAttemptStatus,
  type DifficultyCount,
  type SubjectBreakdown,
  type SubjectCount,
} from './mock-test.types';

type PublicMockTestQuestion = {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  questionText: string;
  options: string[];
  difficulty: string;
  bloomLevel: string;
  marks: number;
};

type MockTestAttemptPayload = {
  attempt: {
    id: string;
    status: MockTestAttemptStatus;
    totalQuestions: number;
    subjectCounts: SubjectCount[];
    difficultyMix: DifficultyCount[];
    startedAt: Date;
    expiresAt: Date;
    submittedAt: Date | null;
    scorePercent: number;
    percentile: number | null;
  };
  questions: PublicMockTestQuestion[];
  answers: Array<{ questionId: string; selectedOption: string }>;
};

type MockTestReviewItem = PublicMockTestQuestion & {
  correctAnswer: string;
  solution: string;
  selectedOption: string | null;
  isCorrect: boolean | null;
  marksAwarded: number | null;
};

type MockTestReviewPayload = {
  attempt: MockTestAttemptPayload['attempt'];
  subjectBreakdown: SubjectBreakdown[];
  /** Chapters that cost the most marks in this attempt, worst first. */
  weakestChapters: Array<{
    subject: string;
    chapter: string;
    lostMarks: number;
    incorrect: number;
    unattempted: number;
  }>;
  items: MockTestReviewItem[];
};

@Injectable()
export class MockTestsService {
  constructor(
    @InjectRepository(MockTestAttempt)
    private readonly attemptsRepository: Repository<MockTestAttempt>,
    @InjectRepository(MockTestAnswer)
    private readonly answersRepository: Repository<MockTestAnswer>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
  ) {}

  async createAttempt(userId: string): Promise<MockTestAttemptPayload> {
    const activeAttempt = await this.attemptsRepository.findOne({
      where: { userId, status: MockTestAttemptStatus.IN_PROGRESS },
      order: { startedAt: 'DESC' },
    });
    if (activeAttempt && activeAttempt.expiresAt.getTime() > Date.now()) {
      const [questions, answers] = await Promise.all([
        this.loadQuestionsInOrder(activeAttempt.questionIds),
        this.answersRepository.find({
          where: { attemptId: activeAttempt.id },
        }),
      ]);
      return this.toAttemptPayload(activeAttempt, answers, questions);
    }
    if (activeAttempt) {
      await this.finalizeAttempt(activeAttempt);
    }

    const { questions, subjectCounts, difficultyMix } =
      await this.drawFullMockSet();
    if (questions.length === 0) {
      throw new ServiceUnavailableException(
        'Not enough published questions are available yet to assemble a full mock test.',
      );
    }

    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + MOCK_TEST_DURATION_MINUTES * 60 * 1000,
    );
    const attempt = this.attemptsRepository.create({
      userId,
      status: MockTestAttemptStatus.IN_PROGRESS,
      questionIds: questions.map((question) => question.id),
      totalQuestions: questions.length,
      subjectCounts,
      difficultyMix,
      maxPossibleScore: questions.length * MOCK_TEST_MARKS_CORRECT,
      startedAt,
      expiresAt,
    });
    await this.attemptsRepository.save(attempt);
    return this.toAttemptPayload(attempt, [], questions);
  }

  async getAttempt(
    userId: string,
    attemptId: string,
  ): Promise<MockTestAttemptPayload> {
    const attempt = await this.getOwnedAttempt(userId, attemptId);
    if (
      attempt.status === MockTestAttemptStatus.IN_PROGRESS &&
      attempt.expiresAt.getTime() <= Date.now()
    ) {
      await this.finalizeAttempt(attempt);
    }
    const [answers, questions] = await Promise.all([
      this.answersRepository.find({ where: { attemptId: attempt.id } }),
      attempt.status === MockTestAttemptStatus.IN_PROGRESS
        ? this.loadQuestionsInOrder(attempt.questionIds)
        : Promise.resolve([]),
    ]);
    return this.toAttemptPayload(attempt, answers, questions);
  }

  async saveAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    input: SaveMockTestAnswerDto,
  ): Promise<void> {
    const attempt = await this.getOwnedAttempt(userId, attemptId);
    if (attempt.status !== MockTestAttemptStatus.IN_PROGRESS) {
      throw new ConflictException('This mock test has already been submitted.');
    }
    if (attempt.expiresAt.getTime() <= Date.now()) {
      await this.finalizeAttempt(attempt);
      throw new ConflictException('The mock test time limit has expired.');
    }
    if (!attempt.questionIds.includes(questionId)) {
      throw new NotFoundException('Question is not part of this mock test.');
    }
    const question = await this.questionsRepository.findOne({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException('Question not found.');
    if (!question.options.includes(input.selectedOption)) {
      throw new BadRequestException(
        'Selected option is not valid for this question.',
      );
    }

    const existing = await this.answersRepository.findOne({
      where: { attemptId: attempt.id, questionId },
    });
    if (existing) {
      existing.selectedOption = input.selectedOption;
      existing.elapsedSeconds = input.elapsedSeconds ?? existing.elapsedSeconds;
      await this.answersRepository.save(existing);
      return;
    }
    await this.answersRepository.save(
      this.answersRepository.create({
        attemptId: attempt.id,
        questionId,
        selectedOption: input.selectedOption,
        elapsedSeconds: input.elapsedSeconds ?? null,
      }),
    );
  }

  async submit(
    userId: string,
    attemptId: string,
  ): Promise<MockTestAttemptPayload> {
    const attempt = await this.getOwnedAttempt(userId, attemptId);
    if (attempt.status !== MockTestAttemptStatus.IN_PROGRESS) {
      return this.toAttemptPayload(
        attempt,
        await this.answersRepository.find({ where: { attemptId } }),
      );
    }
    await this.finalizeAttempt(attempt);
    const [refreshed, answers] = await Promise.all([
      this.getOwnedAttempt(userId, attemptId),
      this.answersRepository.find({ where: { attemptId } }),
    ]);
    return this.toAttemptPayload(refreshed, answers);
  }

  async getReview(
    userId: string,
    attemptId: string,
  ): Promise<MockTestReviewPayload> {
    const attempt = await this.getOwnedAttempt(userId, attemptId);
    if (attempt.status !== MockTestAttemptStatus.SUBMITTED) {
      throw new ConflictException('Submit this mock test before reviewing it.');
    }
    const [questions, answers] = await Promise.all([
      this.questionsRepository.find({
        where: { id: In(attempt.questionIds) },
      }),
      this.answersRepository.find({ where: { attemptId } }),
    ]);
    const questionsById = new Map(questions.map((q) => [q.id, q]));
    const answersByQuestion = new Map(answers.map((a) => [a.questionId, a]));

    const items: MockTestReviewItem[] = attempt.questionIds
      .map((id) => questionsById.get(id))
      .filter((question): question is Question => Boolean(question))
      .map((question) => {
        const answer = answersByQuestion.get(question.id);
        return {
          ...this.toPublicQuestion(question),
          correctAnswer: question.correct_answer,
          solution: question.solution,
          selectedOption: answer?.selectedOption ?? null,
          isCorrect: answer?.isCorrect ?? null,
          marksAwarded: answer?.marksAwarded ?? null,
        };
      });

    const chapterLoss = new Map<
      string,
      {
        subject: string;
        chapter: string;
        lostMarks: number;
        incorrect: number;
        unattempted: number;
      }
    >();
    for (const item of items) {
      if (item.isCorrect) continue;
      const key = `${item.subject}\u0000${item.chapter}`;
      const current = chapterLoss.get(key) ?? {
        subject: item.subject,
        chapter: item.chapter,
        lostMarks: 0,
        incorrect: 0,
        unattempted: 0,
      };
      if (item.selectedOption === null) {
        current.unattempted += 1;
      } else {
        current.incorrect += 1;
        current.lostMarks += Math.abs(MOCK_TEST_MARKS_INCORRECT);
      }
      chapterLoss.set(key, current);
    }
    const weakestChapters = Array.from(chapterLoss.values())
      .sort(
        (a, b) => b.lostMarks + b.unattempted - (a.lostMarks + a.unattempted),
      )
      .slice(0, 6);

    return {
      attempt: this.toAttemptPayload(attempt, answers).attempt,
      subjectBreakdown: attempt.subjectBreakdown ?? [],
      weakestChapters,
      items,
    };
  }

  async listAttempts(
    userId: string,
  ): Promise<Array<MockTestAttemptPayload['attempt']>> {
    const attempts = await this.attemptsRepository.find({
      where: { userId },
      order: { startedAt: 'DESC' },
      take: 20,
    });
    return attempts.map(
      (attempt) => this.toAttemptPayload(attempt, []).attempt,
    );
  }

  /** Preserves the attempt's original question order — not DB retrieval order. */
  private async loadQuestionsInOrder(
    questionIds: string[],
  ): Promise<Question[]> {
    if (questionIds.length === 0) return [];
    const questions = await this.questionsRepository.find({
      where: { id: In(questionIds) },
    });
    const byId = new Map(questions.map((question) => [question.id, question]));
    return questionIds
      .map((id) => byId.get(id))
      .filter((question): question is Question => Boolean(question));
  }

  private async getOwnedAttempt(
    userId: string,
    attemptId: string,
  ): Promise<MockTestAttempt> {
    const attempt = await this.attemptsRepository.findOne({
      where: { id: attemptId, userId },
    });
    if (!attempt) throw new NotFoundException('Mock test attempt not found.');
    return attempt;
  }

  /**
   * Scores every answered question with JEE's +4/-1 scheme, computes the
   * subject-wise breakdown, and ranks the result against every other
   * submitted attempt on this platform (not the real national JEE cohort).
   */
  private async finalizeAttempt(attempt: MockTestAttempt): Promise<void> {
    const [questions, answers] = await Promise.all([
      this.questionsRepository.find({
        where: { id: In(attempt.questionIds) },
      }),
      this.answersRepository.find({ where: { attemptId: attempt.id } }),
    ]);
    const questionsById = new Map(questions.map((q) => [q.id, q]));
    const answersByQuestion = new Map(answers.map((a) => [a.questionId, a]));

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let rawScore = 0;
    const subjectTotals = new Map<
      string,
      { correct: number; incorrect: number; unattempted: number; total: number }
    >();
    const updatedAnswers: MockTestAnswer[] = [];

    for (const questionId of attempt.questionIds) {
      const question = questionsById.get(questionId);
      if (!question) continue;
      const totals = subjectTotals.get(question.subject) ?? {
        correct: 0,
        incorrect: 0,
        unattempted: 0,
        total: 0,
      };
      totals.total += 1;

      const answer = answersByQuestion.get(questionId);
      if (!answer || answer.selectedOption === null) {
        unattemptedCount += 1;
        totals.unattempted += 1;
      } else {
        const isCorrect = answer.selectedOption === question.correct_answer;
        answer.isCorrect = isCorrect;
        answer.marksAwarded = isCorrect
          ? MOCK_TEST_MARKS_CORRECT
          : MOCK_TEST_MARKS_INCORRECT;
        rawScore += answer.marksAwarded;
        updatedAnswers.push(answer);
        if (isCorrect) {
          correctCount += 1;
          totals.correct += 1;
        } else {
          incorrectCount += 1;
          totals.incorrect += 1;
        }
      }
      subjectTotals.set(question.subject, totals);
    }
    if (updatedAnswers.length > 0) {
      await this.answersRepository.save(updatedAnswers);
    }

    const subjectBreakdown: SubjectBreakdown[] = Array.from(
      subjectTotals.entries(),
    ).map(([subject, totals]) => ({
      subject,
      correct: totals.correct,
      incorrect: totals.incorrect,
      unattempted: totals.unattempted,
      total: totals.total,
      scorePercent:
        totals.total === 0
          ? 0
          : Math.round((totals.correct / totals.total) * 100),
    }));

    const scorePercent =
      attempt.maxPossibleScore <= 0
        ? 0
        : Math.max(0, Math.round((rawScore / attempt.maxPossibleScore) * 100));

    attempt.status = MockTestAttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    attempt.correctCount = correctCount;
    attempt.incorrectCount = incorrectCount;
    attempt.unattemptedCount = unattemptedCount;
    attempt.rawScore = rawScore;
    attempt.scorePercent = scorePercent;
    attempt.subjectBreakdown = subjectBreakdown;
    await this.attemptsRepository.save(attempt);

    attempt.percentile = await this.computePercentile(attempt);
    await this.attemptsRepository.save(attempt);
  }

  /** Percentile-rank against every other submitted attempt on this platform. */
  private async computePercentile(attempt: MockTestAttempt): Promise<number> {
    const [scoredLower, totalOthers] = await Promise.all([
      this.attemptsRepository.count({
        where: {
          status: MockTestAttemptStatus.SUBMITTED,
          scorePercent: LessThan(attempt.scorePercent),
        },
      }),
      this.attemptsRepository.count({
        where: { status: MockTestAttemptStatus.SUBMITTED },
      }),
    ]);
    const others = Math.max(totalOthers - 1, 0);
    if (others === 0) return 50;
    return Math.round((scoredLower / others) * 100);
  }

  /**
   * Draws a balanced set per subject, diversified across chapters and
   * difficulty. Degrades gracefully to whatever a thin subject's bank can
   * actually supply rather than failing the whole attempt.
   */
  private async drawFullMockSet(): Promise<{
    questions: Question[];
    subjectCounts: SubjectCount[];
    difficultyMix: DifficultyCount[];
  }> {
    const subjectCounts: SubjectCount[] = [];
    const allQuestions: Question[] = [];

    for (const subject of MOCK_TEST_SUBJECTS) {
      const bank = await this.questionsRepository.find({
        where: { subject, status: QuestionPublicationStatus.PUBLISHED },
      });
      const picked = this.pickDiverseQuestions(
        bank,
        Math.min(MOCK_TEST_QUESTIONS_PER_SUBJECT, bank.length),
      );
      if (picked.length > 0) {
        subjectCounts.push({ subject, count: picked.length });
        allQuestions.push(...picked);
      }
    }

    const difficultyTotals = new Map<string, number>();
    for (const question of allQuestions) {
      difficultyTotals.set(
        question.difficulty,
        (difficultyTotals.get(question.difficulty) ?? 0) + 1,
      );
    }
    const difficultyMix: DifficultyCount[] = Array.from(
      difficultyTotals.entries(),
    ).map(([label, count]) => ({ label, count }));

    return { questions: allQuestions, subjectCounts, difficultyMix };
  }

  /** Favors chapter/bloom diversity, same shape as the diagnostics picker. */
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
      const [chosen] = pool.splice(bestIndex, 1);
      selected.push(chosen);
      bloomUsage.set(
        chosen.bloom_level,
        (bloomUsage.get(chosen.bloom_level) ?? 0) + 1,
      );
      chapterUsage.set(
        chosen.chapter,
        (chapterUsage.get(chosen.chapter) ?? 0) + 1,
      );
    }
    return selected;
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(index + 1);
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  private toPublicQuestion(question: Question): PublicMockTestQuestion {
    return {
      id: question.id,
      subject: question.subject,
      chapter: question.chapter,
      topic: question.topic,
      questionText: question.question_text,
      options: question.options,
      difficulty: question.difficulty,
      bloomLevel: question.bloom_level,
      marks: question.marks,
    };
  }

  private toAttemptPayload(
    attempt: MockTestAttempt,
    answers: MockTestAnswer[],
    questionsOverride?: Question[],
  ): MockTestAttemptPayload {
    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        totalQuestions: attempt.totalQuestions,
        subjectCounts: attempt.subjectCounts,
        difficultyMix: attempt.difficultyMix,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        submittedAt: attempt.submittedAt,
        scorePercent: attempt.scorePercent,
        percentile: attempt.percentile,
      },
      questions: (questionsOverride ?? []).map((question) =>
        this.toPublicQuestion(question),
      ),
      answers: answers
        .filter((answer) => answer.selectedOption !== null)
        .map((answer) => ({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption as string,
        })),
    };
  }
}
