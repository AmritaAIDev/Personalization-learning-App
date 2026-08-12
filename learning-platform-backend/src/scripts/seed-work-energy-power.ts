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
 * Adds another Physics chapter not yet covered: "Work, Energy and Power" —
 * the natural mechanics follow-on to "Laws of Motion". Only writes to the
 * `questions` table: the `topics` hierarchy entity is unused dead code (no
 * frontend route reads it — SessionsService and every search/picker surface
 * derive the catalog from `questions.subject/chapter/topic` directly), so
 * there's no separate taxonomy step worth doing here.
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Physics';
const CHAPTER_NAME = 'Work, Energy and Power';

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
    subtopic: 'Work and Energy',
    questions: [
      {
        text: 'A force of 20 N displaces an object by 5 m in the direction of the force. The work done is:',
        options: ['100 J', '4 J', '25 J', '15 J'],
        answer: '100 J',
        solution:
          'W = F x d = 20 x 5 = 100 J, since the force and displacement are in the same direction.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'The work-energy theorem states that the work done by the net force on an object equals:',
        options: [
          'the change in its kinetic energy',
          'the change in its potential energy',
          'its total mechanical energy',
          'the change in its momentum',
        ],
        answer: 'the change in its kinetic energy',
        solution:
          'By the work-energy theorem, W_net = change in KE: the net work done on an object equals its change in kinetic energy.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'A 2 kg object falls freely from rest through a height of 5 m. Taking g = 10 m/s^2, its kinetic energy just before hitting the ground is:',
        options: ['100 J', '50 J', '10 J', '200 J'],
        answer: '100 J',
        solution:
          'By conservation of energy, the kinetic energy gained equals the potential energy lost: m g h = 2 x 10 x 5 = 100 J.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Power',
    questions: [
      {
        text: 'Power is defined as the rate of:',
        options: [
          'doing work',
          'change of momentum',
          'change of velocity',
          'change of displacement',
        ],
        answer: 'doing work',
        solution:
          'Power = work done / time taken: the rate at which work is done or energy is transferred.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'A machine does 500 J of work in 10 seconds. Its power output is:',
        options: ['50 W', '5000 W', '500 W', '5 W'],
        answer: '50 W',
        solution: 'P = W / t = 500 / 10 = 50 W.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: 'A pump lifts 200 kg of water through a height of 6 m every second. Taking g = 10 m/s^2, the power delivered by the pump is:',
        options: ['12000 W', '1200 W', '2000 W', '200 W'],
        answer: '12000 W',
        solution: 'Power = m g h / t = (200 x 10 x 6) / 1 = 12000 W.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Conservation of Mechanical Energy',
    questions: [
      {
        text: 'For a body acted on only by conservative forces, the total mechanical energy:',
        options: [
          'remains constant',
          'always increases',
          'always decreases',
          'becomes zero',
        ],
        answer: 'remains constant',
        solution:
          'In the absence of non-conservative forces such as friction, the sum of kinetic and potential energy is conserved.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'A pendulum bob of mass 0.5 kg is released from a height of 0.2 m above its lowest point. Taking g = 10 m/s^2, its speed at the lowest point is:',
        options: ['2 m/s', '4 m/s', '1 m/s', '0.2 m/s'],
        answer: '2 m/s',
        solution:
          'm g h = (1/2) m v^2, so v = sqrt(2 g h) = sqrt(2 x 10 x 0.2) = sqrt(4) = 2 m/s.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
      {
        text: 'A spring with spring constant k = 200 N/m is compressed by 0.1 m from its natural length. The elastic potential energy stored is:',
        options: ['1 J', '2 J', '0.5 J', '20 J'],
        answer: '1 J',
        solution:
          'Elastic PE = (1/2) k x^2 = 0.5 x 200 x (0.1)^2 = 0.5 x 200 x 0.01 = 1 J.',
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
        const questionId = `WORKENERGYPOWER-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
