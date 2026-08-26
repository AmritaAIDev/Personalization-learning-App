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
import { Flashcard } from '../adaptive/flashcard.entity';
import { FlashcardSource, FlashcardStatus } from '../adaptive/adaptive.types';
import { AgentService } from '../agent/agent.service';
import type { BloomLevel, DifficultyLevel } from '../adaptive/adaptive.types';
import { slugifyChapter, slugifySubtopic } from './content/syllabus.types';

type Args = {
  subject?: string;
  chapter?: string;
  questionsPerTopic: number;
  flashcardsPerTopic: number;
  publish: boolean;
  topics?: string[];
};

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const get = (name: string): string | undefined => {
    const pref = `--${name}=`;
    const hit = raw.find((a) => a.startsWith(pref));
    if (hit) return hit.slice(pref.length);
    const idx = raw.indexOf(`--${name}`);
    if (idx !== -1) return raw[idx + 1];
    return undefined;
  };
  const has = (name: string) => raw.includes(`--${name}`);
  const subject = get('subject');
  const chapter = get('chapter');
  const topicsRaw = get('topics');
  return {
    subject,
    chapter,
    questionsPerTopic: Number(
      get('questions-per-topic') ?? get('questionsPerTopic') ?? '4',
    ),
    flashcardsPerTopic: Number(
      get('flashcards-per-topic') ?? get('flashcardsPerTopic') ?? '4',
    ),
    publish: !has('draft'),
    topics: topicsRaw
      ? topicsRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
  };
}

async function findOrCreateTopic(
  topics: Repository<Topic>,
  name: string,
  level: TopicLevel,
  parent: Topic | null,
): Promise<Topic> {
  const existing = await topics.findOne({
    where: { name, level, parent: parent ? { id: parent.id } : IsNull() },
    relations: { parent: true },
  });
  if (existing) return existing;
  return topics.save(
    topics.create({ name, level, parent: parent ?? undefined }),
  );
}

