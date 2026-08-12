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
 * Adds a Mathematics chapter not yet covered: "Binomial Theorem" — a
 * standard JEE Class 11 chapter. Only writes to the `questions` table (see
 * seed-work-energy-power.ts for why: the `topics` hierarchy entity is
 * unused dead code).
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Mathematics';
const CHAPTER_NAME = 'Binomial Theorem';

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
    subtopic: 'Binomial Expansion',
    questions: [
      {
        text: 'The binomial theorem gives the expansion of (a+b)^n as a sum of terms of the form:',
        options: [
          'nCr a^(n-r) b^r',
          'n! a^r b^(n-r)',
          'nCr a^r b^r',
          'n a^(n-r) b^r',
        ],
        answer: 'nCr a^(n-r) b^r',
        solution:
          '(a+b)^n = sum from r=0 to n of nCr a^(n-r) b^r, the standard binomial expansion.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The number of terms in the expansion of (x+y)^7 is:',
        options: ['8', '7', '6', '14'],
        answer: '8',
        solution:
          'The expansion of (x+y)^n has (n+1) terms, so for n=7 there are 8 terms.',
        bloom: 'Understand',
        difficulty: 'Easy',
      },
      {
        text: 'The coefficient of x^2 in the expansion of (1+x)^5 is:',
        options: ['10', '5', '1', '20'],
        answer: '10',
        solution:
          'The general term is 5Cr x^r; for r=2, the coefficient is 5C2 = 10.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'General Term',
    questions: [
      {
        text: 'In the expansion of (a+b)^n, the general term T(r+1) is given by:',
        options: [
          'nCr a^(n-r) b^r',
          'nCr a^r b^(n-r)',
          'nPr a^(n-r) b^r',
          'r! a^(n-r) b^r',
        ],
        answer: 'nCr a^(n-r) b^r',
        solution:
          'The (r+1)-th term of the expansion is T(r+1) = nCr a^(n-r) b^r.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The middle term in the expansion of (x+y)^6 is the:',
        options: ['4th term', '3rd term', '6th term', '7th term'],
        answer: '4th term',
        solution:
          'For even n = 6, there are n+1 = 7 terms, and the middle term is the ((n/2)+1)-th, i.e. the 4th term.',
        bloom: 'Understand',
        difficulty: 'Medium',
      },
      {
        text: 'In the expansion of (2x - 3)^4, the term independent of x occurs at the value of r equal to:',
        options: ['4', '0', '2', '1'],
        answer: '4',
        solution:
          'The general term is T(r+1) = 4Cr (2x)^(4-r) (-3)^r; the power of x is (4-r), which is zero when r = 4.',
        bloom: 'Analyze',
        difficulty: 'Hard',
      },
    ],
  },
  {
    subtopic: 'Properties of Binomial Coefficients',
    questions: [
      {
        text: 'The sum of all binomial coefficients in the expansion of (1+x)^n is:',
        options: ['2^n', 'n^2', 'n!', '2n'],
        answer: '2^n',
        solution:
          'Setting x=1 in (1+x)^n = sum of nCr x^r gives the sum of all nCr equal to 2^n.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The binomial coefficients nCr and nC(n-r) are related by:',
        options: [
          'nCr = nC(n-r)',
          'nCr = -nC(n-r)',
          'nCr = n x nC(n-r)',
          'nCr and nC(n-r) are unrelated',
        ],
        answer: 'nCr = nC(n-r)',
        solution:
          'This is the symmetry property of binomial coefficients: nCr = nC(n-r).',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The value of nC0 + nC1 + ... + nCn is always:',
        options: ['2^n', 'n', 'n^2', '0'],
        answer: '2^n',
        solution:
          'This sum equals 2^n, obtained by substituting x=1 into the binomial expansion of (1+x)^n.',
        bloom: 'Understand',
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
        const questionId = `BINOMIAL-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
