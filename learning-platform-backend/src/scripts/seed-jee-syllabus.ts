import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { Topic, TopicLevel } from '../topics/topic.entity';
import { Question } from '../question.entity';
import { Flashcard } from '../adaptive/flashcard.entity';
import type { ChapterSeed, SeedQuestion } from './content/syllabus.types';
import {
  SEED_FLASHCARD_SOURCE,
  SEED_FLASHCARD_STATUS,
  SEED_QUESTION_SOURCE,
  SEED_QUESTION_STATUS,
  slugifyChapter,
  slugifySubtopic,
} from './content/syllabus.types';
import { EXISTING_CHAPTERS, NEW_CHAPTERS } from './content';

console.log(
  '[seed-jee-syllabus] loaded',
  new Date().toISOString(),
  `NEW=${NEW_CHAPTERS.length} EXISTING=${EXISTING_CHAPTERS.length}`,
);

/**
 * One-shot ingestion of the full JEE syllabus into Postgres:
 *   1. `topics` hierarchy (Subject -> Chapter -> Sub-topic) for every chapter
 *      in the syllabus map — including chapters whose content already came
 *      from earlier dedicated seed scripts.
 *   2. Curated `questions` rows for every authored question.
 *   3. Curated `flashcards` rows for every authored card.
 *
 * Idempotent and non-destructive: every row is keyed by a deterministic
 * natural key (question_id / subject+chapter+topic+front / topic name+parent),
 * so re-running only fills gaps and refreshes definitions in place.
 */
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

async function upsertQuestion(
  questions: Repository<Question>,
  chapterSeed: ChapterSeed,
  subtopicName: string,
  index: number,
  item: SeedQuestion,
): Promise<'inserted' | 'updated'> {
  const questionId = `${slugifyChapter(chapterSeed.chapter)}-${slugifySubtopic(subtopicName)}-${index + 1}`;
  const estimatedSeconds =
    item.difficulty === 'Hard' ? 120 : item.difficulty === 'Medium' ? 90 : 60;
  const values = {
    question_id: questionId,
    subject: chapterSeed.subject,
    chapter: chapterSeed.chapter,
    topic: subtopicName,
    subtopic: subtopicName,
    question_text: item.text,
    options: item.options as unknown as string[],
    correct_answer: item.answer,
    solution: item.solution,
    bloom_level: item.bloom,
    difficulty: item.difficulty,
    marks: 4,
    estimated_time_sec: estimatedSeconds,
    concept_tags: [chapterSeed.chapter, subtopicName],
    common_errors: [
      'Re-check the governing formula and units before substituting values.',
    ],
    status: SEED_QUESTION_STATUS,
    source: SEED_QUESTION_SOURCE,
    quality_score: 90,
    published_at: new Date(),
  };
  const existing = await questions.findOne({
    where: { question_id: questionId },
  });
  if (existing) {
    await questions.save(Object.assign(existing, values));
    return 'updated';
  }
  await questions.save(questions.create(values));
  return 'inserted';
}

async function upsertFlashcard(
  flashcards: Repository<Flashcard>,
  chapterSeed: ChapterSeed,
  subtopicName: string,
  front: string,
  back: string,
  hint: string | undefined,
): Promise<'inserted' | 'existing'> {
  const existing = await flashcards.findOne({
    where: {
      subject: chapterSeed.subject,
      chapter: chapterSeed.chapter,
      topic: subtopicName,
      front,
    },
  });
  if (existing) return 'existing';
  await flashcards.save(
    flashcards.create({
      subject: chapterSeed.subject,
      chapter: chapterSeed.chapter,
      topic: subtopicName,
      front,
      back,
      hint: hint ?? null,
      tags: [chapterSeed.chapter, subtopicName],
      source: SEED_FLASHCARD_SOURCE,
      status: SEED_FLASHCARD_STATUS,
    }),
  );
  return 'inserted';
}

async function main() {
  console.log(
    '[seed] creating Nest application context...',
    new Date().toISOString(),
  );
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  console.log('[seed] app context created', new Date().toISOString());
  try {
    console.log('[seed] getting repositories...');
    const topics = app.get<Repository<Topic>>(getRepositoryToken(Topic));
    const questions = app.get<Repository<Question>>(
      getRepositoryToken(Question),
    );
    const flashcards = app.get<Repository<Flashcard>>(
      getRepositoryToken(Flashcard),
    );

    // Cache subject nodes so every chapter reuses the same parent.
    const subjects = new Map<string, Topic>();

    let chaptersCreated = 0;
    let subtopicsCreated = 0;
    let questionsInserted = 0;
    let questionsUpdated = 0;
    let cardsInserted = 0;

    const allChapters: Array<
      ChapterSeed | { subject: string; chapter: string; subtopics: [] }
    > = [...NEW_CHAPTERS, ...EXISTING_CHAPTERS];

    console.log(`[seed] starting loop over ${allChapters.length} chapters...`);
    for (const entry of allChapters) {
      console.log(
        `[seed] processing ${entry.subject} > ${entry.chapter} (${entry.subtopics.length} subtopics)`,
      );
      let subject = subjects.get(entry.subject);
      if (!subject) {
        subject = await findOrCreateTopic(
          topics,
          entry.subject,
          TopicLevel.SUBJECT,
          null,
        );
        subjects.set(entry.subject, subject);
      }

      const before = await topics.find({
        where: {
          name: entry.chapter,
          level: TopicLevel.CHAPTER,
          parent: { id: subject.id },
        },
      });
      const chapter = await findOrCreateTopic(
        topics,
        entry.chapter,
        TopicLevel.CHAPTER,
        subject,
      );
      if (before.length === 0) chaptersCreated += 1;

      for (const sub of entry.subtopics) {
        const existingSubtopics = await topics.find({
          where: {
            name: sub.name,
            level: TopicLevel.SUB_TOPIC,
            parent: { id: chapter.id },
          },
        });
        await findOrCreateTopic(
          topics,
          sub.name,
          TopicLevel.SUB_TOPIC,
          chapter,
        );
        if (existingSubtopics.length === 0) subtopicsCreated += 1;

        for (const [index, item] of (sub.questions ?? []).entries()) {
          const outcome = await upsertQuestion(
            questions,
            entry as ChapterSeed,
            sub.name,
            index,
            item,
          );
          if (outcome === 'inserted') questionsInserted += 1;
          else questionsUpdated += 1;
        }

        for (const card of sub.flashcards ?? []) {
          const outcome = await upsertFlashcard(
            flashcards,
            entry as ChapterSeed,
            sub.name,
            card.front,
            card.back,
            card.hint,
          );
          if (outcome === 'inserted') cardsInserted += 1;
        }
      }
    }

    // Coverage summary per subject for the run log.
    const subjectNames = [...subjects.keys()];
    for (const subjectName of subjectNames) {
      const counts = await questions
        .createQueryBuilder('q')
        .select('q.chapter', 'chapter')
        .addSelect('COUNT(*)', 'count')
        .where('q.subject = :subject AND q.status = :status', {
          subject: subjectName,
          status: SEED_QUESTION_STATUS,
        })
        .groupBy('q.chapter')
        .getRawMany<{ chapter: string; count: string }>();
      console.log(
        `[${subjectName}] published questions by chapter: ${counts
          .map((row) => `${row.chapter}=${row.count}`)
          .join(', ')}`,
      );
    }

    console.log(
      `Syllabus seed complete: +${chaptersCreated} chapters, +${subtopicsCreated} sub-topics, ` +
        `${questionsInserted} questions inserted (${questionsUpdated} refreshed), ${cardsInserted} flashcards added.`,
    );
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
