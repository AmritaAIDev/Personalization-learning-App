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
 * Adds a Chemistry chapter not yet covered: "Redox Reactions" — a standard
 * JEE Class 11 chapter. Only writes to the `questions` table (see
 * seed-work-energy-power.ts for why: the `topics` hierarchy entity is
 * unused dead code).
 *
 * Idempotent and non-destructive: safe to re-run, never truncates data.
 */

const SUBJECT_NAME = 'Chemistry';
const CHAPTER_NAME = 'Redox Reactions';

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
    subtopic: 'Oxidation Number',
    questions: [
      {
        text: 'The oxidation number of oxygen in most compounds, other than peroxides, is:',
        options: ['-2', '+2', '-1', '0'],
        answer: '-2',
        solution:
          'Oxygen typically has an oxidation state of -2 in compounds, except in peroxides (-1) and a few other exceptions.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'The oxidation number of manganese in KMnO4 is:',
        options: ['+7', '+2', '+4', '+6'],
        answer: '+7',
        solution:
          'K is +1 and O is -2 (4 x -2 = -8). For the neutral compound: (+1) + Mn + (-8) = 0, so Mn = +7.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
      {
        text: 'In the reaction Zn + Cu2+ -> Zn2+ + Cu, the oxidation number of zinc changes from:',
        options: ['0 to +2', '+2 to 0', '0 to -2', '+2 to +4'],
        answer: '0 to +2',
        solution:
          'Zinc metal, at oxidation state 0, loses two electrons to form Zn2+ (oxidation state +2) — it is oxidized.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Oxidation and Reduction',
    questions: [
      {
        text: 'Oxidation is defined as a process involving:',
        options: [
          'loss of electrons',
          'gain of electrons',
          'loss of protons',
          'gain of protons',
        ],
        answer: 'loss of electrons',
        solution:
          "Oxidation is the loss of electrons by a species, which increases the species's oxidation number.",
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'In a redox reaction, the substance that gains electrons is called the:',
        options: ['oxidizing agent', 'reducing agent', 'catalyst', 'solvent'],
        answer: 'oxidizing agent',
        solution:
          'The oxidizing agent is itself reduced (it gains electrons) while it oxidizes another species.',
        bloom: 'Remember',
        difficulty: 'Easy',
      },
      {
        text: 'In the reaction 2Na + Cl2 -> 2NaCl, which species acts as the reducing agent?',
        options: ['Na', 'Cl2', 'NaCl', 'none of these'],
        answer: 'Na',
        solution:
          'Sodium loses an electron (is oxidized) and thereby reduces chlorine, making Na the reducing agent.',
        bloom: 'Apply',
        difficulty: 'Medium',
      },
    ],
  },
  {
    subtopic: 'Balancing Redox Reactions',
    questions: [
      {
        text: 'When balancing redox reactions by the oxidation number method, the total increase in oxidation number (oxidation) must equal the total:',
        options: [
          'decrease in oxidation number (reduction)',
          'number of atoms',
          'number of molecules',
          'molar mass',
        ],
        answer: 'decrease in oxidation number (reduction)',
        solution:
          'Electrons lost during oxidation must equal electrons gained during reduction, so the total increase and decrease in oxidation numbers must balance.',
        bloom: 'Understand',
        difficulty: 'Medium',
      },
      {
        text: 'In acidic medium, redox equations are typically balanced by adding H+ ions and:',
        options: ['H2O molecules', 'OH- ions', 'O2 molecules', 'Na+ ions'],
        answer: 'H2O molecules',
        solution:
          'In acidic medium, oxygen atoms are balanced using water molecules and hydrogen atoms using H+ ions.',
        bloom: 'Remember',
        difficulty: 'Medium',
      },
      {
        text: 'A disproportionation reaction is one in which:',
        options: [
          'the same element is simultaneously oxidized and reduced',
          'two different elements are oxidized',
          'no change in oxidation state occurs',
          'only reduction takes place',
        ],
        answer: 'the same element is simultaneously oxidized and reduced',
        solution:
          'In disproportionation, a single species in one oxidation state converts into two different oxidation states of the same element.',
        bloom: 'Remember',
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
        const questionId = `REDOX-${entry.subtopic.replace(/[^A-Za-z]/g, '').toUpperCase()}-${index + 1}`;
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
            'Review the governing rule or definition before applying it.',
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
