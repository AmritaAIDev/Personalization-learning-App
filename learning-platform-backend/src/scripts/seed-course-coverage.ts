import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { LearningSession } from '../adaptive/learning-session.entity';
import { LearningTopicState } from '../adaptive/learning-topic-state.entity';
import {
  LearningSessionStatus,
  LearningSessionTransition,
  LearningTopicStatus,
} from '../adaptive/adaptive.types';
import {
  Question,
  QuestionPublicationStatus,
  QuestionSource,
} from '../question.entity';
import { User } from '../users/user.entity';

const PHYSICS = 'Physics';
const CHARGES = 'Electric Charges and Fields';
const POTENTIAL = 'Electrostatic Potential and Capacitance';
const TARGET_EMAIL =
  process.env.DEMO_USER_EMAIL ?? 'lokeshyarramalluyarramalluloke@gmail.com';

type SeedQuestion = {
  id: string;
  chapter: string;
  topic: string;
  subtopic: string;
  text: string;
  options: string[];
  answer: string;
  solution: string;
  bloom: string;
  difficulty: string;
  tags: string[];
};

type RawQuestion = [
  string,
  string,
  string,
  string,
  string,
  string[],
  string,
  string,
  string,
  string,
  string[],
];

const RAW_QUESTIONS: RawQuestion[] = [
  [
    'DIP',
    CHARGES,
    'Electric Dipole',
    'Dipole moment and orientation',
    'The electric dipole moment points from:',
    [
      'negative charge to positive charge',
      'positive charge to negative charge',
      'the centre toward either charge',
      'the stronger charge to the weaker charge',
    ],
    'negative charge to positive charge',
    'By convention, the dipole moment vector points from negative charge to positive charge.',
    'Remember',
    'Easy',
    ['electric dipole', 'dipole moment'],
  ],
  [
    'DIP',
    CHARGES,
    'Electric Dipole',
    'Axial and equatorial fields',
    'At a far point on the axial line of a short dipole, the field varies as:',
    ['1/r^3', '1/r^2', '1/r', 'r^2'],
    '1/r^3',
    'Both axial and equatorial far fields of a short dipole fall as 1/r^3.',
    'Apply',
    'Medium',
    ['electric dipole', 'axial field'],
  ],
  [
    'LIN',
    CHARGES,
    'Electric Field Lines',
    'Field-line rules',
    'Electric field lines never cross because:',
    [
      'the electric field has one direction at a point',
      'charges repel all lines',
      'field lines are circular',
      'the field is always uniform',
    ],
    'the electric field has one direction at a point',
    'Two crossing lines would imply two directions for the electric field at the same point.',
    'Understand',
    'Easy',
    ['electric field lines', 'direction'],
  ],
  [
    'LIN',
    CHARGES,
    'Electric Field Lines',
    'Field strength from line density',
    'Where field lines are closer together, electric field magnitude is generally:',
    ['larger', 'zero', 'smaller', 'independent of spacing'],
    'larger',
    'Line density is a diagrammatic indication of field strength.',
    'Understand',
    'Easy',
    ['electric field lines', 'field strength'],
  ],
  [
    'CON',
    CHARGES,
    'Conductors',
    'Electrostatic equilibrium',
    'Inside the material of a conductor in electrostatic equilibrium, electric field is:',
    [
      'zero',
      'constant and non-zero',
      'infinite',
      'equal to surface charge density',
    ],
    'zero',
    'Free charges redistribute until the electric field within the conducting material vanishes.',
    'Understand',
    'Easy',
    ['conductors', 'electrostatic equilibrium'],
  ],
  [
    'CON',
    CHARGES,
    'Conductors',
    'Surface charge and shielding',
    'Excess charge given to an isolated conductor resides:',
    [
      'on its outer surface',
      'uniformly throughout the volume',
      'only at its centre',
      'only on the inner surface',
    ],
    'on its outer surface',
    'In electrostatic equilibrium, excess charge moves to the outer surface.',
    'Remember',
    'Easy',
    ['conductors', 'surface charge'],
  ],
  [
    'GAU',
    CHARGES,
    "Gauss's Law",
    'Flux and enclosed charge',
    'The net flux through a closed surface enclosing charge q is:',
    ['q/epsilon_0', 'q/(2 epsilon_0)', 'epsilon_0/q', 'zero'],
    'q/epsilon_0',
    'Gauss law gives total outward flux as q enclosed divided by epsilon_0.',
    'Understand',
    'Medium',
    ["Gauss's law", 'electric flux'],
  ],
  [
    'GAU',
    CHARGES,
    "Gauss's Law",
    'External charges and net flux',
    'A charge outside a closed Gaussian surface changes the net flux through it by:',
    [
      'zero',
      'q/epsilon_0',
      'an amount based on distance',
      'an amount based on surface area',
    ],
    'zero',
    'External charges may change local field but their net contribution through a closed surface is zero.',
    'Analyze',
    'Medium',
    ["Gauss's law", 'external charge'],
  ],
  [
    'CLW',
    CHARGES,
    "Coulomb's Law",
    'Inverse-square dependence',
    'If separation between two fixed point charges is tripled, their force becomes:',
    ['one ninth', 'one third', 'three times', 'nine times'],
    'one ninth',
    'Coulomb force varies inversely as r squared.',
    'Apply',
    'Medium',
    ["Coulomb's law", 'inverse square'],
  ],
  [
    'CLW',
    CHARGES,
    "Coulomb's Law",
    'Medium and permittivity',
    'Compared with vacuum, a dielectric medium generally makes Coulomb force between fixed charges:',
    ['smaller', 'larger', 'zero in every case', 'independent of medium'],
    'smaller',
    'A medium with relative permittivity K reduces force to its vacuum value divided by K.',
    'Understand',
    'Medium',
    ["Coulomb's law", 'dielectric medium'],
  ],
  [
    'ELF',
    CHARGES,
    'Electric Field',
    'Definition and units',
    'A +3 C test charge experiences a 12 N force. Field magnitude is:',
    ['4 N/C', '36 N/C', '9 N/C', '15 N/C'],
    '4 N/C',
    'E = F/q = 12/3 = 4 N/C.',
    'Apply',
    'Easy',
    ['electric field', 'E=F/q'],
  ],
  [
    'ELF',
    CHARGES,
    'Electric Field',
    'Force direction',
    'A negative charge in an electric field directed east experiences force:',
    ['west', 'east', 'north', 'zero'],
    'west',
    'Force on a negative test charge is opposite to the electric field direction.',
    'Understand',
    'Easy',
    ['electric field', 'negative charge'],
  ],
  [
    'CAP',
    POTENTIAL,
    'Capacitance',
    'Definition and units',
    'Capacitance is the ratio:',
    ['Q/V', 'V/Q', 'QV', 'Q squared/V'],
    'Q/V',
    'Capacitance is charge stored per unit potential difference.',
    'Remember',
    'Easy',
    ['capacitance', 'definition'],
  ],
  [
    'CAP',
    POTENTIAL,
    'Capacitance',
    'Charge-voltage relation',
    'A 5 microF capacitor across 10 V stores charge:',
    ['50 microC', '2 microC', '0.5 microC', '500 microC'],
    '50 microC',
    'Q = CV = 5 microF times 10 V = 50 microC.',
    'Apply',
    'Easy',
    ['capacitance', 'Q=CV'],
  ],
  [
    'COM',
    POTENTIAL,
    'Capacitor Combinations',
    'Parallel capacitors',
    'Capacitors of 2 microF and 4 microF in parallel have equivalent capacitance:',
    ['6 microF', '1.33 microF', '2 microF', '8 microF'],
    '6 microF',
    'Parallel capacitances add directly.',
    'Apply',
    'Easy',
    ['capacitors', 'parallel'],
  ],
  [
    'COM',
    POTENTIAL,
    'Capacitor Combinations',
    'Series capacitors',
    'Capacitors of 2 microF and 4 microF in series have equivalent capacitance:',
    ['1.33 microF', '6 microF', '2 microF', '8 microF'],
    '1.33 microF',
    'For series connection, 1/Ceq = 1/2 + 1/4, so Ceq = 4/3 microF.',
    'Apply',
    'Medium',
    ['capacitors', 'series'],
  ],
  [
    'DIE',
    POTENTIAL,
    'Dielectrics',
    'Effect on capacitance',
    'A dielectric of constant K completely filling a capacitor changes its capacitance to:',
    ['KC', 'C/K', 'C+K', 'unchanged C'],
    'KC',
    'A dielectric increases capacitance by its dielectric constant.',
    'Understand',
    'Easy',
    ['dielectric', 'capacitance'],
  ],
  [
    'DIE',
    POTENTIAL,
    'Dielectrics',
    'Battery-connected capacitor',
    'A capacitor remains connected to a battery while a dielectric is inserted. Which remains constant?',
    ['potential difference', 'charge', 'capacitance', 'stored energy'],
    'potential difference',
    'The ideal battery fixes the potential difference across its terminals.',
    'Analyze',
    'Medium',
    ['dielectric', 'battery connected'],
  ],
  [
    'EPS',
    POTENTIAL,
    'Equipotential Surfaces',
    'Work on equipotential',
    'Work done moving a charge along an equipotential surface is:',
    ['zero', 'always positive', 'equal to qV', 'infinite'],
    'zero',
    'Potential difference along an equipotential is zero, hence W = q delta V is zero.',
    'Understand',
    'Easy',
    ['equipotential', 'work done'],
  ],
  [
    'EPS',
    POTENTIAL,
    'Equipotential Surfaces',
    'Field direction',
    'Electric field is perpendicular to equipotential surfaces because:',
    [
      'potential changes most rapidly along the field',
      'field is always circular',
      'equipotential surfaces carry no charge',
      'potential has no gradient',
    ],
    'potential changes most rapidly along the field',
    'E equals minus the gradient of potential, so it is normal to equipotential surfaces.',
    'Analyze',
    'Medium',
    ['equipotential', 'electric field'],
  ],
  [
    'ENG',
    POTENTIAL,
    'Energy Stored in a Capacitor',
    'Energy formula',
    'Energy stored in a capacitor can be written as:',
    ['one half CV squared', 'CV squared', 'Q/V', 'V/Q'],
    'one half CV squared',
    'One equivalent energy expression is U = 1/2 CV^2.',
    'Remember',
    'Easy',
    ['capacitor energy', 'formula'],
  ],
  [
    'ENG',
    POTENTIAL,
    'Energy Stored in a Capacitor',
    'Energy scaling',
    'At constant capacitance, doubling capacitor voltage changes stored energy by:',
    ['four times', 'two times', 'one half', 'no change'],
    'four times',
    'Energy is proportional to V squared at fixed capacitance.',
    'Apply',
    'Medium',
    ['capacitor energy', 'scaling'],
  ],
  [
    'VDG',
    POTENTIAL,
    'Van de Graaff Generator',
    'Charge transport',
    'A Van de Graaff generator builds high potential mainly by:',
    [
      'transporting charge to a hollow metal dome',
      'heating a resistor',
      'rotating a magnet in a coil',
      'discharging a battery',
    ],
    'transporting charge to a hollow metal dome',
    'An insulating belt transports charge to the dome, where it spreads over the outer surface.',
    'Understand',
    'Easy',
    ['Van de Graaff generator', 'charge transport'],
  ],
  [
    'VDG',
    POTENTIAL,
    'Van de Graaff Generator',
    'Potential of conducting sphere',
    'For a conducting sphere of radius R with charge Q, surface potential is:',
    ['kQ/R', 'kQ/R squared', 'kQR', 'zero'],
    'kQ/R',
    'Outside a charged conducting sphere, the potential is kQ/r; at the surface r = R.',
    'Apply',
    'Medium',
    ['Van de Graaff generator', 'conducting sphere'],
  ],
];

