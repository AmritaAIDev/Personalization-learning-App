import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Topic, TopicLevel } from '../topics/topic.entity';
import {
  Question,
  QuestionPublicationStatus,
  QuestionSource,
} from '../question.entity';

/**
 * Adds one fully-seeded JEE Physics chapter ("Laws of Motion") that isn't
 * covered by any existing seed script — the prior seeds only cover
 * Electrostatics (Physics), Sets/Coordinate Geometry/Calculus (Maths), and a
 * handful of Chemistry chapters. This seeds both halves that a chapter needs
 * to be usable end to end:
 *   1. The `topics` hierarchy (Subject -> Chapter -> Sub-topic), which no
 *      prior question-seed script populated, so topic search/pickers and the
 *      prerequisite graph can see it.
 *   2. Real, reviewed `questions` rows for each sub-topic.
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Physics';
const CHAPTER_NAME = 'Laws of Motion';

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
    subtopic: "Newton's Laws of Motion",
    questions: [
      {
        text: 'A body of mass 2 kg is acted upon by a net force of 10 N. Its acceleration is:',
        options: ['5 m/s^2', '20 m/s^2', '0.2 m/s^2', '12 m/s^2'],
        answer: '5 m/s^2',
        solution: 'By Newtons second law, a = F/m = 10 N / 2 kg = 5 m/s^2.',
        bloom: 'Apply',
        difficulty: 'Easy',
      },
      {
        text: "Newton's third law states that:",
        options: [
          'Every action has an equal and opposite reaction',
          'Force equals mass times acceleration',
          'An object at rest stays at rest unless acted upon',
          'Momentum is conserved only in elastic collisions',
        ],
        answer: 'Every action has an equal and opposite reaction',
        solution:
          "Newton's third law: for every action force one body exerts on another, the second body exerts an equal and opposite reaction force on the first.",
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'A 5 kg block resting on a frictionless horizontal surface is pushed with a constant force of 15 N for 4 seconds, starting from rest. The velocity gained is:',
        options: ['12 m/s', '3 m/s', '20 m/s', '0.75 m/s'],
        answer: '12 m/s',
        solution:
          'a = F/m = 15/5 = 3 m/s^2. Starting from rest, v = at = 3 x 4 = 12 m/s.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Friction',
    questions: [
      {
        text: 'The coefficient of static friction between a pair of surfaces is generally, compared to the coefficient of kinetic friction for the same pair:',
        options: [
          'greater than or equal to it',
          'less than it',
          'always exactly equal to it',
          'unrelated to it',
        ],
        answer: 'greater than or equal to it',
        solution:
          'Static friction must overcome the initial resistance to starting motion, so its maximum value is typically greater than or equal to kinetic friction.',
        bloom: 'Understand',
        difficulty: 'Medium',
      },
      {
        text: 'A block of mass 4 kg rests on a horizontal surface with coefficient of static friction 0.5. Taking g = 10 m/s^2, the maximum horizontal force that can be applied without moving the block is:',
        options: ['20 N', '40 N', '2 N', '0.5 N'],
        answer: '20 N',
        solution: 'Maximum static friction = mu_s x N = 0.5 x (4 x 10) = 20 N.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
      {
        text: 'Kinetic friction force on a sliding object acts:',
        options: [
          'opposite to the direction of relative sliding motion',
          'in the direction of motion',
          'perpendicular to the contact surface',
          'only when the object is at rest',
        ],
        answer: 'opposite to the direction of relative sliding motion',
        solution:
          'Kinetic friction always opposes the relative sliding motion between two surfaces in contact.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
    ],
  },
  {
    subtopic: 'Circular Motion Dynamics',
    questions: [
      {
        text: 'A car of mass 1000 kg moves in a circular path of radius 50 m at a constant speed of 10 m/s. The centripetal force required is:',
        options: ['2000 N', '200 N', '500 N', '100000 N'],
        answer: '2000 N',
        solution: 'F = m v^2 / r = 1000 x 10^2 / 50 = 100000 / 50 = 2000 N.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
      {
        text: 'In uniform circular motion, the centripetal force on the body is directed:',
        options: [
          'toward the center of the circle',
          'away from the center',
          'tangent to the circle',
          'along the axis of rotation',
        ],
        answer: 'toward the center of the circle',
        solution:
          'Centripetal force always points toward the center of the circular path; it is what continuously changes the direction of the velocity.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The maximum speed at which a vehicle can safely go around a flat, unbanked circular curve of radius r, with coefficient of friction mu between tyres and road, is:',
        options: ['sqrt(mu g r)', 'mu g r', 'sqrt(g r / mu)', 'mu / (g r)'],
        answer: 'sqrt(mu g r)',
        solution:
          'Friction alone supplies the centripetal force: mu m g = m v^2 / r, which rearranges to v = sqrt(mu g r).',
        bloom: 'Apply',
        difficulty: 'Hard',
      },
    ],
  },
];

async function findOrCreateTopic(
  topics: Repository<Topic>,
  name: string,
  level: TopicLevel,
  parent: Topic | null,
): Promise<Topic> {
  const existing = await topics.findOne({
    where: {
      name,
      level,
      parent: parent ? { id: parent.id } : IsNull(),
    },
    relations: { parent: true },
  });
  if (existing) return existing;
  return topics.save(
    topics.create({
      name,
      level,
      parent: parent ?? undefined,
    }),
  );
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const topics = app.get<Repository<Topic>>(getRepositoryToken(Topic));
    const questions = app.get<Repository<Question>>(
      getRepositoryToken(Question),
    );

    const subject = await findOrCreateTopic(
      topics,
      SUBJECT_NAME,
      TopicLevel.SUBJECT,
      null,
    );
    const chapter = await findOrCreateTopic(
      topics,
      CHAPTER_NAME,
      TopicLevel.CHAPTER,
      subject,
    );

    let questionCount = 0;
    for (const entry of catalog) {
      await findOrCreateTopic(
        topics,
        entry.subtopic,
        TopicLevel.SUB_TOPIC,
        chapter,
      );

      for (const [index, item] of entry.questions.entries()) {
        const questionId = `LAWSOFMOTION-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
      `Seeded topic hierarchy for ${SUBJECT_NAME} > ${CHAPTER_NAME} (${catalog.length} sub-topics) and ${questionCount} questions.`,
    );
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
