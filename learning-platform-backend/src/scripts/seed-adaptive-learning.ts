import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Flashcard } from '../adaptive/flashcard.entity';
import { FlashcardSource, FlashcardStatus } from '../adaptive/adaptive.types';
import {
  Question,
  QuestionPublicationStatus,
  QuestionSource,
} from '../question.entity';

type QuestionSeed = Pick<
  Question,
  | 'question_id'
  | 'subject'
  | 'chapter'
  | 'topic'
  | 'question_text'
  | 'options'
  | 'correct_answer'
  | 'solution'
  | 'bloom_level'
  | 'difficulty'
  | 'marks'
  | 'estimated_time_sec'
  | 'concept_tags'
  | 'common_errors'
>;

const PHYSICS = 'Physics';
const CHARGES = 'Electric Charges and Fields';
const POTENTIAL = 'Electrostatic Potential and Capacitance';

/**
 * A small reviewed launch bank. It guarantees the baseline coordinate is live
 * immediately; the same database is then used as grounding for DeepSeek to
 * pre-generate all higher-level pools.
 */
const QUESTIONS: QuestionSeed[] = [
  {
    question_id: 'PHY-ADP-CL-01',
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Coulomb's Law and Charge",
    question_text: 'Which SI unit is used to measure electric charge?',
    options: ['Coulomb', 'Volt', 'Newton', 'Farad'],
    correct_answer: 'Coulomb',
    solution: 'Electric charge is measured in coulombs (C).',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 35,
    concept_tags: ['electric charge', 'SI units'],
    common_errors: ['Confusing charge with electric potential or force'],
  },
  {
    question_id: 'PHY-ADP-CL-02',
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Coulomb's Law and Charge",
    question_text: 'The magnitude of the elementary charge is approximately:',
    options: [
      '1.6 × 10⁻¹⁹ C',
      '9.1 × 10⁻³¹ C',
      '8.85 × 10⁻¹² C',
      '6.67 × 10⁻¹¹ C',
    ],
    correct_answer: '1.6 × 10⁻¹⁹ C',
    solution: 'The charge magnitude carried by a proton is e = 1.6 × 10⁻¹⁹ C.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 40,
    concept_tags: ['elementary charge', 'charge quantization'],
    common_errors: [
      'Confusing elementary charge with electron mass or permittivity',
    ],
  },
  {
    question_id: 'PHY-ADP-CL-03',
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Coulomb's Law and Charge",
    question_text:
      'Two charges of the same sign exert what kind of electrostatic force on each other?',
    options: ['Repulsive', 'Attractive', 'No force', 'Always perpendicular'],
    correct_answer: 'Repulsive',
    solution: 'Like charges repel and unlike charges attract.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 35,
    concept_tags: ['charge interaction', 'sign of charge'],
    common_errors: ['Reversing the attraction and repulsion rule'],
  },
  {
    question_id: 'PHY-ADP-CL-04',
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Coulomb's Law and Charge",
    question_text:
      'In vacuum, Coulomb force between two point charges varies inversely with:',
    options: [
      'The square of their separation',
      'Their separation',
      'The cube of their separation',
      'The sum of their masses',
    ],
    correct_answer: 'The square of their separation',
    solution:
      'Coulomb’s law contains the factor 1/r², where r is the separation.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 40,
    concept_tags: ["Coulomb's law", 'inverse square'],
    common_errors: [
      'Using inverse-distance instead of inverse-square variation',
    ],
  },
  {
    question_id: 'PHY-ADP-CL-05',
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Coulomb's Law and Charge",
    question_text: 'The value of Coulomb constant k in SI units is closest to:',
    options: [
      '9 × 10⁹ N m²/C²',
      '9 × 10⁻⁹ N m²/C²',
      '8.85 × 10⁻¹² N m²/C²',
      '6.67 × 10⁻¹¹ N m²/C²',
    ],
    correct_answer: '9 × 10⁹ N m²/C²',
    solution: 'In vacuum, k = 1/(4π ε₀) ≈ 9 × 10⁹ N m²/C².',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 45,
    concept_tags: ["Coulomb's constant", "Coulomb's law"],
    common_errors: [
      'Confusing k with permittivity or the gravitational constant',
    ],
  },
  {
    question_id: 'PHY-ADP-EF-01',
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Electric Field and Gauss's Law",
    question_text: 'Which SI unit is used for electric field intensity?',
    options: ['N/C', 'C/N', 'J/C', 'N m/C'],
    correct_answer: 'N/C',
    solution:
      'Electric field is force per unit positive test charge, so its unit is N/C.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 35,
    concept_tags: ['electric field', 'SI units'],
    common_errors: ['Confusing electric field with electric potential'],
  },
  {
    question_id: 'PHY-ADP-EF-02',
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Electric Field and Gauss's Law",
    question_text:
      'Electric field direction is defined as the direction of force on a:',
    options: [
      'Positive test charge',
      'Negative test charge',
      'Neutral particle',
      'Current-carrying wire',
    ],
    correct_answer: 'Positive test charge',
    solution:
      'By convention, field direction is the force direction on a positive test charge.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 40,
    concept_tags: ['electric field direction', 'test charge'],
    common_errors: ['Using the force direction on a negative test charge'],
  },
  {
    question_id: 'PHY-ADP-EF-03',
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Electric Field and Gauss's Law",
    question_text:
      'The electric field due to an isolated positive point charge points:',
    options: [
      'Radially outward',
      'Radially inward',
      'In closed circles',
      'Only upward',
    ],
    correct_answer: 'Radially outward',
    solution:
      'A positive test charge is repelled, so field lines point outward from a positive source.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 35,
    concept_tags: ['electric field direction', 'positive charge'],
    common_errors: ['Reversing the field direction for a positive source'],
  },
  {
    question_id: 'PHY-ADP-EF-04',
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Electric Field and Gauss's Law",
    question_text:
      'Which equation defines electric field magnitude for a test charge q experiencing force F?',
    options: ['E = F/q', 'E = Fq', 'E = q/F', 'E = F²/q'],
    correct_answer: 'E = F/q',
    solution: 'Electric field is the force per unit test charge: E = F/q.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 40,
    concept_tags: ['electric field', 'E=F/q'],
    common_errors: ['Multiplying force by charge instead of dividing'],
  },
  {
    question_id: 'PHY-ADP-EF-05',
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Electric Field and Gauss's Law",
    question_text:
      'According to Gauss’s law, net flux through a closed surface depends directly on:',
    options: [
      'Net enclosed charge',
      'Surface area only',
      'Shape of the surface only',
      'External charges only',
    ],
    correct_answer: 'Net enclosed charge',
    solution:
      'Gauss’s law states that net electric flux is enclosed charge divided by ε₀.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 45,
    concept_tags: ["Gauss's law", 'electric flux'],
    common_errors: [
      'Treating surface area or shape as the determinant of net closed-surface flux',
    ],
  },
  {
    question_id: 'PHY-ADP-PC-01',
    subject: PHYSICS,
    chapter: POTENTIAL,
    topic: 'Electric Potential and Capacitance',
    question_text: 'Which SI unit is used for electric potential?',
    options: ['Volt', 'Coulomb', 'Tesla', 'Farad'],
    correct_answer: 'Volt',
    solution: 'Electric potential is measured in volts (V).',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 35,
    concept_tags: ['electric potential', 'SI units'],
    common_errors: ['Confusing potential with charge or capacitance'],
  },
  {
    question_id: 'PHY-ADP-PC-02',
    subject: PHYSICS,
    chapter: POTENTIAL,
    topic: 'Electric Potential and Capacitance',
    question_text: 'Capacitance C of an isolated conductor is defined by:',
    options: ['C = Q/V', 'C = V/Q', 'C = QV', 'C = Q²/V'],
    correct_answer: 'C = Q/V',
    solution:
      'Capacitance is charge stored per unit potential difference: C = Q/V.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 40,
    concept_tags: ['capacitance', 'definition'],
    common_errors: ['Inverting the capacitance relation'],
  },
  {
    question_id: 'PHY-ADP-PC-03',
    subject: PHYSICS,
    chapter: POTENTIAL,
    topic: 'Electric Potential and Capacitance',
    question_text: 'The SI unit of capacitance is:',
    options: ['Farad', 'Henry', 'Weber', 'Ohm'],
    correct_answer: 'Farad',
    solution: 'Capacitance is measured in farads (F).',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 35,
    concept_tags: ['capacitance', 'SI units'],
    common_errors: [
      'Confusing capacitance with inductance or resistance units',
    ],
  },
  {
    question_id: 'PHY-ADP-PC-04',
    subject: PHYSICS,
    chapter: POTENTIAL,
    topic: 'Electric Potential and Capacitance',
    question_text: 'The energy stored in a capacitor can be written as:',
    options: ['½CV²', 'CV²', 'Q/V', 'V/Q'],
    correct_answer: '½CV²',
    solution:
      'A capacitor stores energy U = ½CV², with equivalent forms involving Q.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 40,
    concept_tags: ['capacitor energy', 'formula'],
    common_errors: ['Omitting the one-half factor'],
  },
  {
    question_id: 'PHY-ADP-PC-05',
    subject: PHYSICS,
    chapter: POTENTIAL,
    topic: 'Electric Potential and Capacitance',
    question_text:
      'For capacitors connected in parallel, equivalent capacitance is found by:',
    options: [
      'Adding individual capacitances',
      'Adding reciprocals',
      'Multiplying individual capacitances',
      'Taking the smallest capacitance',
    ],
    correct_answer: 'Adding individual capacitances',
    solution:
      'Parallel capacitors share the same potential difference, so C_eq = C₁ + C₂ + ... .',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    estimated_time_sec: 40,
    concept_tags: ['capacitors in parallel', 'equivalent capacitance'],
    common_errors: ['Using the series reciprocal rule for parallel capacitors'],
  },
];

