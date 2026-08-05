import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import {
  LearningSessionStatus,
  LearningSessionTransition,
  LearningTopicStatus,
} from '../adaptive/adaptive.types';
import { LearningSession } from '../adaptive/learning-session.entity';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import { DiagnosticAnswer } from '../diagnostics/diagnostic-answer.entity';
import { DiagnosticAttempt } from '../diagnostics/diagnostic-attempt.entity';
import {
  DiagnosticAnalysis,
  DiagnosticAttemptStatus,
  PerformanceRow,
} from '../diagnostics/diagnostic.types';
import { Doubt, DoubtStatus } from '../doubts/doubt.entity';
import { PracticeAnswer } from '../practice/practice-answer.entity';
import { PracticeAttempt } from '../practice/practice-attempt.entity';
import {
  PracticeAnalysis,
  PracticeAttemptStatus,
} from '../practice/practice.types';
import {
  Question,
  QuestionPublicationStatus,
  QuestionSource,
} from '../question.entity';
import { User } from '../users/user.entity';

const PHYSICS = 'Physics';
const CHARGES = 'Electric Charges and Fields';
const POTENTIAL = 'Electrostatic Potential and Capacitance';
const DEMO_EMAIL =
  process.env.DEMO_USER_EMAIL ?? 'lokeshyarramalluyarramalluloke@gmail.com';

type Scope = {
  subject: string;
  chapter: string;
  topic: string;
};

const DEMO_SCOPES: Array<
  Scope & {
    level: number;
    status: LearningTopicStatus;
    answered: number;
    correct: number;
    streak: number;
    masteredDaysAgo?: number;
  }
> = [
  {
    subject: PHYSICS,
    chapter: CHARGES,
    topic: 'Gauss Law',
    level: 1,
    status: LearningTopicStatus.ACTIVE,
    answered: 12,
    correct: 5,
    streak: 0,
  },
  {
    subject: PHYSICS,
    chapter: CHARGES,
    topic: 'Electric charge & field',
    level: 8,
    status: LearningTopicStatus.ACTIVE,
    answered: 18,
    correct: 15,
    streak: 3,
  },
  {
    subject: PHYSICS,
    chapter: POTENTIAL,
    topic: 'Electric Potential',
    level: 5,
    status: LearningTopicStatus.ACTIVE,
    answered: 14,
    correct: 9,
    streak: 1,
  },
  {
    subject: PHYSICS,
    chapter: POTENTIAL,
    topic: 'Capacitance basics',
    level: 3,
    status: LearningTopicStatus.ACTIVE,
    answered: 9,
    correct: 4,
    streak: 0,
  },
  {
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Coulomb's Law and Charge",
    level: 12,
    status: LearningTopicStatus.MASTERED,
    answered: 24,
    correct: 22,
    streak: 0,
    masteredDaysAgo: 3,
  },
];

