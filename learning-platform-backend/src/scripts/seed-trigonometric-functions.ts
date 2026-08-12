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
 * Adds a Mathematics chapter not yet covered: "Trigonometric Functions" —
 * a standard JEE Class 11 chapter. Only writes to the `questions` table
 * (see seed-work-energy-power.ts for why: the `topics` hierarchy entity is
 * unused dead code).
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Mathematics';
const CHAPTER_NAME = 'Trigonometric Functions';

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
    subtopic: 'Trigonometric Ratios and Identities',
    questions: [
      {
        text: 'The value of sin^2(theta) + cos^2(theta) is always:',
        options: ['1', '0', '2', 'dependent on theta'],
        answer: '1',
        solution:
          'This is the fundamental Pythagorean trigonometric identity, true for every value of theta.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The value of sin(30 degrees) is:',
        options: ['1/2', '1', 'sqrt(3)/2', '0'],
        answer: '1/2',
        solution: 'sin(30 degrees) = 1/2, a standard trigonometric value.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'If tan(theta) = 3/4 and theta lies in the first quadrant, the value of sin(theta) is:',
        options: ['3/5', '4/5', '3/4', '4/3'],
        answer: '3/5',
        solution:
          'For a right triangle with opposite = 3, adjacent = 4, hypotenuse = 5 (a 3-4-5 triple), sin(theta) = opposite / hypotenuse = 3/5.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Trigonometric Equations',
    questions: [
      {
        text: 'The general solution of sin(theta) = 0 is:',
        options: [
          'theta = n pi, n an integer',
          'theta = n pi / 2',
          'theta = 2n pi',
          'theta = (2n+1) pi / 2',
        ],
        answer: 'theta = n pi, n an integer',
        solution: 'sin(theta) = 0 whenever theta is an integer multiple of pi.',
        bloom: 'Remember',
        difficulty: 'Medium',
      },
      {
        text: 'The general solution of cos(theta) = 0 is:',
        options: [
          'theta = (2n+1) pi / 2, n an integer',
          'theta = n pi',
          'theta = 2n pi',
          'theta = n pi / 2',
        ],
        answer: 'theta = (2n+1) pi / 2, n an integer',
        solution: 'cos(theta) = 0 at odd multiples of pi / 2.',
        bloom: 'Remember',
        difficulty: 'Medium',
      },
      {
        text: 'The number of solutions of sin(theta) = 1/2 in the interval [0, 2 pi) is:',
        options: ['2', '1', '3', '4'],
        answer: '2',
        solution:
          'sin(theta) = 1/2 at theta = pi/6 and theta = 5 pi/6 within [0, 2 pi).',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Graphs and Periodicity',
    questions: [
      {
        text: 'The period of the function sin(theta) is:',
        options: ['2 pi', 'pi', 'pi / 2', '4 pi'],
        answer: '2 pi',
        solution: 'sin(theta) repeats its values every 2 pi radians.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The period of the function tan(theta) is:',
        options: ['pi', '2 pi', 'pi / 2', '3 pi'],
        answer: 'pi',
        solution:
          'Unlike sine and cosine, the tangent function has a period of pi.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The range of the function cos(theta) is:',
        options: ['[-1, 1]', '[0, 1]', '(-infinity, infinity)', '[-2, 2]'],
        answer: '[-1, 1]',
        solution:
          'The cosine function takes every value between -1 and 1 inclusive.',
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
        const questionId = `TRIGFUNC-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
            'Review the governing identity or formula before applying it.',
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