const FLASHCARDS: Array<
  Pick<
    Flashcard,
    'subject' | 'chapter' | 'topic' | 'front' | 'back' | 'hint' | 'tags'
  >
> = [
  {
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Coulomb's Law and Charge",
    front: 'What is the direction rule for two point charges?',
    back: 'Like charges repel; unlike charges attract.',
    hint: 'Think about the signs first.',
    tags: ['sign of charge', 'interaction'],
  },
  {
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Coulomb's Law and Charge",
    front: 'State Coulomb’s law for force magnitude.',
    back: 'F = k|q₁q₂|/r² in vacuum.',
    hint: 'Recall the dependence on both charges and separation.',
    tags: ["Coulomb's law", 'inverse square'],
  },
  {
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Coulomb's Law and Charge",
    front: 'What is the elementary charge magnitude?',
    back: 'e = 1.6 × 10⁻¹⁹ C.',
    hint: 'It is the magnitude of proton charge.',
    tags: ['elementary charge', 'quantization'],
  },
  {
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Coulomb's Law and Charge",
    front: 'What happens to Coulomb force if separation doubles?',
    back: 'It becomes one fourth because F ∝ 1/r².',
    hint: 'Use the exponent on r.',
    tags: ["Coulomb's law", 'scaling'],
  },
  {
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Electric Field and Gauss's Law",
    front: 'How is electric field defined?',
    back: 'E = F/q for a positive test charge.',
    hint: 'It is force per unit charge.',
    tags: ['electric field', 'definition'],
  },
  {
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Electric Field and Gauss's Law",
    front: 'Which way does field from a positive point charge point?',
    back: 'Radially outward.',
    hint: 'Imagine a positive test charge nearby.',
    tags: ['field direction', 'positive charge'],
  },
  {
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Electric Field and Gauss's Law",
    front: 'State Gauss’s law.',
    back: '∮E·dA = q_enclosed/ε₀.',
    hint: 'Use net flux through a closed surface.',
    tags: ["Gauss's law", 'electric flux'],
  },
  {
    subject: PHYSICS,
    chapter: CHARGES,
    topic: "Electric Field and Gauss's Law",
    front: 'What is the SI unit of electric field?',
    back: 'N/C, equivalently V/m.',
    hint: 'Start from force divided by charge.',
    tags: ['electric field', 'SI units'],
  },
  {
    subject: PHYSICS,
    chapter: POTENTIAL,
    topic: 'Electric Potential and Capacitance',
    front: 'Define capacitance.',
    back: 'C = Q/V.',
    hint: 'Charge stored per potential difference.',
    tags: ['capacitance', 'definition'],
  },
  {
    subject: PHYSICS,
    chapter: POTENTIAL,
    topic: 'Electric Potential and Capacitance',
    front: 'State one capacitor-energy formula.',
    back: 'U = ½CV² = Q²/(2C) = ½QV.',
    hint: 'There is a one-half factor.',
    tags: ['capacitor energy', 'formula'],
  },
  {
    subject: PHYSICS,
    chapter: POTENTIAL,
    topic: 'Electric Potential and Capacitance',
    front: 'What is the work done along an equipotential surface?',
    back: 'Zero, because ΔV = 0 and W = qΔV.',
    hint: 'Relate work to potential difference.',
    tags: ['equipotential', 'work done'],
  },
  {
    subject: PHYSICS,
    chapter: POTENTIAL,
    topic: 'Electric Potential and Capacitance',
    front: 'How do capacitors combine in parallel?',
    back: 'C_eq = C₁ + C₂ + ... .',
    hint: 'They share the same potential difference.',
    tags: ['parallel capacitors', 'equivalent capacitance'],
  },
];

