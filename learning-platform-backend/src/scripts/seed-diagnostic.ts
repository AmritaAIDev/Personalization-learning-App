import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { LearningResource } from '../diagnostics/learning-resource.entity';
import { LearningResourceType } from '../diagnostics/diagnostic.types';
import { Question } from '../question.entity';
import { FOUNDATION_QUESTION_BANK } from './seed-foundation-bank';

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
> & {
  quality_score?: number;
};

const PHYSICS = 'Physics';
const CHAPTER_ONE = 'Electric Charges and Fields';
const CHAPTER_TWO = 'Electrostatic Potential and Capacitance';

const QUESTIONS: QuestionSeed[] = [
  ...FOUNDATION_QUESTION_BANK,
  {
    question_id: 'PHY-ES-001',
    subject: PHYSICS,
    chapter: CHAPTER_ONE,
    topic: "Coulomb's Law",
    question_text: 'What is the SI unit of electric charge?',
    options: ['Ampere', 'Coulomb', 'Volt', 'Farad'],
    correct_answer: 'Coulomb',
    solution: 'Electric charge is measured in coulombs (C) in the SI system.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 4,
    estimated_time_sec: 45,
    concept_tags: ['electric charge', 'SI units'],
    common_errors: ['Confusing charge with current or potential'],
  },
  {
    question_id: 'PHY-ES-002',
    subject: PHYSICS,
    chapter: CHAPTER_ONE,
    topic: "Coulomb's Law",
    question_text:
      'For two fixed point charges, the electrostatic force is inversely proportional to which quantity?',
    options: [
      'The distance between them',
      'The square of the distance between them',
      'The cube of the distance between them',
      'The product of their masses',
    ],
    correct_answer: 'The square of the distance between them',
    solution:
      "Coulomb's law is F = k|q₁q₂|/r², so force varies inversely with r².",
    bloom_level: 'Understand',
    difficulty: 'Medium',
    marks: 4,
    estimated_time_sec: 60,
    concept_tags: ["Coulomb's law", 'inverse square'],
    common_errors: ['Using 1/r instead of 1/r²'],
  },
  {
    question_id: 'PHY-ES-003',
    subject: PHYSICS,
    chapter: CHAPTER_ONE,
    topic: 'Electric Field',
    question_text:
      'Which of the following is an SI unit of electric field intensity?',
    options: ['N/C', 'C/N', 'J/C', 'C·m'],
    correct_answer: 'N/C',
    solution:
      'Electric field is force per unit charge, so its SI unit is newton per coulomb.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 4,
    estimated_time_sec: 45,
    concept_tags: ['electric field', 'SI units'],
    common_errors: ['Using volt as an electric-field unit without distance'],
  },
  {
    question_id: 'PHY-ES-004',
    subject: PHYSICS,
    chapter: CHAPTER_ONE,
    topic: 'Electric Field Lines',
    question_text:
      'The electric field lines of an isolated positive point charge are directed:',
    options: [
      'Towards the charge',
      'Away from the charge',
      'In closed circles around the charge',
      'Parallel to one another everywhere',
    ],
    correct_answer: 'Away from the charge',
    solution:
      'A positive test charge is repelled by a positive source charge, so field lines point outward.',
    bloom_level: 'Understand',
    difficulty: 'Easy',
    marks: 4,
    estimated_time_sec: 45,
    concept_tags: ['field lines', 'positive charge'],
    common_errors: ['Reversing the field-line direction for positive charge'],
  },
  {
    question_id: 'PHY-ES-005',
    subject: PHYSICS,
    chapter: CHAPTER_ONE,
    topic: "Gauss's Law",
    question_text:
      'A point charge q is placed at the centre of a cube. What is the electric flux through one face of the cube?',
    options: ['q/ε₀', 'q/(2ε₀)', 'q/(4ε₀)', 'q/(6ε₀)'],
    correct_answer: 'q/(6ε₀)',
    solution:
      'The total flux through the cube is q/ε₀. Symmetry divides it equally among six faces.',
    bloom_level: 'Apply',
    difficulty: 'Hard',
    marks: 4,
    estimated_time_sec: 120,
    concept_tags: ["Gauss's law", 'electric flux', 'symmetry'],
    common_errors: ['Assigning total flux to one face'],
  },
  {
    question_id: 'PHY-ES-006',
    subject: PHYSICS,
    chapter: CHAPTER_ONE,
    topic: 'Conductors',
    question_text:
      'In electrostatic equilibrium, the electric field inside the material of an ideal conductor is:',
    options: [
      'Zero',
      'Uniform and non-zero',
      'Infinite',
      'Equal to the field just outside the surface',
    ],
    correct_answer: 'Zero',
    solution:
      'Free charges rearrange until any internal electric field is cancelled.',
    bloom_level: 'Understand',
    difficulty: 'Medium',
    marks: 4,
    estimated_time_sec: 60,
    concept_tags: ['conductors', 'electrostatic equilibrium'],
    common_errors: [
      'Assuming a conductor carries field internally because it has charge',
    ],
  },
  {
    question_id: 'PHY-ES-007',
    subject: PHYSICS,
    chapter: CHAPTER_ONE,
    topic: 'Electric Dipole',
    question_text:
      'What is the magnitude of torque on an electric dipole of dipole moment p in a uniform electric field E at angle θ?',
    options: ['pE cos θ', 'pE sin θ', 'pE tan θ', 'pE/θ'],
    correct_answer: 'pE sin θ',
    solution: 'The dipole torque is τ = p × E, so |τ| = pE sin θ.',
    bloom_level: 'Apply',
    difficulty: 'Medium',
    marks: 4,
    estimated_time_sec: 75,
    concept_tags: ['electric dipole', 'torque'],
    common_errors: ['Using cos θ instead of sin θ'],
  },
  {
    question_id: 'PHY-ES-008',
    subject: PHYSICS,
    chapter: CHAPTER_ONE,
    topic: 'Electric Field',
    question_text:
      'According to the superposition principle, the net electric field produced by several charges at a point is:',
    options: [
      'The vector sum of the fields due to individual charges',
      'The scalar sum of the charge magnitudes',
      'Always zero when positive and negative charges are present',
      'The product of the individual fields',
    ],
    correct_answer: 'The vector sum of the fields due to individual charges',
    solution:
      'Electric field is a vector; each source contribution must be added with its direction.',
    bloom_level: 'Analyze',
    difficulty: 'Hard',
    marks: 4,
    estimated_time_sec: 105,
    concept_tags: ['electric field', 'superposition', 'vectors'],
    common_errors: ['Adding field magnitudes without considering direction'],
  },
  {
    question_id: 'PHY-ES-009',
    subject: PHYSICS,
    chapter: CHAPTER_ONE,
    topic: 'Electric Field',
    question_text:
      'The magnitude of electric field at distance r from a point charge q in vacuum is:',
    options: ['kq/r', 'kq/r²', 'kr²/q', 'q/(kr²)'],
    correct_answer: 'kq/r²',
    solution: 'For a point charge, E = k|q|/r².',
    bloom_level: 'Apply',
    difficulty: 'Medium',
    marks: 4,
    estimated_time_sec: 60,
    concept_tags: ['electric field', 'point charge'],
    common_errors: ['Using the electric-potential expression kq/r'],
  },
  {
    question_id: 'PHY-ES-010',
    subject: PHYSICS,
    chapter: CHAPTER_ONE,
    topic: 'Conductors',
    question_text:
      'A hollow conducting shell has an empty cavity and an external point charge nearby. The electric field everywhere inside the cavity is:',
    options: [
      'Zero',
      'Directed toward the external charge',
      'Uniform and non-zero',
      'Proportional to the shell radius',
    ],
    correct_answer: 'Zero',
    solution:
      'Electrostatic shielding makes the potential constant and the electric field zero inside an empty closed conductor cavity.',
    bloom_level: 'Analyze',
    difficulty: 'Hard',
    marks: 4,
    estimated_time_sec: 120,
    concept_tags: ['conductors', 'electrostatic shielding', "Gauss's law"],
    common_errors: [
      'Assuming the external charge field penetrates a closed conductor',
    ],
  },
  {
    question_id: 'PHY-ES-011',
    subject: PHYSICS,
    chapter: CHAPTER_TWO,
    topic: 'Electric Potential',
    question_text: 'What is the SI unit of electric potential?',
    options: ['Volt', 'Coulomb', 'Tesla', 'Weber'],
    correct_answer: 'Volt',
    solution:
      'Electric potential is energy per unit charge and is measured in volts.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 4,
    estimated_time_sec: 45,
    concept_tags: ['electric potential', 'SI units'],
    common_errors: ['Confusing potential with charge'],
  },
  {
    question_id: 'PHY-ES-012',
    subject: PHYSICS,
    chapter: CHAPTER_TWO,
    topic: 'Equipotential Surfaces',
    question_text:
      'The work done in moving a test charge between two points on the same equipotential surface is:',
    options: [
      'Zero',
      'Positive and maximum',
      'Negative and maximum',
      'Dependent only on the test-charge mass',
    ],
    correct_answer: 'Zero',
    solution:
      'Potential difference along an equipotential surface is zero, hence W = qΔV = 0.',
    bloom_level: 'Understand',
    difficulty: 'Easy',
    marks: 4,
    estimated_time_sec: 60,
    concept_tags: ['equipotential surface', 'work done'],
    common_errors: ['Using path length rather than potential difference'],
  },
  {
    question_id: 'PHY-ES-013',
    subject: PHYSICS,
    chapter: CHAPTER_TWO,
    topic: 'Capacitance',
    question_text:
      'A 6 μF capacitor is connected across a 12 V source. What charge is stored on it?',
    options: ['0.5 μC', '18 μC', '72 μC', '144 μC'],
    correct_answer: '72 μC',
    solution: 'Q = CV = 6 μF × 12 V = 72 μC.',
    bloom_level: 'Apply',
    difficulty: 'Medium',
    marks: 4,
    estimated_time_sec: 75,
    concept_tags: ['capacitance', 'charge', 'Q=CV'],
    common_errors: ['Dividing voltage by capacitance'],
  },
  {
    question_id: 'PHY-ES-014',
    subject: PHYSICS,
    chapter: CHAPTER_TWO,
    topic: 'Energy Stored in a Capacitor',
    question_text: 'The energy stored in a 2 μF capacitor charged to 10 V is:',
    options: ['10 μJ', '50 μJ', '100 μJ', '200 μJ'],
    correct_answer: '100 μJ',
    solution: 'U = ½CV² = ½ × 2 μF × (10 V)² = 100 μJ.',
    bloom_level: 'Apply',
    difficulty: 'Medium',
    marks: 4,
    estimated_time_sec: 90,
    concept_tags: ['capacitor energy', 'U=½CV²'],
    common_errors: ['Omitting the one-half factor'],
  },
  {
    question_id: 'PHY-ES-015',
    subject: PHYSICS,
    chapter: CHAPTER_TWO,
    topic: 'Capacitor Combinations',
    question_text:
      'Capacitors of 3 μF and 6 μF are connected in series across 18 V. The potential difference across the 3 μF capacitor is:',
    options: ['3 V', '6 V', '9 V', '12 V'],
    correct_answer: '12 V',
    solution:
      'Series capacitance is 2 μF, giving Q = 36 μC. Therefore V across 3 μF is Q/C = 12 V.',
    bloom_level: 'Analyze',
    difficulty: 'Hard',
    marks: 4,
    estimated_time_sec: 150,
    concept_tags: ['capacitors in series', 'potential difference'],
    common_errors: ['Dividing voltage equally despite unequal capacitances'],
  },
  {
    question_id: 'PHY-ES-016',
    subject: PHYSICS,
    chapter: CHAPTER_TWO,
    topic: 'Capacitance',
    question_text: 'The capacitance of an isolated conductor is defined as:',
    options: ['Q/V', 'V/Q', 'QV', 'Q²/V'],
    correct_answer: 'Q/V',
    solution:
      'By definition, capacitance C is the charge stored per unit potential difference: C = Q/V.',
    bloom_level: 'Remember',
    difficulty: 'Medium',
    marks: 4,
    estimated_time_sec: 60,
    concept_tags: ['capacitance', 'definition'],
    common_errors: ['Inverting the capacitance definition'],
  },
  {
    question_id: 'PHY-ES-017',
    subject: PHYSICS,
    chapter: CHAPTER_TWO,
    topic: 'Dielectrics',
    question_text:
      'If a parallel-plate capacitor is completely filled with a dielectric of constant K, its capacitance becomes:',
    options: ['C/K', 'KC', 'C + K', 'Unchanged'],
    correct_answer: 'KC',
    solution:
      'A dielectric increases capacitance by its dielectric constant: C′ = KC.',
    bloom_level: 'Understand',
    difficulty: 'Medium',
    marks: 4,
    estimated_time_sec: 75,
    concept_tags: ['dielectric', 'capacitance'],
    common_errors: ['Assuming the dielectric reduces capacitance'],
  },
  {
    question_id: 'PHY-ES-018',
    subject: PHYSICS,
    chapter: CHAPTER_TWO,
    topic: 'Dielectrics',
    question_text:
      'For a parallel-plate capacitor C = ε₀A/d. If the plate area is doubled and a dielectric of constant 3 completely fills the gap, the new capacitance is:',
    options: ['C/6', '3C', '5C', '6C'],
    correct_answer: '6C',
    solution:
      'Doubling A gives 2C, and the dielectric multiplies that by 3, so C′ = 6C.',
    bloom_level: 'Analyze',
    difficulty: 'Hard',
    marks: 4,
    estimated_time_sec: 120,
    concept_tags: ['parallel plate capacitor', 'dielectric', 'scaling'],
    common_errors: ['Applying only one of the two changes'],
  },
  {
    question_id: 'PHY-ES-019',
    subject: PHYSICS,
    chapter: CHAPTER_TWO,
    topic: 'Van de Graaff Generator',
    question_text:
      'The primary purpose of a Van de Graaff generator is to produce:',
    options: [
      'A very high electrostatic potential',
      'A steady electric current',
      'A strong magnetic field',
      'A low-resistance circuit',
    ],
    correct_answer: 'A very high electrostatic potential',
    solution:
      'A Van de Graaff generator accumulates charge on a dome to create very high potential differences.',
    bloom_level: 'Remember',
    difficulty: 'Easy',
    marks: 4,
    estimated_time_sec: 45,
    concept_tags: ['Van de Graaff generator', 'high voltage'],
    common_errors: ['Confusing high potential with high current'],
  },
  {
    question_id: 'PHY-ES-020',
    subject: PHYSICS,
    chapter: CHAPTER_TWO,
    topic: 'Dielectrics',
    question_text:
      'A charged capacitor is disconnected from its battery and then completely filled with a dielectric of constant K. Its potential difference becomes:',
    options: ['KV', 'V/K', 'V', 'K²V'],
    correct_answer: 'V/K',
    solution:
      'The capacitor is isolated, so charge stays constant while capacitance becomes KC. Since V = Q/C, the voltage falls to V/K.',
    bloom_level: 'Analyze',
    difficulty: 'Hard',
    marks: 4,
    estimated_time_sec: 135,
    concept_tags: ['dielectric', 'isolated capacitor', 'charge conservation'],
    common_errors: [
      'Assuming voltage remains constant after disconnecting the battery',
    ],
  },
];

