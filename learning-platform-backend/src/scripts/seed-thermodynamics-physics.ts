import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import {
  Question,
  QuestionPublicationStatus,
  QuestionSource,
} from '../question.entity';

/**
 * Adds a Physics chapter not yet covered: "Thermodynamics" — distinct from
 * the existing Chemistry "Thermodynamics" chapter; subject + chapter is the
 * composite scope key, so this does not collide with it. Only writes to the
 * `questions` table (see seed-work-energy-power.ts for why: the `topics`
 * hierarchy entity is unused dead code).
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Physics';
const CHAPTER_NAME = 'Thermodynamics';

type TopicDefinition = {
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
    subtopic: 'Laws of Thermodynamics',
    questions: [
      {
        text: 'The first law of thermodynamics is a statement of:',
        options: [
          'conservation of energy',
          'conservation of momentum',
          'increase of entropy',
          'conservation of mass',
        ],
        answer: 'conservation of energy',
        solution:
          'The first law states that heat added to a system equals the change in internal energy plus the work done by the system, an expression of energy conservation.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'According to the first law of thermodynamics, if Q is heat added to a system, W is work done by the system, and change-in-U is the change in internal energy, then:',
        options: [
          'Q = change-in-U + W',
          'Q = change-in-U - W',
          'change-in-U = Q + W',
          'W = Q + change-in-U',
        ],
        answer: 'Q = change-in-U + W',
        solution:
          'The first law states Q = change-in-U + W: heat supplied equals the increase in internal energy plus the work done by the system.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The second law of thermodynamics implies that:',
        options: [
          'heat cannot spontaneously flow from a colder to a hotter body without external work',
          'energy can be created',
          'all processes are reversible',
          'entropy always decreases',
        ],
        answer:
          'heat cannot spontaneously flow from a colder to a hotter body without external work',
        solution:
          'This is the Clausius statement of the second law of thermodynamics.',
        bloom: 'Understand',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Heat, Work and Internal Energy',
    questions: [
      {
        text: 'In an isothermal process, the internal energy of an ideal gas:',
        options: [
          'remains constant',
          'always increases',
          'always decreases',
          'becomes zero',
        ],
        answer: 'remains constant',
        solution:
          "For an ideal gas, internal energy depends only on temperature; since temperature doesn't change in an isothermal process, internal energy stays constant.",
        bloom: 'Understand',
        difficulty: 'Medium',
      },
      {
        text: '100 J of heat is supplied to a gas which does 30 J of work on its surroundings. The change in internal energy of the gas is:',
        options: ['70 J', '130 J', '30 J', '100 J'],
        answer: '70 J',
        solution:
          'From Q = change-in-U + W: change-in-U = Q - W = 100 - 30 = 70 J.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
      {
        text: 'The work done by a gas expanding at constant pressure P from volume V1 to V2 is given by:',
        options: ['P (V2 - V1)', 'P (V1 - V2)', 'P V1 V2', '(V2 - V1) / P'],
        answer: 'P (V2 - V1)',
        solution: 'At constant pressure, W = P x change-in-V = P (V2 - V1).',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
    ],
  },
  {
    subtopic: 'Thermodynamic Processes',
    questions: [
      {
        text: 'A process occurring at constant volume is called:',
        options: ['isochoric', 'isobaric', 'isothermal', 'adiabatic'],
        answer: 'isochoric',
        solution:
          'An isochoric (or isometric) process occurs at constant volume.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'In an adiabatic process:',
        options: [
          'no heat is exchanged with the surroundings',
          'temperature remains constant',
          'pressure remains constant',
          'volume remains constant',
        ],
        answer: 'no heat is exchanged with the surroundings',
        solution:
          'An adiabatic process is one in which no heat enters or leaves the system (Q = 0).',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'For an isobaric process, which quantity remains constant?',
        options: ['pressure', 'volume', 'temperature', 'internal energy'],
        answer: 'pressure',
        solution:
          'Isobaric means the process occurs at constant pressure throughout.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
    ],
  },
];

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const questions = app.get<Repository<Question>>(
      getRepositoryToken(Question),
    );

    let questionCount = 0;
    for (const entry of catalog) {
      for (const [index, item] of entry.questions.entries()) {
        const questionId = `PHYSTHERMO-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
        const values = {
          question_id: questionId,
          subject: SUBJECT_NAME,
          chapter: CHAPTER_NAME,
          topic: entry.subtopic,
          subtopic: entry.subtopic,
          question_text: item.text,
          options: item.options,
          correct_answer: item.answer,
          solution: item.solution,
          bloom_level: item.bloom,
          difficulty: item.difficulty,
          marks: 4,
          estimated_time_sec:
            item.difficulty === 'Hard'
              ? 120
              : item.difficulty === 'Medium'
                ? 90
                : 60,
          concept_tags: [CHAPTER_NAME, entry.subtopic],
          common_errors: [
            'Review the governing law or formula before substituting values.',
          ],
          status: QuestionPublicationStatus.PUBLISHED,
          source: QuestionSource.CURATED,
          quality_score: 93,
          published_at: new Date(),
        };
        const existing = await questions.findOne({
          where: { question_id: questionId },
        });
        await questions.save(
          existing ? Object.assign(existing, values) : questions.create(values),
        );
        questionCount += 1;
      }
    }

    console.log(
      `Seeded ${questionCount} questions for ${SUBJECT_NAME} > ${CHAPTER_NAME}.`,
    );
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