const DEMO_QUESTIONS = [
  {
    id: 'DEMO-GAUSS-01',
    scope: DEMO_SCOPES[0],
    text: 'For a point charge at the centre of a spherical Gaussian surface, electric flux depends on:',
    options: [
      'Only enclosed charge',
      'Radius of the sphere only',
      'Shape of nearby conductors only',
      'Mass of the test charge',
    ],
    answer: 'Only enclosed charge',
    solution:
      'Gauss law states that net electric flux through a closed surface equals enclosed charge divided by epsilon naught.',
    tags: ['Gauss law', 'electric flux', 'enclosed charge'],
    errors: [
      'Thinking outside charges directly change net flux through the closed surface',
    ],
  },
  {
    id: 'DEMO-GAUSS-02',
    scope: DEMO_SCOPES[0],
    text: 'A closed surface encloses zero net charge. What is the net electric flux through it?',
    options: ['Zero', 'Always positive', 'Always negative', 'Infinite'],
    answer: 'Zero',
    solution:
      'If enclosed charge is zero, net flux is zero even if electric field exists at parts of the surface.',
    tags: ['net flux', 'closed surface'],
    errors: ['Confusing non-zero local electric field with non-zero net flux'],
  },
  {
    id: 'DEMO-FIELD-01',
    scope: DEMO_SCOPES[1],
    text: 'Electric field direction is conventionally the direction of force on a:',
    options: [
      'Positive test charge',
      'Negative test charge',
      'Neutron',
      'Dipole only',
    ],
    answer: 'Positive test charge',
    solution:
      'Electric field direction is defined by the force direction on a positive test charge.',
    tags: ['electric field', 'test charge'],
    errors: ['Using the force on a negative charge to define field direction'],
  },
  {
    id: 'DEMO-POT-01',
    scope: DEMO_SCOPES[2],
    text: 'Electric potential is best described as:',
    options: [
      'Work done per unit charge',
      'Force per unit charge',
      'Charge per unit area',
      'Energy per unit mass',
    ],
    answer: 'Work done per unit charge',
    solution:
      'Electric potential at a point is potential energy per unit charge, equivalent to work per unit charge.',
    tags: ['potential', 'work per charge'],
    errors: ['Confusing electric potential with electric field'],
  },
  {
    id: 'DEMO-CAP-01',
    scope: DEMO_SCOPES[3],
    text: 'For a capacitor, capacitance is the ratio of:',
    options: [
      'Charge to potential difference',
      'Force to charge',
      'Voltage to charge',
      'Energy to force',
    ],
    answer: 'Charge to potential difference',
    solution: 'Capacitance is C = Q/V.',
    tags: ['capacitance', 'Q by V'],
    errors: ['Reversing the ratio as V/Q'],
  },
];

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function row(label: string, correct: number, total: number): PerformanceRow {
  const score = Math.round((correct / total) * 100);
  return {
    label,
    correct,
    total,
    score,
    status: score >= 70 ? 'strong' : score >= 40 ? 'average' : 'weak',
  };
}

function diagnosticAnalysis(): DiagnosticAnalysis {
  return {
    total: 15,
    correct: 7,
    incorrect: 8,
    scorePercent: 47,
    grade: 'Average',
    topicPerformance: [
      row('Gauss Law', 1, 5),
      row('Electric Potential', 3, 5),
      row('Capacitance basics', 2, 5),
    ],
    bloomPerformance: [
      row('Remember', 4, 5),
      row('Understand', 2, 4),
      row('Apply', 1, 3),
      row('Analyze', 0, 3),
    ],
    weakTopics: ['Gauss Law', 'Capacitance basics'],
    recap:
      'You scored 47% — average. Focus next on Gauss Law and Capacitance basics.',
    integrity: {
      guessingSuspected: false,
      fastWrongCount: 0,
      dominantOptionShare: 0,
      note: null,
    },
    calculatedAt: daysAgo(1).toISOString(),
  };
}

function practiceAnalysis(): PracticeAnalysis {
  return {
    total: 5,
    correct: 2,
    incorrect: 3,
    scorePercent: 40,
    grade: 'Average',
    difficultyPerformance: [
      row('Easy', 2, 2),
      row('Medium', 0, 2),
      row('Hard', 0, 1),
    ],
    bloomPerformance: [
      row('Remember', 1, 2),
      row('Understand', 1, 2),
      row('Apply', 0, 1),
    ],
    weakConcepts: ['enclosed charge', 'net flux'],
    calculatedAt: daysAgo(1).toISOString(),
  };
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const users = app.get<Repository<User>>(getRepositoryToken(User));
    const questions = app.get<Repository<Question>>(
      getRepositoryToken(Question),
    );
    const states = app.get<Repository<LearningTopicState>>(
      getRepositoryToken(LearningTopicState),
    );
    const sessions = app.get<Repository<LearningSession>>(
      getRepositoryToken(LearningSession),
    );
    const diagnostics = app.get<Repository<DiagnosticAttempt>>(
      getRepositoryToken(DiagnosticAttempt),
    );
    const diagnosticAnswers = app.get<Repository<DiagnosticAnswer>>(
      getRepositoryToken(DiagnosticAnswer),
    );
    const practices = app.get<Repository<PracticeAttempt>>(
      getRepositoryToken(PracticeAttempt),
    );
    const practiceAnswers = app.get<Repository<PracticeAnswer>>(
      getRepositoryToken(PracticeAnswer),
    );
    const doubts = app.get<Repository<Doubt>>(getRepositoryToken(Doubt));

    const user =
      (await users.findOne({ where: { email: DEMO_EMAIL } })) ??
      (await users.findOne({ order: { createdAt: 'DESC' } }));
    if (!user) {
      throw new Error(
        'No user found. Create/sign up an account first, then rerun the seed.',
      );
    }

    const seededQuestions = await seedQuestions(questions);
    await seedLearningStates(states, sessions, user.id);
    await seedDiagnostic(
      diagnostics,
      diagnosticAnswers,
      user.id,
      seededQuestions,
    );
    await seedPractice(practices, practiceAnswers, user.id, seededQuestions);
    await seedDoubts(doubts, user.id);

    user.xp = Math.max(user.xp, 820);
    user.level = Math.max(user.level, 4);
    user.streak = Math.max(user.streak, 5);
    await users.save(user);

    console.log(
      `Demo learning history seeded for ${user.email}: ${DEMO_SCOPES.length} topic states, diagnostic history, practice mistakes, and doubts.`,
    );
  } finally {
    await app.close();
  }
}

