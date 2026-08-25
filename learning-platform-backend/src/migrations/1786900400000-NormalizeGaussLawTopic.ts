import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The Gauss's Law question bank was split across three topic strings
 * ('Gauss Law', "Electric Field and Gauss's Law", "Gauss's Law") under the
 * same chapter. Session/practice selection matches `topic` by exact string,
 * so a learner practicing the syllabus's actual topic — "Gauss's Law", the
 * one name that exists in the `topics` table and drives the Journey/topic
 * picker — could only draw from 2 curated questions instead of the full
 * ~234-question bank, which starved the session into a chapter-wide
 * calibration fallback that kept resetting the learner to Level 1. A prior
 * one-off script (src/scripts/align-gauss-chapter.ts) merged the opposite
 * direction (into 'Gauss Law'), which doesn't match the syllabus topic name
 * and reintroduced this split. This migration merges all three onto the
 * syllabus-canonical "Gauss's Law".
 */
export class NormalizeGaussLawTopic1786900400000 implements MigrationInterface {
  name = 'NormalizeGaussLawTopic1786900400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE questions
      SET topic = 'Gauss''s Law'
      WHERE subject = 'Physics'
        AND chapter = 'Electric Charges and Fields'
        AND topic IN ('Gauss Law', 'Electric Field and Gauss''s Law')
    `);
    await queryRunner.query(`
      UPDATE flashcards
      SET topic = 'Gauss''s Law'
      WHERE subject = 'Physics'
        AND chapter = 'Electric Charges and Fields'
        AND topic IN ('Gauss Law', 'Electric Field and Gauss''s Law')
    `);
  }

  /**
   * Not reversible: the source rows were already merged from three buckets
   * into one before this migration ran, so there is no recorded mapping back
   * to which of the two non-canonical names each row originally had.
   */
  public async down(): Promise<void> {
    throw new Error(
      'NormalizeGaussLawTopic1786900400000 cannot be reverted automatically: ' +
        'the original per-row topic split was not preserved.',
    );
  }
}
