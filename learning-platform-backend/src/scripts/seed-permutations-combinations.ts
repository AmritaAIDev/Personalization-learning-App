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
 * Adds a Mathematics chapter not yet covered: "Permutations and
 * Combinations" — a standard, self-contained JEE Class 11 chapter. Only
 * writes to the `questions` table (see seed-work-energy-power.ts for why:
 * the `topics` hierarchy entity is unused dead code).
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Mathematics';
const CHAPTER_NAME = 'Permutations and Combinations';

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
    subtopic: 'Fundamental Principle of Counting',
    questions: [
      {
        text: 'If a task can be done in 3 ways and a second, independent task can be done in 4 ways, the two tasks together can be done in:',
        options: ['12 ways', '7 ways', '3 ways', '4 ways'],
        answer: '12 ways',
        solution:
          'By the fundamental principle of counting (multiplication principle), the two independent tasks together can be done in 3 x 4 = 12 ways.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'A restaurant offers 5 starters, 4 main courses, and 3 desserts. The number of different three-course meals (one from each course) is:',
        options: ['60', '12', '15', '20'],
        answer: '60',
        solution:
          'By the multiplication principle, the total number of meals is 5 x 4 x 3 = 60.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'How many 3-digit numbers can be formed using the digits 1 to 5, with no digit repeated?',
        options: ['60', '125', '15', '20'],
        answer: '60',
        solution:
          'The first digit has 5 choices, the second has 4 remaining choices, and the third has 3 remaining choices: 5 x 4 x 3 = 60.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Permutations',
    questions: [
      {
        text: 'The number of ways to arrange 5 distinct books on a shelf is:',
        options: ['120', '20', '25', '60'],
        answer: '120',
        solution:
          'The number of arrangements of 5 distinct objects is 5! = 120.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'The formula for the number of permutations of n distinct objects taken r at a time is:',
        options: ['n! / (n - r)!', 'n! / (r! (n - r)!)', 'n! / r!', 'n!'],
        answer: 'n! / (n - r)!',
        solution:
          'nPr = n! / (n - r)! counts the number of ordered selections of r objects from n distinct objects.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The number of distinct arrangements of the letters of the word "LEVEL" is:',
        options: ['30', '120', '60', '20'],
        answer: '30',
        solution:
          'LEVEL has 5 letters with L repeated twice and E repeated twice, so the number of distinct arrangements is 5! / (2! 2!) = 120 / 4 = 30.',
        bloom: 'Analyze',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Combinations',
    questions: [
      {
        text: 'The number of ways to choose 3 objects from a set of 5 distinct objects, where order does not matter, is:',
        options: ['10', '60', '15', '20'],
        answer: '10',
        solution:
          'nCr = n! / (r! (n - r)!) = 5! / (3! 2!) = 120 / (6 x 2) = 10.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'The relationship between permutations and combinations is given by:',
        options: [
          'nPr = nCr x r!',
          'nPr = nCr / r!',
          'nCr = nPr x r!',
          'nCr = nPr + r!',
        ],
        answer: 'nPr = nCr x r!',
        solution:
          'Choosing r objects (nCr) and then arranging them (r!) accounts for every ordered selection, so nPr = nCr x r!.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'A committee of 3 people is to be chosen from 4 men and 3 women. The number of ways to form the committee with exactly 2 men and 1 woman is:',
        options: ['18', '35', '21', '12'],
        answer: '18',
        solution:
          'Choose 2 men from 4: 4C2 = 6. Choose 1 woman from 3: 3C1 = 3. Total ways = 6 x 3 = 18.',
        bloom: 'Apply',
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
        const questionId = `PERMCOMB-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