const TOPIC_FORMULAS: Array<{ topic: string; formula: string }> = [
  { topic: "Coulomb's Law", formula: 'F = k|q₁q₂| / r²' },
  {
    topic: 'Electric Field',
    formula: 'E = F/q; for a point charge E = k|q|/r²',
  },
  {
    topic: 'Electric Field Lines',
    formula: 'Field lines start on + charges and end on − charges.',
  },
  { topic: "Gauss's Law", formula: '∮ E · dA = q_enclosed / ε₀' },
  {
    topic: 'Conductors',
    formula: 'At electrostatic equilibrium: E_inside = 0.',
  },
  { topic: 'Electric Dipole', formula: 'τ = pE sin θ' },
  {
    topic: 'Electric Potential',
    formula: 'V = W/q; for a point charge V = kq/r',
  },
  {
    topic: 'Equipotential Surfaces',
    formula: 'Along an equipotential surface: ΔV = 0 and W = qΔV = 0.',
  },
  { topic: 'Capacitance', formula: 'C = Q/V' },
  {
    topic: 'Energy Stored in a Capacitor',
    formula: 'U = ½CV² = Q²/(2C) = ½QV',
  },
  {
    topic: 'Capacitor Combinations',
    formula: 'Parallel: C_eq = ΣC; Series: 1/C_eq = Σ(1/C).',
  },
  { topic: 'Dielectrics', formula: 'For full dielectric filling: C′ = KC.' },
  {
    topic: 'Van de Graaff Generator',
    formula: 'V = Q/C; charge accumulation raises dome potential.',
  },
];

