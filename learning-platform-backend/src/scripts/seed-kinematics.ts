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
 * Adds a Physics chapter not yet covered: "Kinematics" — the foundational
 * chapter that precedes Laws of Motion in the standard JEE sequence. Only
 * writes to the `questions` table (see seed-work-energy-power.ts for why:
 * the `topics` hierarchy entity is unused dead code).
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Physics';
const CHAPTER_NAME = 'Kinematics';

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
    subtopic: 'Motion in a Straight Line',
    questions: [
      {
        text: 'A car travels 60 km in 2 hours. Its average speed is:',
        options: ['30 km/h', '60 km/h', '120 km/h', '15 km/h'],
        answer: '30 km/h',
        solution:
          'Average speed = total distance / total time = 60 / 2 = 30 km/h.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'For an object moving with uniform acceleration, which equation correctly relates final velocity v, initial velocity u, acceleration a, and time t?',
        options: ['v = u + at', 'v = u - at', 'v = ut + at^2', 'v^2 = u + 2as'],
        answer: 'v = u + at',
        solution:
          'This is the first equation of motion for uniform acceleration.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'A body starts from rest and accelerates uniformly at 2 m/s^2. The distance covered in the first 5 seconds is:',
        options: ['25 m', '10 m', '50 m', '20 m'],
        answer: '25 m',
        solution: 's = ut + (1/2) a t^2 = 0 + 0.5 x 2 x 25 = 25 m.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Motion in a Plane and Projectile Motion',
    questions: [
      {
        text: 'A projectile is launched at an angle theta with initial speed u. Its time of flight, on level ground, is given by:',
        options: [
          '2 u sin(theta) / g',
          'u sin(theta) / g',
          'u^2 sin(2 theta) / g',
          'u cos(theta) / g',
        ],
        answer: '2 u sin(theta) / g',
        solution:
          'Time of flight T = 2 u sin(theta) / g, derived from vertical motion returning to the launch height.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The maximum range of a projectile launched with a fixed speed u is achieved at a launch angle of:',
        options: ['45 degrees', '30 degrees', '60 degrees', '90 degrees'],
        answer: '45 degrees',
        solution:
          'Range R = u^2 sin(2 theta) / g is maximized when sin(2 theta) = 1, i.e. theta = 45 degrees.',
        bloom: 'Understand',
        difficulty: 'Medium',
      },
      {
        text: 'A ball is thrown horizontally from a height with initial horizontal speed 10 m/s. If it takes 2 seconds to hit the ground, the horizontal distance traveled is:',
        options: ['20 m', '10 m', '40 m', '5 m'],
        answer: '20 m',
        solution:
          'Horizontal motion has no acceleration, so distance = speed x time = 10 x 2 = 20 m.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
    ],
  },
  {
    subtopic: 'Relative Velocity',
    questions: [
      {
        text: "A boat can travel at 5 m/s in still water. If a river flows at 3 m/s, the boat's maximum speed downstream, relative to the ground, is:",
        options: ['8 m/s', '2 m/s', '5 m/s', '15 m/s'],
        answer: '8 m/s',
        solution: 'Moving downstream, the velocities add: 5 + 3 = 8 m/s.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'The relative velocity of object A with respect to object B is defined as:',
        options: [
          'velocity of A minus velocity of B',
          'velocity of A plus velocity of B',
          'velocity of B minus velocity of A',
          'the average of the velocities of A and B',
        ],
        answer: 'velocity of A minus velocity of B',
        solution: 'By definition, v(A relative to B) = v_A - v_B.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'Two cars move in the same direction at 20 m/s and 15 m/s. The relative velocity of the faster car with respect to the slower one is:',
        options: ['5 m/s', '35 m/s', '20 m/s', '15 m/s'],
        answer: '5 m/s',
        solution:
          'Relative velocity = 20 - 15 = 5 m/s, in the direction of motion.',
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
        const questionId = `KINEMATICS-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
