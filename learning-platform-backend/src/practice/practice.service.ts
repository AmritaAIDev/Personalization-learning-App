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
import { BLOOM_LEVELS, normalizeBloomLevel } from '../adaptive/adaptive.types';
import {
  Question,
  QuestionPublicationStatus,
} from '../question.entity';
import { PracticeAnswer } from './practice-answer.entity';
import { PracticeAttempt } from './practice-attempt.entity';
import {
  CreatePracticeSessionDto,
  SavePracticeAnswerDto,
} from './practice.dto';
import {
  PRACTICE_DIFFICULTIES,
  PRACTICE_PER_DIFFICULTY,
  PRACTICE_QUESTION_COUNT,
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

    const candidates = await this.questionsRepository.find({
      where: {
        subject: input.subject,
        chapter: input.chapter,
        topic: input.topic,
        status: QuestionPublicationStatus.PUBLISHED,
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
      totalQuestions: PRACTICE_QUESTION_COUNT,
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

  async saveAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    input: SavePracticeAnswerDto,
  ) {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (attempt.status !== PracticeAttemptStatus.IN_PROGRESS) {
      throw new ConflictException('This practice session has already been submitted.');
    }
    if (!attempt.questionIds.includes(questionId)) {
      throw new NotFoundException('Question is not part of this practice session.');
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
      answer.isCorrect = null;
    }
    await this.answersRepository.save(answer);
    return {
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      savedAt: answer.updatedAt ?? new Date(),
    };
  }

  async submitAttempt(userId: string, attemptId: string) {
    const attempt = await this.getOwnedAttempt(userId, attemptId, true);
    if (attempt.status !== PracticeAttemptStatus.IN_PROGRESS) {
      throw new ConflictException('This practice session has already been submitted.');
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
    if (attempt.status !== PracticeAttemptStatus.SUBMITTED || !attempt.analysis) {
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
        return {
          position: index + 1,
          questionId: question.question_id,
          questionText: question.question_text,
          options: question.options,
          selectedOption: answer?.selectedOption ?? null,
          correctOption: question.correct_answer,
          isCorrect: answer?.isCorrect ?? false,
          solution: question.solution,
          conceptTags: question.concept_tags ?? [],
          commonErrors: question.common_errors ?? [],
          difficulty: question.difficulty,
          bloomLevel: question.bloom_level,
        };
      }),
    };
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
    const selected: Question[] = [];
    for (const difficulty of PRACTICE_DIFFICULTIES) {
      const tier = candidates.filter(
        (question) => question.difficulty === difficulty,
      );
      if (tier.length < PRACTICE_PER_DIFFICULTY) {
        throw new ServiceUnavailableException(
          'This topic needs at least five published Easy, Medium, and Hard questions before practice can start.',
        );
      }
      selected.push(...this.pickDiverseQuestions(tier, PRACTICE_PER_DIFFICULTY));
    }
    if (selected.length !== PRACTICE_QUESTION_COUNT) {
      throw new ServiceUnavailableException(
        'The practice question bank could not build a balanced set.',
      );
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

    const difficultyPerformance = PRACTICE_DIFFICULTIES
      .filter((difficulty) => difficulties.has(difficulty))
      .map((difficulty) => makePerformance(difficulty, difficulties.get(difficulty)!));
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