function toSearchUrl(topic: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`JEE Physics ${topic}`)}`;
}

function topicResources(
  topic: string,
  formula: string,
): Array<Partial<LearningResource>> {
  return [
    {
      subject: PHYSICS,
      topic,
      resourceType: LearningResourceType.VIDEO,
      title: `${topic} video lesson`,
      description: 'A focused JEE Physics video search for this weak topic.',
      url: toSearchUrl(topic),
      content: null,
      isGeneral: false,
    },
    {
      subject: PHYSICS,
      topic,
      resourceType: LearningResourceType.NOTES,
      title: `${topic} NCERT study notes`,
      description:
        'Review the Class XII Physics theory before retrying this topic.',
      url: 'https://ncert.nic.in/textbook.php',
      content: null,
      isGeneral: false,
    },
    {
      subject: PHYSICS,
      topic,
      resourceType: LearningResourceType.PRACTICE,
      title: `${topic} practice set`,
      description: 'Practice JEE-style questions after revising the concept.',
      url: 'https://jeemain.nta.nic.in/',
      content: null,
      isGeneral: false,
    },
    {
      subject: PHYSICS,
      topic,
      resourceType: LearningResourceType.FORMULA,
      title: `${topic} key formula`,
      description: null,
      url: null,
      content: formula,
      isGeneral: false,
    },
  ];
}

const GENERAL_RESOURCES: Array<Partial<LearningResource>> = [
  {
    subject: PHYSICS,
    topic: 'General',
    resourceType: LearningResourceType.NOTES,
    title: 'NCERT Class XII Physics',
    description:
      'The primary theory reference for Phase 1 Electrostatics revision.',
    url: 'https://ncert.nic.in/textbook.php',
    content: null,
    isGeneral: true,
  },
  {
    subject: PHYSICS,
    topic: 'General',
    resourceType: LearningResourceType.PRACTICE,
    title: 'JEE Main official portal',
    description: 'Official examination and preparation information.',
    url: 'https://jeemain.nta.nic.in/',
    content: null,
    isGeneral: true,
  },
  {
    subject: PHYSICS,
    topic: 'General',
    resourceType: LearningResourceType.VIDEO,
    title: 'Electrostatics revision videos',
    description: 'A curated YouTube search for Phase 1 revision.',
    url: toSearchUrl('Electrostatics revision'),
    content: null,
    isGeneral: true,
  },
  {
    subject: PHYSICS,
    topic: 'General',
    resourceType: LearningResourceType.FORMULA,
    title: 'Electrostatics formula checklist',
    description: 'Use this as a compact formula-revision starting point.',
    url: null,
    content: 'F = kq₁q₂/r²; E = kq/r²; V = kq/r; C = Q/V; U = ½CV².',
    isGeneral: true,
  },
];

async function upsertQuestion(
  repository: Repository<Question>,
  input: QuestionSeed,
): Promise<void> {
  const existing = await repository.findOne({
    where: { question_id: input.question_id },
  });
  if (existing) {
    Object.assign(existing, input);
    await repository.save(existing);
    return;
  }
  await repository.save(repository.create(input));
}

async function upsertResource(
  repository: Repository<LearningResource>,
  input: Partial<LearningResource>,
): Promise<void> {
  const existing = await repository.findOne({
    where: {
      subject: input.subject,
      topic: input.topic,
      resourceType: input.resourceType,
      title: input.title,
    },
  });
  if (existing) {
    Object.assign(existing, input);
    await repository.save(existing);
    return;
  }
  await repository.save(repository.create(input));
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const questionsRepository = app.get<Repository<Question>>(
    getRepositoryToken(Question),
  );
  const resourcesRepository = app.get<Repository<LearningResource>>(
    getRepositoryToken(LearningResource),
  );

  for (const question of QUESTIONS) {
    await upsertQuestion(questionsRepository, question);
  }
  for (const item of TOPIC_FORMULAS) {
    for (const resource of topicResources(item.topic, item.formula)) {
      await upsertResource(resourcesRepository, resource);
    }
  }
  for (const resource of GENERAL_RESOURCES) {
    await upsertResource(resourcesRepository, resource);
  }

  console.log(
    `Seeded ${QUESTIONS.length} Electrostatics diagnostic questions and ${TOPIC_FORMULAS.length * 4 + GENERAL_RESOURCES.length} learning resources.`,
  );
  await app.close();
}

void bootstrap();