async function seedQuestions(
  questions: Repository<Question>,
): Promise<Question[]> {
  const saved: Question[] = [];
  for (const demo of DEMO_QUESTIONS) {
    let question = await questions.findOne({ where: { question_id: demo.id } });
    if (!question) {
      question = questions.create({
        question_id: demo.id,
        subject: demo.scope.subject,
        chapter: demo.scope.chapter,
        topic: demo.scope.topic,
        subtopic: null,
        question_text: demo.text,
        options: demo.options,
        correct_answer: demo.answer,
        solution: demo.solution,
        bloom_level: 'Understand',
        difficulty: 'Easy',
        marks: 4,
        estimated_time_sec: 75,
        concept_tags: demo.tags,
        common_errors: demo.errors,
        status: QuestionPublicationStatus.PUBLISHED,
        source: QuestionSource.CURATED,
        quality_score: 92,
      });
    }
    saved.push(await questions.save(question));
  }
  return saved;
}

async function seedLearningStates(
  states: Repository<LearningTopicState>,
  sessions: Repository<LearningSession>,
  userId: string,
) {
  for (const [index, scope] of DEMO_SCOPES.entries()) {
    let state = await states.findOne({
      where: {
        userId,
        subject: scope.subject,
        chapter: scope.chapter,
        topic: scope.topic,
      },
    });
    state =
      state ??
      states.create({
        userId,
        subject: scope.subject,
        chapter: scope.chapter,
        topic: scope.topic,
      });
    state.currentLevel = scope.level;
    state.status = scope.status;
    state.streakCounter = scope.streak;
    state.totalAnswered = scope.answered;
    state.totalCorrect = scope.correct;
    state.lastActivityAt = daysAgo(index);
    state.masteredAt = scope.masteredDaysAgo
      ? daysAgo(scope.masteredDaysAgo)
      : null;
    state = await states.save(state);

    const existingSession = await sessions.findOne({
      where: {
        userId,
        stateId: state.id,
        subject: scope.subject,
        chapter: scope.chapter,
        topic: scope.topic,
        level: Math.max(1, scope.level - 1),
        status: LearningSessionStatus.COMPLETED,
      },
    });
    if (!existingSession) {
      await sessions.save(
        sessions.create({
          stateId: state.id,
          userId,
          subject: scope.subject,
          chapter: scope.chapter,
          topic: scope.topic,
          level: Math.max(1, scope.level - 1),
          bloomLevel:
            scope.level >= 8
              ? 'Apply'
              : scope.level >= 4
                ? 'Understand'
                : 'Recall',
          difficulty: scope.level >= 7 ? 'Medium' : 'Easy',
          status: LearningSessionStatus.COMPLETED,
          transition:
            scope.status === LearningTopicStatus.MASTERED
              ? LearningSessionTransition.MASTERED
              : scope.level <= 2
                ? LearningSessionTransition.REINFORCE
                : LearningSessionTransition.ADVANCED,
          totalQuestions: 5,
          currentSequence: 6,
          completedAt: daysAgo(index + 1),
        }),
      );
    }
  }
}