async function upsertQuestion(
  repository: Repository<Question>,
  input: QuestionSeed,
) {
  const existing = await repository.findOne({
    where: { question_id: input.question_id },
  });
  const values = {
    ...input,
    subtopic: null,
    status: QuestionPublicationStatus.PUBLISHED,
    source: QuestionSource.CURATED,
    quality_score: 96,
    created_by_user_id: null,
    reviewed_by_user_id: null,
    reviewed_at: null,
    review_notes: 'Curated adaptive-learning foundation record.',
    published_at: new Date(),
  };
  if (existing) {
    Object.assign(existing, values);
    await repository.save(existing);
    return;
  }
  await repository.save(repository.create(values));
}

async function upsertFlashcard(
  repository: Repository<Flashcard>,
  input: (typeof FLASHCARDS)[number],
) {
  const existing = await repository.findOne({
    where: {
      subject: input.subject,
      chapter: input.chapter,
      topic: input.topic,
      front: input.front,
    },
  });
  const values = {
    ...input,
    source: FlashcardSource.CURATED,
    status: FlashcardStatus.PUBLISHED,
  };
  if (existing) {
    Object.assign(existing, values);
    await repository.save(existing);
    return;
  }
  await repository.save(repository.create(values));
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const questionsRepository = app.get<Repository<Question>>(
    getRepositoryToken(Question),
  );
  const flashcardsRepository = app.get<Repository<Flashcard>>(
    getRepositoryToken(Flashcard),
  );
  for (const question of QUESTIONS)
    await upsertQuestion(questionsRepository, question);
  for (const flashcard of FLASHCARDS)
    await upsertFlashcard(flashcardsRepository, flashcard);
  console.log(
    `Seeded ${QUESTIONS.length} reviewed adaptive questions and ${FLASHCARDS.length} flashcards.`,
  );
  await app.close();
}

void bootstrap();
