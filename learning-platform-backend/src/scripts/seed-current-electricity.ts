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
 * Adds a Physics chapter not yet covered: "Current Electricity" — the
 * natural progression from the existing electrostatics chapters. Only
 * writes to the `questions` table (see seed-work-energy-power.ts for why:
 * the `topics` hierarchy entity is unused dead code).
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Physics';
const CHAPTER_NAME = 'Current Electricity';

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
    subtopic: "Ohm's Law and Resistance",
    questions: [
      {
        text: "According to Ohm's law, the current through a conductor is:",
        options: [
          'directly proportional to the voltage across it, at constant temperature',
          'inversely proportional to the voltage across it',
          'independent of the voltage across it',
          'proportional to the square of the voltage',
        ],
        answer:
          'directly proportional to the voltage across it, at constant temperature',
        solution:
          "Ohm's law: V = IR, so current I is directly proportional to voltage V when resistance (and temperature) is held constant.",
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'A conductor has a resistance of 5 ohms. If a voltage of 20 V is applied across it, the current flowing through it is:',
        options: ['4 A', '0.25 A', '100 A', '15 A'],
        answer: '4 A',
        solution: 'I = V / R = 20 / 5 = 4 A.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'The resistance of a wire depends on its length L and cross-sectional area A according to:',
        options: [
          'R is proportional to L / A',
          'R is proportional to A / L',
          'R is proportional to L x A',
          'R is independent of L and A',
        ],
        answer: 'R is proportional to L / A',
        solution:
          'R = rho L / A, where rho is resistivity: resistance increases with length and decreases with cross-sectional area.',
        bloom: 'Remember',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Series and Parallel Circuits',
    questions: [
      {
        text: 'For resistors connected in series, the equivalent resistance is:',
        options: [
          'the sum of the individual resistances',
          'the reciprocal of the sum of the reciprocals',
          'always less than the smallest resistance',
          'the average of the resistances',
        ],
        answer: 'the sum of the individual resistances',
        solution:
          'In series, R_eq = R1 + R2 + ..., since the same current flows through every resistor.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'Two resistors of 6 ohms and 3 ohms are connected in parallel. The equivalent resistance is:',
        options: ['2 ohms', '9 ohms', '4.5 ohms', '18 ohms'],
        answer: '2 ohms',
        solution:
          '1/R_eq = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2, so R_eq = 2 ohms.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
      {
        text: 'In a series circuit, the current through each resistor is:',
        options: [
          'the same',
          'different, depending on resistance',
          'zero',
          'infinite',
        ],
        answer: 'the same',
        solution:
          'A series circuit has only one path for current, so the same current flows through every component.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
    ],
  },
  {
    subtopic: 'Electrical Power and Energy',
    questions: [
      {
        text: 'The electrical power dissipated in a resistor is given by:',
        options: ['I^2 R', 'I R^2', 'I / R', 'I R'],
        answer: 'I^2 R',
        solution:
          "Power P = I^2 R (equivalently VI or V^2/R), obtained by combining Ohm's law with P = VI.",
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'A 100 W bulb operates for 5 hours. The electrical energy consumed, in kWh, is:',
        options: ['0.5 kWh', '5 kWh', '500 kWh', '0.05 kWh'],
        answer: '0.5 kWh',
        solution: 'Energy = power x time = 0.1 kW x 5 h = 0.5 kWh.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'A resistor carries a current of 2 A when 10 V is applied across it. The power dissipated is:',
        options: ['20 W', '5 W', '0.2 W', '100 W'],
        answer: '20 W',
        solution: 'P = V I = 10 x 2 = 20 W.',
        bloom: 'Apply',
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
        const questionId = `CURRENTELEC-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