async function seedDiagnostic(
  diagnostics: Repository<DiagnosticAttempt>,
  answers: Repository<DiagnosticAnswer>,
  userId: string,
  questions: Question[],
) {
  let attempt = await diagnostics.findOne({
    where: { userId, title: 'Demo - Electrostatics Baseline' },
  });
  attempt =
    attempt ??
    diagnostics.create({
      userId,
      subject: PHYSICS,
      title: 'Demo - Electrostatics Baseline',
      chapterScope: [CHARGES, POTENTIAL],
      questionIds: questions.map((question) => question.id),
      status: DiagnosticAttemptStatus.SUBMITTED,
      totalQuestions: 15,
      startedAt: daysAgo(1),
      expiresAt: new Date(daysAgo(1).getTime() + 30 * 60 * 1000),
    });
  attempt.questionIds = questions.map((question) => question.id);
  attempt.status = DiagnosticAttemptStatus.SUBMITTED;
  attempt.totalQuestions = 15;
  attempt.correctCount = 7;
  attempt.scorePercent = 47;
  attempt.analysis = diagnosticAnalysis();
  attempt.submittedAt = daysAgo(1);
  attempt = await diagnostics.save(attempt);

  for (const [index, question] of questions.entries()) {
    let answer = await answers.findOne({
      where: { attemptId: attempt.id, questionId: question.id },
    });
    answer =
      answer ??
      answers.create({
        attemptId: attempt.id,
        questionId: question.id,
      });
    answer.selectedOption =
      index % 2 === 0
        ? question.correct_answer
        : (question.options.find(
            (option) => option !== question.correct_answer,
          ) ?? null);
    answer.isCorrect = answer.selectedOption === question.correct_answer;
    answer.elapsedSeconds = 45 + index * 8;
    await answers.save(answer);
  }
}

async function seedPractice(
  practices: Repository<PracticeAttempt>,
  answers: Repository<PracticeAnswer>,
  userId: string,
  questions: Question[],
) {
  const gaussQuestions = questions.filter(
    (question) => question.topic === 'Gauss Law',
  );
  let attempt = await practices.findOne({
    where: { userId, title: 'Demo - Gauss Law Repair Set' },
  });
  attempt =
    attempt ??
    practices.create({
      userId,
      subject: PHYSICS,
      chapter: CHARGES,
      topic: 'Gauss Law',
      title: 'Demo - Gauss Law Repair Set',
      questionIds: gaussQuestions.map((question) => question.id),
      status: PracticeAttemptStatus.SUBMITTED,
      totalQuestions: gaussQuestions.length,
      startedAt: daysAgo(1),
    });
  attempt.questionIds = gaussQuestions.map((question) => question.id);
  attempt.status = PracticeAttemptStatus.SUBMITTED;
  attempt.totalQuestions = gaussQuestions.length;
  attempt.correctCount = 1;
  attempt.scorePercent = 40;
  attempt.analysis = practiceAnalysis();
  attempt.submittedAt = daysAgo(1);
  attempt = await practices.save(attempt);

  for (const [index, question] of gaussQuestions.entries()) {
    let answer = await answers.findOne({
      where: { attemptId: attempt.id, questionId: question.id },
    });
    answer =
      answer ??
      answers.create({
        attemptId: attempt.id,
        questionId: question.id,
      });
    answer.selectedOption =
      index === 0
        ? question.correct_answer
        : (question.options.find(
            (option) => option !== question.correct_answer,
          ) ?? null);
    answer.isCorrect = answer.selectedOption === question.correct_answer;
    answer.elapsedSeconds = 62 + index * 14;
    await answers.save(answer);
  }
}

async function seedDoubts(doubts: Repository<Doubt>, userId: string) {
  const existing = await doubts.findOne({
    where: {
      userId,
      subject: PHYSICS,
      chapter: CHARGES,
      topic: 'Gauss Law',
      message:
        'Why do outside charges not change the net flux through a closed surface?',
    },
  });
  if (existing) return;
  await doubts.save(
    doubts.create({
      userId,
      subject: PHYSICS,
      chapter: CHARGES,
      topic: 'Gauss Law',
      message:
        'Why do outside charges not change the net flux through a closed surface?',
      questionId: null,
      learningSessionId: null,
      learningSessionItemId: null,
      practiceAttemptId: null,
      notebookCardId: null,
      assistantResponse:
        '### Key idea\nOutside charges can change the field at surface points, but their incoming and outgoing flux contributions cancel. Net flux depends only on enclosed charge.',
      status: DoubtStatus.ANSWERED,
      answeredAt: daysAgo(1),
    }),
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
