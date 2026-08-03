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
import {
  Question,
  QuestionPublicationStatus,
  QuestionSource,
} from '../question.entity';
import { User } from '../users/user.entity';

const TARGET_EMAIL =
  process.env.DEMO_USER_EMAIL ?? 'lokeshyarramalluyarramalluloke@gmail.com';

type TopicDefinition = {
  subject: 'Mathematics' | 'Chemistry';
  chapter: string;
  topic: string;
  subtopic: string;
  questions: Array<{
    text: string;
    options: string[];
    answer: string;
    solution: string;
    bloom: string;
    difficulty: string;
  }>;
};

const catalog: TopicDefinition[] = [
  {
    subject: 'Mathematics', chapter: 'Sets, Relations and Functions', topic: 'Sets', subtopic: 'Set operations',
    questions: [
      { text: 'If A = {1, 2, 3} and B = {3, 4}, then A union B is:', options: ['{1, 2, 3, 4}', '{3}', '{1, 2, 4}', 'empty set'], answer: '{1, 2, 3, 4}', solution: 'A union B contains every distinct element that appears in either set.', bloom: 'Remember', difficulty: 'Easy' },
      { text: 'For finite sets with n(A) = 18, n(B) = 15 and n(A intersection B) = 6, n(A union B) is:', options: ['27', '39', '9', '18'], answer: '27', solution: 'Use n(A union B) = n(A) + n(B) - n(A intersection B) = 18 + 15 - 6.', bloom: 'Apply', difficulty: 'Medium' },
      { text: 'If U has 50 elements and n(A) = 21, then n(A complement) is:', options: ['29', '71', '21', '0'], answer: '29', solution: 'A complement contains the elements in U that are not in A: 50 - 21.', bloom: 'Apply', difficulty: 'Easy' },
    ],
  },
  {
    subject: 'Mathematics', chapter: 'Sets, Relations and Functions', topic: 'Functions', subtopic: 'Domain and range',
    questions: [
      { text: 'The domain of f(x) = 1/(x - 4) excludes:', options: ['x = 4', 'x = 0', 'x = -4', 'no real x'], answer: 'x = 4', solution: 'The denominator cannot be zero, so x - 4 cannot equal zero.', bloom: 'Understand', difficulty: 'Easy' },
      { text: 'For f(x) = x squared on real numbers, the range is:', options: ['all non-negative real numbers', 'all real numbers', 'all positive real numbers only', 'all non-positive real numbers'], answer: 'all non-negative real numbers', solution: 'A real square cannot be negative, and zero is possible.', bloom: 'Understand', difficulty: 'Medium' },
      { text: 'A function is one-one when:', options: ['different inputs have different outputs', 'every output has two inputs', 'its domain is empty', 'its graph is always a circle'], answer: 'different inputs have different outputs', solution: 'A one-one function maps distinct inputs to distinct outputs.', bloom: 'Remember', difficulty: 'Easy' },
    ],
  },
  {
    subject: 'Mathematics', chapter: 'Coordinate Geometry', topic: 'Straight Lines', subtopic: 'Slope and equations',
    questions: [
      { text: 'The slope of the line through (1, 2) and (3, 8) is:', options: ['3', '6', '1/3', '-3'], answer: '3', solution: 'Slope = (8 - 2)/(3 - 1) = 6/2.', bloom: 'Apply', difficulty: 'Easy' },
      { text: 'A line with slope 2 through (0, -1) has equation:', options: ['y = 2x - 1', 'y = 2x + 1', 'x = 2y - 1', 'y = -2x - 1'], answer: 'y = 2x - 1', solution: 'Use y = mx + c. At x = 0, y = -1, so c = -1.', bloom: 'Apply', difficulty: 'Medium' },
      { text: 'Two non-vertical lines are perpendicular when their slopes have product:', options: ['-1', '1', '0', 'undefined'], answer: '-1', solution: 'For perpendicular non-vertical lines, m1 times m2 equals -1.', bloom: 'Remember', difficulty: 'Easy' },
    ],
  },
  {
    subject: 'Mathematics', chapter: 'Differential Calculus', topic: 'Limits and Continuity', subtopic: 'Standard limits',
    questions: [
      { text: 'The limit of sin x / x as x tends to 0 is:', options: ['1', '0', 'infinity', '-1'], answer: '1', solution: 'This is the standard trigonometric limit when x is measured in radians.', bloom: 'Remember', difficulty: 'Easy' },
      { text: 'A function is continuous at x = a if its limit at a:', options: ['exists and equals f(a)', 'is always zero', 'is always infinite', 'does not depend on f(a)'], answer: 'exists and equals f(a)', solution: 'Continuity requires the left and right limits to agree and equal the function value.', bloom: 'Understand', difficulty: 'Medium' },
      { text: 'For f(x) = x squared, the limit as x tends to 3 is:', options: ['9', '6', '3', '0'], answer: '9', solution: 'Polynomials are continuous, so substitute x = 3 directly.', bloom: 'Apply', difficulty: 'Easy' },
    ],
  },
  {
    subject: 'Mathematics', chapter: 'Differential Calculus', topic: 'Differentiation', subtopic: 'Derivative rules',
    questions: [
      { text: 'The derivative of x cubed is:', options: ['3x squared', 'x squared', '3x', 'x to the fourth'], answer: '3x squared', solution: 'Apply the power rule: d/dx of x to n is n x to n-1.', bloom: 'Remember', difficulty: 'Easy' },
      { text: 'The derivative of 5x squared - 3x is:', options: ['10x - 3', '5x - 3', '10x', '5x squared - 3'], answer: '10x - 3', solution: 'Differentiate each term using the power rule.', bloom: 'Apply', difficulty: 'Medium' },
      { text: 'At a local maximum of a differentiable function, the first derivative is:', options: ['zero', 'always positive', 'always negative', 'infinite'], answer: 'zero', solution: 'At an interior differentiable local extremum, the tangent is horizontal.', bloom: 'Understand', difficulty: 'Medium' },
    ],
  },
  {
    subject: 'Mathematics', chapter: 'Integral Calculus', topic: 'Indefinite Integrals', subtopic: 'Basic antiderivatives',
    questions: [
      { text: 'An antiderivative of 2x is:', options: ['x squared + C', '2x squared + C', 'x + C', '1/x + C'], answer: 'x squared + C', solution: 'Differentiate x squared to obtain 2x.', bloom: 'Apply', difficulty: 'Easy' },
      { text: 'Integral of cos x with respect to x is:', options: ['sin x + C', '-sin x + C', 'cos x + C', '-cos x + C'], answer: 'sin x + C', solution: 'The derivative of sin x is cos x.', bloom: 'Remember', difficulty: 'Easy' },
      { text: 'The constant C is included in an indefinite integral because:', options: ['all constants differentiate to zero', 'it changes the variable of integration', 'it makes the integral definite', 'it is always equal to one'], answer: 'all constants differentiate to zero', solution: 'Many functions differing by a constant have the same derivative.', bloom: 'Understand', difficulty: 'Medium' },
    ],
  },
  {
    subject: 'Chemistry', chapter: 'Some Basic Concepts of Chemistry', topic: 'Mole Concept', subtopic: 'Stoichiometry',
    questions: [
      { text: 'One mole contains approximately:', options: ['6.022 x 10^23 entities', '6.022 x 10^20 entities', '3.011 x 10^23 entities', '1.000 x 10^23 entities'], answer: '6.022 x 10^23 entities', solution: 'Avogadro constant gives the number of entities in one mole.', bloom: 'Remember', difficulty: 'Easy' },
      { text: 'The number of moles in 18 g of water (molar mass 18 g/mol) is:', options: ['1 mol', '18 mol', '0.5 mol', '36 mol'], answer: '1 mol', solution: 'Moles = mass divided by molar mass = 18/18.', bloom: 'Apply', difficulty: 'Easy' },
      { text: 'In 2H2 + O2 -> 2H2O, 4 mol of H2 requires how many moles of O2?', options: ['2 mol', '4 mol', '1 mol', '8 mol'], answer: '2 mol', solution: 'The balanced ratio H2:O2 is 2:1, so 4 mol H2 needs 2 mol O2.', bloom: 'Apply', difficulty: 'Medium' },
    ],
  },
  {
    subject: 'Chemistry', chapter: 'Structure of Atom', topic: 'Atomic Structure', subtopic: 'Quantum numbers',
    questions: [
      { text: 'The maximum number of electrons in the n = 2 shell is:', options: ['8', '2', '18', '4'], answer: '8', solution: 'Maximum electrons in shell n equals 2n squared, hence 2 times 2 squared.', bloom: 'Apply', difficulty: 'Easy' },
      { text: 'The principal quantum number mainly describes an electron’s:', options: ['shell and energy level', 'spin direction only', 'orbital orientation only', 'nuclear charge'], answer: 'shell and energy level', solution: 'The principal quantum number n identifies the main energy level.', bloom: 'Understand', difficulty: 'Medium' },
      { text: 'The number of orbitals in a p subshell is:', options: ['3', '1', '5', '7'], answer: '3', solution: 'A p subshell has three orbitals: px, py and pz.', bloom: 'Remember', difficulty: 'Easy' },
    ],
  },
  {
    subject: 'Chemistry', chapter: 'Classification of Elements', topic: 'Periodic Properties', subtopic: 'Periodic trends',
    questions: [
      { text: 'Across a period from left to right, atomic radius generally:', options: ['decreases', 'increases', 'remains identical', 'becomes zero'], answer: 'decreases', solution: 'Increasing effective nuclear charge pulls electrons closer to the nucleus.', bloom: 'Understand', difficulty: 'Easy' },
      { text: 'Which has the higher first ionisation enthalpy?', options: ['Neon', 'Sodium', 'Potassium', 'Rubidium'], answer: 'Neon', solution: 'Noble gases have stable filled shells and high ionisation enthalpies.', bloom: 'Analyze', difficulty: 'Medium' },
      { text: 'Elements in the same group usually have similar:', options: ['valence-shell configuration', 'number of shells', 'atomic mass', 'neutron count'], answer: 'valence-shell configuration', solution: 'Similar valence electron arrangements lead to similar chemical properties.', bloom: 'Understand', difficulty: 'Easy' },
    ],
  },
  {
    subject: 'Chemistry', chapter: 'Chemical Bonding and Molecular Structure', topic: 'Chemical Bonding', subtopic: 'Ionic and covalent bonding',
    questions: [
      { text: 'A covalent bond is formed by:', options: ['sharing electron pairs', 'transfer of protons', 'sharing neutrons', 'loss of all electrons'], answer: 'sharing electron pairs', solution: 'Covalent bonding results from sharing electrons between atoms.', bloom: 'Remember', difficulty: 'Easy' },
      { text: 'The shape of methane, CH4, is:', options: ['tetrahedral', 'linear', 'trigonal planar', 'bent'], answer: 'tetrahedral', solution: 'Four bond pairs around carbon arrange tetrahedrally to minimise repulsion.', bloom: 'Understand', difficulty: 'Medium' },
      { text: 'Which compound is expected to have predominantly ionic bonding?', options: ['NaCl', 'CH4', 'H2', 'Cl2'], answer: 'NaCl', solution: 'Sodium transfers an electron to chlorine, forming oppositely charged ions.', bloom: 'Apply', difficulty: 'Easy' },
    ],
  },
  {
    subject: 'Chemistry', chapter: 'Thermodynamics', topic: 'Thermochemistry', subtopic: 'Enthalpy changes',
    questions: [
      { text: 'For an exothermic reaction, delta H is:', options: ['negative', 'positive', 'always zero', 'undefined'], answer: 'negative', solution: 'An exothermic reaction releases heat, lowering the enthalpy of the system.', bloom: 'Understand', difficulty: 'Easy' },
      { text: 'At constant pressure, heat exchanged by a system equals the change in:', options: ['enthalpy', 'entropy only', 'volume only', 'moles only'], answer: 'enthalpy', solution: 'At constant pressure, qp equals delta H.', bloom: 'Remember', difficulty: 'Medium' },
      { text: 'Breaking chemical bonds generally requires energy because it is:', options: ['endothermic', 'exothermic', 'spontaneous in every case', 'independent of bond strength'], answer: 'endothermic', solution: 'Energy must be supplied to overcome attractive forces between bonded atoms.', bloom: 'Understand', difficulty: 'Easy' },
    ],
  },
  {
    subject: 'Chemistry', chapter: 'Equilibrium', topic: 'Chemical Equilibrium', subtopic: 'Le Chatelier principle',
    questions: [
      { text: 'At equilibrium, the forward and reverse reaction rates are:', options: ['equal', 'both zero', 'unrelated', 'infinite'], answer: 'equal', solution: 'Equilibrium is dynamic: both reactions continue at equal rates.', bloom: 'Remember', difficulty: 'Easy' },
      { text: 'Increasing pressure favours the side with:', options: ['fewer moles of gas', 'more moles of gas', 'more solids', 'higher molecular mass only'], answer: 'fewer moles of gas', solution: 'The system shifts to reduce the imposed pressure by reducing gas moles.', bloom: 'Apply', difficulty: 'Medium' },
      { text: 'A catalyst changes the equilibrium position by:', options: ['not changing it', 'always shifting right', 'always shifting left', 'making K zero'], answer: 'not changing it', solution: 'A catalyst speeds both forward and reverse reactions similarly and does not change K.', bloom: 'Analyze', difficulty: 'Medium' },
    ],
  },
];