async function main() {
  const args = parseArgs();
  if (!args.subject || !args.chapter) {
    console.log(
      'Usage: npm run generate:content -- --subject="Physics" --chapter="Rotational Motion" [--topics="Centre of Mass,Moment of Inertia"] [--questions-per-topic=6] [--flashcards-per-topic=4] [--draft]\n' +
        '  --subject / --chapter are required. Omit --topics to cover every sub-topic of the chapter.\n' +
        '  By default questions/flashcards are PUBLISHED; pass --draft to keep them as DRAFT for review.',
    );
    process.exit(1);
  }

  const bloomLevels: BloomLevel[] = [
    'Recall',
    'Comprehension',
    'Application',
    'Higher-Order',
  ];
  const difficulties: DifficultyLevel[] = ['Easy', 'Medium', 'Hard'];

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const topicsRepo = app.get<Repository<Topic>>(getRepositoryToken(Topic));
    const questionsRepo = app.get<Repository<Question>>(
      getRepositoryToken(Question),
    );
    const flashcardsRepo = app.get<Repository<Flashcard>>(
      getRepositoryToken(Flashcard),
    );
    const agent = app.get(AgentService);

    // Ensure hierarchy exists
    const subjectNode = await findOrCreateTopic(
      topicsRepo,
      args.subject,
      TopicLevel.SUBJECT,
      null,
    );
    const chapterNode = await findOrCreateTopic(
      topicsRepo,
      args.chapter,
      TopicLevel.CHAPTER,
      subjectNode,
    );

    // Resolve sub-topics: from DB if --topics omitted, else from provided list
    let subtopicNames: string[];
    if (args.topics?.length) {
      subtopicNames = args.topics;
      for (const name of subtopicNames) {
        await findOrCreateTopic(
          topicsRepo,
          name,
          TopicLevel.SUB_TOPIC,
          chapterNode,
        );
      }
    } else {
      const existing = await topicsRepo.find({
        where: { level: TopicLevel.SUB_TOPIC, parent: { id: chapterNode.id } },
        order: { name: 'ASC' },
      });
      subtopicNames = existing.map((t) => t.name);
      if (subtopicNames.length === 0) {
        console.error(
          `No sub-topics found under ${args.subject} > ${args.chapter}. Create them first via seed:syllabus or pass --topics.`,
        );
        process.exit(1);
      }
    }

    console.log(
      `Generating for ${args.subject} > ${args.chapter} — ${subtopicNames.length} topic(s): ${subtopicNames.join(', ')}`,
    );
    console.log(
      `  Questions per topic: ${args.questionsPerTopic} | Flashcards per topic: ${args.flashcardsPerTopic} | Status: ${args.publish ? 'PUBLISHED' : 'DRAFT'}`,
    );

    let totalQuestions = 0;
    let totalCards = 0;

    for (const topicName of subtopicNames) {
      // Build a minimal grounding string — AgentService will supplement with Qdrant
      const grounding = `JEE ${args.subject} — ${args.chapter} — ${topicName}. NCERT-aligned standard content for this topic.`;

      // ---- Questions ----
      if (args.questionsPerTopic > 0) {
        // Distribute questions across bloom/difficulty combos to get variety
        const combos: Array<[BloomLevel, DifficultyLevel]> = [];
        for (const b of bloomLevels)
          for (const d of difficulties) combos.push([b, d]);
        // Take as many combos as needed, cycling if more questions than combos
        for (let i = 0; i < args.questionsPerTopic;) {
          const chunkSize = Math.min(4, args.questionsPerTopic - i);
          // Pick a representative bloom/difficulty for this chunk (round-robin)
          const [bloom, diff] = combos[i % combos.length];
          const count = chunkSize;
          console.log(
            `  [${topicName}] requesting ${count} question(s) — bloom=${bloom} diff=${diff} ...`,
          );
          let payloads: Awaited<
            ReturnType<AgentService['generateLearningQuestionBatch']>
          >;
          try {
            payloads = await agent.generateLearningQuestionBatch({
              subject: args.subject,
              chapter: args.chapter,
              topic: topicName,
              bloomLevel: bloom,
              difficulty: diff,
              count,
              sourceMaterial: grounding,
            });
          } catch (error) {
            console.error(
              `    Failed to generate questions for ${topicName}:`,
              (error as Error).message,
            );
            break;
          }

          for (const [idx, q] of payloads.entries()) {
            const questionId = `AI-${slugifyChapter(args.chapter)}-${slugifySubtopic(topicName)}-${Date.now()}-${i + idx + 1}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
            await questionsRepo.save(
              questionsRepo.create({
                question_id: questionId,
                subject: args.subject,
                chapter: args.chapter,
                topic: topicName,
                subtopic: topicName,
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
                solution: q.explanation,
                bloom_level: bloom,
                difficulty: diff,
                marks: 4,
                estimated_time_sec:
                  diff === 'Hard' ? 120 : diff === 'Medium' ? 90 : 60,
                concept_tags: q.concept_tags?.length
                  ? q.concept_tags
                  : [args.chapter, topicName],
                common_errors: q.common_errors?.length
                  ? q.common_errors
                  : ['Review the governing principle for this topic.'],
                status: args.publish
                  ? QuestionPublicationStatus.PUBLISHED
                  : QuestionPublicationStatus.DRAFT,
                source: QuestionSource.AI_GENERATED,
                quality_score: 85,
                published_at: args.publish ? new Date() : null,
              }),
            );
            totalQuestions += 1;
          }
          i += count;
          // Gentle pacing to respect rate limits
          if (i < args.questionsPerTopic)
            await new Promise((r) => setTimeout(r, 1200));
        }
      }

      // ---- Flashcards ----
      if (args.flashcardsPerTopic > 0) {
        console.log(
          `  [${topicName}] requesting ${args.flashcardsPerTopic} flashcard(s) ...`,
        );
        try {
          const cards = await agent.generateFlashcards({
            subject: args.subject,
            chapter: args.chapter,
            topic: topicName,
            count: Math.min(args.flashcardsPerTopic, 12),
            sourceMaterial: grounding,
          });
          for (const c of cards) {
            // Deduplicate by front text
            const existing = await flashcardsRepo.findOne({
              where: {
                subject: args.subject,
                chapter: args.chapter,
                topic: topicName,
                front: c.front,
              },
            });
            if (existing) continue;
            await flashcardsRepo.save(
              flashcardsRepo.create({
                subject: args.subject,
                chapter: args.chapter,
                topic: topicName,
                front: c.front,
                back: c.back,
                hint: c.hint ?? null,
                tags: c.tags?.length ? c.tags : [args.chapter, topicName],
                source: FlashcardSource.AI_GENERATED,
                status: FlashcardStatus.PUBLISHED,
              }),
            );
            totalCards += 1;
          }
        } catch (error) {
          console.error(
            `    Failed to generate flashcards for ${topicName}:`,
            (error as Error).message,
          );
        }
      }
    }

    console.log(
      `\nDone. Generated ${totalQuestions} question(s) and ${totalCards} flashcard(s) for ${args.subject} > ${args.chapter}.`,
    );
    if (!args.publish)
      console.log(
        'Questions are DRAFT — review in /content and publish when ready.',
      );
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
