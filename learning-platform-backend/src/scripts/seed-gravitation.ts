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
 * Adds another Physics chapter not yet covered: "Gravitation" — the next
 * standard JEE Class 11 mechanics chapter after Laws of Motion and Work,
 * Energy and Power. Only writes to the `questions` table (see
 * seed-work-energy-power.ts for why: the `topics` hierarchy entity is
 * unused dead code).
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Physics';
const CHAPTER_NAME = 'Gravitation';

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
    subtopic: "Newton's Law of Gravitation",
    questions: [
      {
        text: "According to Newton's law of gravitation, the gravitational force between two point masses is:",
        options: [
          'directly proportional to the product of the masses and inversely proportional to the square of the distance between them',
          'directly proportional to the sum of the masses and the distance between them',
          'inversely proportional to the product of the masses',
          'independent of the distance between them',
        ],
        answer:
          'directly proportional to the product of the masses and inversely proportional to the square of the distance between them',
        solution:
          "F = G m1 m2 / r^2 — this is Newton's law of universal gravitation.",
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'Two point masses of 4 kg and 9 kg are separated by a distance of 3 m. Taking G = 6.67 x 10^-11 N m^2/kg^2, the gravitational force between them is approximately:',
        options: [
          '2.67 x 10^-10 N',
          '6.67 x 10^-11 N',
          '1.2 x 10^-9 N',
          '4 x 10^-10 N',
        ],
        answer: '2.67 x 10^-10 N',
        solution:
          'F = G m1 m2 / r^2 = 6.67e-11 x (4 x 9) / 9 = 6.67e-11 x 4 = 2.67 x 10^-10 N.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
      {
        text: 'If the distance between two masses is doubled, the gravitational force between them becomes:',
        options: ['one-fourth', 'half', 'double', 'four times'],
        answer: 'one-fourth',
        solution:
          'Since F is inversely proportional to r^2, doubling r reduces F to one-fourth of its original value.',
        bloom: 'Understand',
        difficulty: 'Easy',
      },
    ],
  },
  {
    subtopic: 'Gravitational Potential Energy and Escape Velocity',
    questions: [
      {
        text: 'The gravitational potential energy of a mass m at a distance r from the center of a planet of mass M is given by:',
        options: ['-GMm/r', 'GMm/r', '-GMm/r^2', 'GMm/r^2'],
        answer: '-GMm/r',
        solution:
          'Gravitational PE = -GMm/r, taken as zero at infinite separation; the negative sign reflects the bound, attractive nature of the system.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The escape velocity from the surface of a planet depends on:',
        options: [
          'the mass and radius of the planet only',
          'the mass of the escaping object only',
          'the mass of the escaping object and the planet',
          'only the radius of the planet',
        ],
        answer: 'the mass and radius of the planet only',
        solution:
          "v_escape = sqrt(2GM/R), which depends only on the planet's mass M and radius R, not on the mass of the escaping object.",
        bloom: 'Understand',
        difficulty: 'Medium',
      },
      {
        text: "If the escape velocity from Earth's surface is about 11.2 km/s, the escape velocity from a planet with twice Earth's mass and the same radius would be approximately:",
        options: ['15.8 km/s', '11.2 km/s', '22.4 km/s', '5.6 km/s'],
        answer: '15.8 km/s',
        solution:
          'v_escape = sqrt(2GM/R), so v is proportional to sqrt(M). Doubling M multiplies v by sqrt(2) ~ 1.414, giving about 11.2 x 1.414 ~ 15.8 km/s.',
        bloom: 'Analyze',
        difficulty: 'Hard',
      },
    ],
  },
  {
    subtopic: "Kepler's Laws and Satellite Motion",
    questions: [
      {
        text: "Kepler's second law (the law of areas) implies that a planet moves:",
        options: [
          'faster when closer to the Sun and slower when farther away',
          'at constant speed throughout its orbit',
          'faster when farther from the Sun',
          'in a perfect circle at all times',
        ],
        answer: 'faster when closer to the Sun and slower when farther away',
        solution:
          'Since a planet sweeps out equal areas in equal times, it must move faster near perihelion (closest approach) and slower near aphelion.',
        bloom: 'Understand',
        difficulty: 'Medium',
      },
      {
        text: "According to Kepler's third law, the square of the orbital period T of a planet is proportional to:",
        options: [
          'the cube of the semi-major axis of its orbit',
          'the square of the semi-major axis',
          'the semi-major axis itself',
          'the mass of the planet',
        ],
        answer: 'the cube of the semi-major axis of its orbit',
        solution:
          "Kepler's third law: T^2 is proportional to a^3, where a is the orbit's semi-major axis.",
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'A satellite orbits Earth in a circular orbit of radius r with orbital speed v. The time period of the satellite is given by:',
        options: ['2 pi r / v', 'pi r / v', '2 pi v / r', 'r / (2 pi v)'],
        answer: '2 pi r / v',
        solution:
          'Time period = circumference / speed = 2 pi r / v, since the satellite covers the full circular path once per period.',
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
        const questionId = `GRAVITATION-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