const states = [
  { subject: 'Mathematics', chapter: 'Sets, Relations and Functions', topic: 'Sets', level: 9, status: LearningTopicStatus.ACTIVE, answered: 30, correct: 25, daysAgo: 1 },
  { subject: 'Mathematics', chapter: 'Coordinate Geometry', topic: 'Straight Lines', level: 6, status: LearningTopicStatus.ACTIVE, answered: 21, correct: 14, daysAgo: 3 },
  { subject: 'Mathematics', chapter: 'Differential Calculus', topic: 'Limits and Continuity', level: 12, status: LearningTopicStatus.MASTERED, answered: 36, correct: 32, daysAgo: 9 },
  { subject: 'Mathematics', chapter: 'Differential Calculus', topic: 'Differentiation', level: 5, status: LearningTopicStatus.ACTIVE, answered: 17, correct: 10, daysAgo: 2 },
  { subject: 'Chemistry', chapter: 'Some Basic Concepts of Chemistry', topic: 'Mole Concept', level: 10, status: LearningTopicStatus.MASTERED, answered: 32, correct: 29, daysAgo: 12 },
  { subject: 'Chemistry', chapter: 'Structure of Atom', topic: 'Atomic Structure', level: 7, status: LearningTopicStatus.ACTIVE, answered: 23, correct: 16, daysAgo: 4 },
  { subject: 'Chemistry', chapter: 'Chemical Bonding and Molecular Structure', topic: 'Chemical Bonding', level: 4, status: LearningTopicStatus.PAUSED_FOR_PREREQUISITE, answered: 12, correct: 5, daysAgo: 6 },
  { subject: 'Chemistry', chapter: 'Equilibrium', topic: 'Chemical Equilibrium', level: 8, status: LearningTopicStatus.ACTIVE, answered: 26, correct: 19, daysAgo: 5 },
];

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const questions = app.get<Repository<Question>>(getRepositoryToken(Question));
    const users = app.get<Repository<User>>(getRepositoryToken(User));
    const topicStates = app.get<Repository<LearningTopicState>>(getRepositoryToken(LearningTopicState));
    const sessions = app.get<Repository<LearningSession>>(getRepositoryToken(LearningSession));
    let questionCount = 0;

    for (const entry of catalog) {
      for (const [index, item] of entry.questions.entries()) {
        const questionId = `JOURNEY-${entry.subject === 'Mathematics' ? 'MTH' : 'CHM'}-${entry.topic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
        const values = {
          question_id: questionId, subject: entry.subject, chapter: entry.chapter, topic: entry.topic, subtopic: entry.subtopic,
          question_text: item.text, options: item.options, correct_answer: item.answer, solution: item.solution,
          bloom_level: item.bloom, difficulty: item.difficulty, marks: 4, estimated_time_sec: item.difficulty === 'Medium' ? 90 : 60,
          concept_tags: [entry.topic, entry.subtopic], common_errors: ['Review the definition and the condition before applying the rule.'],
          status: QuestionPublicationStatus.PUBLISHED, source: QuestionSource.CURATED, quality_score: 93, published_at: new Date(),
        };
        const existing = await questions.findOne({ where: { question_id: questionId } });
        await questions.save(existing ? Object.assign(existing, values) : questions.create(values));
        questionCount += 1;
      }
    }

    const user = await users.findOne({ where: { email: TARGET_EMAIL } });
    if (!user) throw new Error('Configured learner account was not found.');
    for (const [index, item] of states.entries()) {
      let state = await topicStates.findOne({ where: { userId: user.id, subject: item.subject, chapter: item.chapter, topic: item.topic } });
      state = state ?? topicStates.create({ userId: user.id, subject: item.subject, chapter: item.chapter, topic: item.topic });
      Object.assign(state, {
        currentLevel: item.level, status: item.status, totalAnswered: item.answered, totalCorrect: item.correct,
        streakCounter: index % 4, lastActivityAt: daysAgo(item.daysAgo), masteredAt: item.status === LearningTopicStatus.MASTERED ? daysAgo(item.daysAgo) : null,
      });
      state = await topicStates.save(state);
      const sessionLevel = Math.max(1, item.level - 1);
      const existing = await sessions.findOne({ where: { userId: user.id, stateId: state.id, level: sessionLevel, status: LearningSessionStatus.COMPLETED } });
      if (!existing) {
        await sessions.save(sessions.create({
          stateId: state.id, userId: user.id, subject: item.subject, chapter: item.chapter, topic: item.topic, level: sessionLevel,
          bloomLevel: item.level >= 10 ? 'Application' : item.level >= 5 ? 'Comprehension' : 'Recall',
          difficulty: item.level >= 8 ? 'Hard' : item.level >= 4 ? 'Medium' : 'Easy', status: LearningSessionStatus.COMPLETED,
          transition: item.status === LearningTopicStatus.MASTERED ? LearningSessionTransition.MASTERED : item.status === LearningTopicStatus.PAUSED_FOR_PREREQUISITE ? LearningSessionTransition.PREREQUISITE : LearningSessionTransition.ADVANCED,
          totalQuestions: 5, currentSequence: 6, completedAt: daysAgo(item.daysAgo + 1),
        }));
      }
    }
    console.log(`Seeded ${questionCount} Mathematics/Chemistry questions and ${states.length} learner journey states.`);
  } finally {
    await app.close();
  }
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
