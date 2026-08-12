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
 * Adds a Mathematics chapter not yet covered: "Complex Numbers and
 * Quadratic Equations" — Maths is now the thinnest subject (existing
 * coverage: Sets/Relations/Functions, Coordinate Geometry, Differential
 * and Integral Calculus). Only writes to the `questions` table (see
 * seed-work-energy-power.ts for why: the `topics` hierarchy entity is
 * unused dead code).
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Mathematics';
const CHAPTER_NAME = 'Complex Numbers and Quadratic Equations';

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
    subtopic: 'Algebra of Complex Numbers',
    questions: [
      {
        text: 'If i = sqrt(-1), then i^4 equals:',
        options: ['1', '-1', 'i', '-i'],
        answer: '1',
        solution: 'i^2 = -1, so i^4 = (i^2)^2 = (-1)^2 = 1.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The value of (2 + 3i) + (4 - i) is:',
        options: ['6 + 2i', '6 + 4i', '2 + 2i', '-2 + 4i'],
        answer: '6 + 2i',
        solution:
          'Add the real parts and the imaginary parts separately: (2 + 4) + (3 - 1)i = 6 + 2i.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'The product (3 + 2i)(1 - i) equals:',
        options: ['5 - i', '3 - 2i', '1 + 5i', '5 + i'],
        answer: '5 - i',
        solution:
          '(3 + 2i)(1 - i) = 3 - 3i + 2i - 2i^2 = 3 - i + 2 = 5 - i, using i^2 = -1.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Quadratic Equations',
    questions: [
      {
        text: 'The roots of x^2 - 5x + 6 = 0 are:',
        options: ['2 and 3', '1 and 6', '-2 and -3', '2 and -3'],
        answer: '2 and 3',
        solution:
          'Factoring gives (x - 2)(x - 3) = 0, so x = 2 or x = 3; sum = 5 and product = 6 confirm this.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'For the quadratic equation a x^2 + b x + c = 0 (a not equal to 0), the discriminant b^2 - 4ac determines:',
        options: [
          'the nature of the roots',
          'the sum of the roots',
          'the product of the roots',
          'the value of a',
        ],
        answer: 'the nature of the roots',
        solution:
          'If the discriminant is positive the roots are real and distinct, if zero they are real and equal, and if negative they are complex conjugates.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'If the roots of x^2 - (k+1)x + k = 0 are equal, the value of k is:',
        options: ['1', '0', '-1', '2'],
        answer: '1',
        solution:
          'For equal roots the discriminant is zero: (k+1)^2 - 4k = 0, which simplifies to (k-1)^2 = 0, so k = 1.',
        bloom: 'Analyze',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Modulus and Argument',
    questions: [
      {
        text: 'The modulus of the complex number z = 3 + 4i is:',
        options: ['5', '7', '25', '1'],
        answer: '5',
        solution: '|z| = sqrt(3^2 + 4^2) = sqrt(9 + 16) = sqrt(25) = 5.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'The principal argument of the complex number z = 1 + i is:',
        options: ['pi/4', 'pi/2', 'pi/3', 'pi'],
        answer: 'pi/4',
        solution:
          'For z = 1 + i, both the real and imaginary parts are positive (first quadrant), and arg(z) = arctan(1/1) = pi/4.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
      {
        text: 'The modulus of the product of two complex numbers z1 and z2 equals:',
        options: [
          'the product of their moduli',
          'the sum of their moduli',
          'the modulus of their sum',
          'the difference of their moduli',
        ],
        answer: 'the product of their moduli',
        solution:
          'A standard property of complex numbers: |z1 z2| = |z1| times |z2|.',
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
        const questionId = `COMPLEXNUM-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
            'Review the governing rule or formula before substituting values.',
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