const QUESTIONS: SeedQuestion[] = RAW_QUESTIONS.map(
  (
    [
      prefix,
      chapter,
      topic,
      subtopic,
      text,
      options,
      answer,
      solution,
      bloom,
      difficulty,
      tags,
    ],
    index,
  ) => ({
    id: `PHY-COV-${prefix}-${String((index % 2) + 1).padStart(2, '0')}`,
    chapter,
    topic,
    subtopic,
    text,
    options,
    answer,
    solution,
    bloom,
    difficulty,
    tags,
  }),
);

const SUBTOPICS: Record<string, string[]> = {
  'Electric charge & field': ['Charge and field fundamentals'],
  'Gauss Law': ['Flux through closed surfaces'],
  "Coulomb's Law and Charge": [
    'Charge quantisation',
    'Coulomb force',
    'Superposition and scaling',
  ],
  "Electric Field and Gauss's Law": [
    'Field definition',
    'Electric flux',
    'Gaussian surfaces',
    'Symmetric charge distributions',
  ],
  'Electric Potential': ['Potential and work'],
  'Capacitance basics': ['Capacitance definition'],
  'Electric Potential and Capacitance': [
    'Potential and work',
    'Equipotential surfaces',
    'Capacitor networks',
    'Energy and dielectrics',
  ],
};

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const questions = app.get<Repository<Question>>(
      getRepositoryToken(Question),
    );
    const users = app.get<Repository<User>>(getRepositoryToken(User));
    const states = app.get<Repository<LearningTopicState>>(
      getRepositoryToken(LearningTopicState),
    );
    const sessions = app.get<Repository<LearningSession>>(
      getRepositoryToken(LearningSession),
    );
    for (const item of QUESTIONS) {
      const existing = await questions.findOne({
        where: { question_id: item.id },
      });
      const values = {
        question_id: item.id,
        subject: PHYSICS,
        chapter: item.chapter,
        topic: item.topic,
        subtopic: item.subtopic,
        question_text: item.text,
        options: item.options,
        correct_answer: item.answer,
        solution: item.solution,
        bloom_level: item.bloom,
        difficulty: item.difficulty,
        marks: 4,
        estimated_time_sec: item.difficulty === 'Medium' ? 90 : 60,
        concept_tags: item.tags,
        common_errors: [
          'Review the definition, sign convention, and condition before applying the formula.',
        ],
        status: QuestionPublicationStatus.PUBLISHED,
        source: QuestionSource.CURATED,
        quality_score: 94,
        published_at: new Date(),
      };
      await questions.save(
        existing ? Object.assign(existing, values) : questions.create(values),
      );
    }
    for (const [topic, labels] of Object.entries(SUBTOPICS)) {
      const rows = await questions.find({
        where: { subject: PHYSICS, topic },
        order: { question_id: 'ASC' },
      });
      for (const [index, row] of rows.entries()) {
        row.subtopic = labels[index % labels.length];
      }
      await questions.save(rows);
    }
    const user = await users.findOne({ where: { email: TARGET_EMAIL } });
    if (!user) throw new Error('Configured learner account was not found.');
    const routeStates = [
      {
        chapter: CHARGES,
        topic: 'Electric Dipole',
        level: 7,
        status: LearningTopicStatus.ACTIVE,
        answered: 18,
        correct: 13,
      },
      {
        chapter: CHARGES,
        topic: 'Conductors',
        level: 10,
        status: LearningTopicStatus.MASTERED,
        answered: 26,
        correct: 23,
      },
      {
        chapter: CHARGES,
        topic: "Gauss's Law",
        level: 4,
        status: LearningTopicStatus.PAUSED_FOR_PREREQUISITE,
        answered: 11,
        correct: 4,
      },
      {
        chapter: POTENTIAL,
        topic: 'Capacitor Combinations',
        level: 6,
        status: LearningTopicStatus.ACTIVE,
        answered: 16,
        correct: 11,
      },
      {
        chapter: POTENTIAL,
        topic: 'Dielectrics',
        level: 9,
        status: LearningTopicStatus.ACTIVE,
        answered: 22,
        correct: 18,
      },
      {
        chapter: POTENTIAL,
        topic: 'Equipotential Surfaces',
        level: 12,
        status: LearningTopicStatus.MASTERED,
        answered: 28,
        correct: 25,
      },
    ];
    for (const [index, item] of routeStates.entries()) {
      let state = await states.findOne({
        where: {
          userId: user.id,
          subject: PHYSICS,
          chapter: item.chapter,
          topic: item.topic,
        },
      });
      state =
        state ??
        states.create({
          userId: user.id,
          subject: PHYSICS,
          chapter: item.chapter,
          topic: item.topic,
        });
      Object.assign(state, {
        currentLevel: item.level,
        status: item.status,
        totalAnswered: item.answered,
        totalCorrect: item.correct,
        streakCounter: index % 3,
        lastActivityAt: new Date(Date.now() - (index + 7) * 86400000),
        masteredAt:
          item.status === LearningTopicStatus.MASTERED
            ? new Date(Date.now() - (index + 10) * 86400000)
            : null,
      });
      state = await states.save(state);
      const exists = await sessions.findOne({
        where: {
          userId: user.id,
          stateId: state.id,
          level: Math.max(1, item.level - 1),
          status: LearningSessionStatus.COMPLETED,
        },
      });
      if (!exists)
        await sessions.save(
          sessions.create({
            stateId: state.id,
            userId: user.id,
            subject: PHYSICS,
            chapter: item.chapter,
            topic: item.topic,
            level: Math.max(1, item.level - 1),
            bloomLevel: item.level >= 8 ? 'Apply' : 'Understand',
            difficulty: item.level >= 8 ? 'Hard' : 'Medium',
            status: LearningSessionStatus.COMPLETED,
            transition:
              item.status === LearningTopicStatus.MASTERED
                ? LearningSessionTransition.MASTERED
                : item.status === LearningTopicStatus.PAUSED_FOR_PREREQUISITE
                  ? LearningSessionTransition.PREREQUISITE
                  : LearningSessionTransition.ADVANCED,
            totalQuestions: 5,
            currentSequence: 6,
            completedAt: new Date(Date.now() - (index + 8) * 86400000),
          }),
        );
    }
    console.log(
      `Seeded ${QUESTIONS.length} subtopic questions and broad learner coverage.`,
    );
  } finally {
    await app.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
