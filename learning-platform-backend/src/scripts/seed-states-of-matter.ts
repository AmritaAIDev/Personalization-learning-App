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
 * Adds a Chemistry chapter not yet covered: "States of Matter" — a
 * standard JEE Class 11 chapter covering gas laws and kinetic theory. Only
 * writes to the `questions` table (see seed-work-energy-power.ts for why:
 * the `topics` hierarchy entity is unused dead code).
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Chemistry';
const CHAPTER_NAME = 'States of Matter';

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
    subtopic: 'Gas Laws',
    questions: [
      {
        text: "Boyle's law states that at constant temperature, the pressure of a fixed amount of gas is:",
        options: [
          'inversely proportional to its volume',
          'directly proportional to its volume',
          'independent of its volume',
          'proportional to the square of its volume',
        ],
        answer: 'inversely proportional to its volume',
        solution:
          "Boyle's law: PV = constant at constant temperature, so pressure and volume are inversely proportional.",
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'A gas occupies 2 L at a pressure of 1 atm. If the pressure is increased to 4 atm at constant temperature, the new volume is:',
        options: ['0.5 L', '8 L', '2 L', '0.25 L'],
        answer: '0.5 L',
        solution:
          "By Boyle's law, P1 V1 = P2 V2: 1 x 2 = 4 x V2, so V2 = 0.5 L.",
        bloom: 'Apply',
        difficulty: 'Medium',
      },
      {
        text: "Charles's law states that at constant pressure, the volume of a fixed amount of gas is directly proportional to its:",
        options: ['absolute temperature', 'pressure', 'molar mass', 'density'],
        answer: 'absolute temperature',
        solution:
          "Charles's law: V/T = constant at constant pressure, i.e. volume is directly proportional to absolute temperature.",
        bloom: 'Remember',
        difficulty: 'Easy',
      },
    ],
  },
  {
    subtopic: 'Ideal Gas Equation',
    questions: [
      {
        text: 'The ideal gas equation is given by:',
        options: ['PV = nRT', 'PV = nR/T', 'PT = nRV', 'P = nRTV'],
        answer: 'PV = nRT',
        solution:
          "The ideal gas equation combines Boyle's, Charles's, and Avogadro's laws into PV = nRT.",
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'A 2 mole sample of an ideal gas occupies 44.8 L at STP. This confirms the molar volume of an ideal gas at STP is approximately:',
        options: ['22.4 L/mol', '44.8 L/mol', '11.2 L/mol', '1 L/mol'],
        answer: '22.4 L/mol',
        solution:
          '44.8 L divided by 2 mol gives 22.4 L/mol, the standard molar volume of an ideal gas at STP.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
      {
        text: 'In the ideal gas equation PV = nRT, R is called the:',
        options: [
          'universal gas constant',
          "Avogadro's number",
          'Boltzmann constant',
          'Faraday constant',
        ],
        answer: 'universal gas constant',
        solution:
          'R is the universal (molar) gas constant, with a value of approximately 8.314 J/(mol K).',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
    ],
  },
  {
    subtopic: 'Kinetic Theory of Gases',
    questions: [
      {
        text: 'According to the kinetic theory of gases, the average kinetic energy of gas molecules is directly proportional to:',
        options: [
          'the absolute temperature',
          'the pressure',
          'the volume',
          'the molar mass',
        ],
        answer: 'the absolute temperature',
        solution:
          'The average kinetic energy of gas molecules is directly proportional to the absolute temperature.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'As temperature increases, the root mean square speed of gas molecules:',
        options: ['increases', 'decreases', 'remains constant', 'becomes zero'],
        answer: 'increases',
        solution:
          'RMS speed is proportional to the square root of absolute temperature, so it increases as temperature rises.',
        bloom: 'Understand',
        difficulty: 'Easy',
      },
      {
        text: 'At the same temperature, a lighter gas molecule compared to a heavier one will have:',
        options: [
          'a higher root mean square speed',
          'a lower root mean square speed',
          'the same root mean square speed',
          'zero speed',
        ],
        answer: 'a higher root mean square speed',
        solution:
          'RMS speed is inversely proportional to the square root of molar mass, so lighter molecules move faster at the same temperature.',
        bloom: 'Analyze',
        difficulty: 'Medium',
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
        const questionId = `STATESOFMATTER-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
