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
 * Adds a Mathematics chapter not yet covered: "Sequences and Series" — a
 * standard JEE Class 11 chapter. Only writes to the `questions` table (see
 * seed-work-energy-power.ts for why: the `topics` hierarchy entity is
 * unused dead code).
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Mathematics';
const CHAPTER_NAME = 'Sequences and Series';

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
    subtopic: 'Arithmetic Progressions',
    questions: [
      {
        text: 'In an arithmetic progression (AP), the difference between any two consecutive terms is:',
        options: [
          'constant',
          'always increasing',
          'always decreasing',
          'always zero',
        ],
        answer: 'constant',
        solution:
          'An AP is defined by a constant common difference between consecutive terms.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The nth term of an AP with first term a and common difference d is given by:',
        options: ['a + (n-1)d', 'a + nd', 'an + d', 'a x d^(n-1)'],
        answer: 'a + (n-1)d',
        solution: 'The formula for the nth term of an AP is a_n = a + (n-1)d.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The first term of an AP is 3 and the common difference is 4. The 10th term is:',
        options: ['39', '43', '35', '40'],
        answer: '39',
        solution: 'a_10 = a + 9d = 3 + 9 x 4 = 3 + 36 = 39.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
    ],
  },
  {
    subtopic: 'Geometric Progressions',
    questions: [
      {
        text: 'In a geometric progression (GP), each term after the first is obtained by:',
        options: [
          'multiplying the previous term by a constant ratio',
          'adding a constant to the previous term',
          'subtracting a constant from the previous term',
          'squaring the previous term',
        ],
        answer: 'multiplying the previous term by a constant ratio',
        solution: 'A GP has a constant common ratio between consecutive terms.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The nth term of a GP with first term a and common ratio r is given by:',
        options: ['a r^(n-1)', 'a + (n-1)r', 'a^n r', 'a r^n'],
        answer: 'a r^(n-1)',
        solution: 'The formula for the nth term of a GP is a_n = a r^(n-1).',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The first term of a GP is 2 and the common ratio is 3. The 4th term is:',
        options: ['54', '24', '18', '36'],
        answer: '54',
        solution: 'a_4 = a r^3 = 2 x 27 = 54.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
    ],
  },
  {
    subtopic: 'Sum of Series',
    questions: [
      {
        text: 'The sum of the first n terms of an AP with first term a and common difference d is given by:',
        options: ['(n/2)[2a+(n-1)d]', 'n[a+(n-1)d]', '(n/2)[a+d]', 'na + d'],
        answer: '(n/2)[2a+(n-1)d]',
        solution:
          'S_n = (n/2)[2a + (n-1)d] is the standard formula for the sum of the first n terms of an AP.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The sum of the first 10 natural numbers is:',
        options: ['55', '50', '45', '100'],
        answer: '55',
        solution: 'Sum = n(n+1)/2 = 10 x 11 / 2 = 55.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'The sum to infinity of a GP with first term a and common ratio r, where |r| < 1, is given by:',
        options: ['a / (1-r)', 'a / (1+r)', 'a(1-r)', 'a r / (1-r)'],
        answer: 'a / (1-r)',
        solution:
          'For an infinite GP with |r| < 1, the sum converges to a / (1-r).',
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
        const questionId = `SEQSERIES-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
            'Review the governing formula before substituting values.',
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
