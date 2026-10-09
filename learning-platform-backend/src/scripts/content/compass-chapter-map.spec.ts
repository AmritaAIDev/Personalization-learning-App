/**
 * Integrity tests for the Phase 1 content data of the JEE Compass adoption
 * plan (docs/JEE-COMPASS-ADOPTION-PLAN.md §8): the extracted compass
 * chapters, the map onto our syllabus, the unit list, and the authored
 * drafts must all agree with each other and produce a clean plan.
 */
import { buildChapterMetaPlan } from '../../catalog/chapter-meta.plan';
import {
  ChapterDifficulty,
  ChapterMetaSource,
  ChapterMetaStatus,
} from '../../catalog/chapter-meta.entity';
import type { ChapterRef, SubjectName } from '../../catalog/chapter-meta.types';
import { EXISTING_CHAPTERS, NEW_CHAPTERS } from './index';
import { COMPASS_CHAPTERS } from './compass-chapters';
import {
  CHAPTER_UNITS,
  COMPASS_CHAPTER_MAP,
  compassKey,
  chapterKey,
} from './compass-chapter-map';
import { AUTHORED_CHAPTER_META } from './authored-chapter-meta';

const OUR_CHAPTERS: ChapterRef[] = [
  ...EXISTING_CHAPTERS.map((c) => ({
    subject: c.subject as SubjectName,
    chapter: c.chapter,
  })),
  ...NEW_CHAPTERS.map((c) => ({
    subject: c.subject as SubjectName,
    chapter: c.chapter,
  })),
];

const ourKeys = new Set(
  OUR_CHAPTERS.map((c) => chapterKey(c.subject, c.chapter)),
);
const unitKeys = new Set(Object.keys(CHAPTER_UNITS));

const plan = buildChapterMetaPlan({
  ourChapters: OUR_CHAPTERS,
  compass: COMPASS_CHAPTERS,
  compassMap: COMPASS_CHAPTER_MAP,
  units: CHAPTER_UNITS,
  authored: AUTHORED_CHAPTER_META,
});

describe('compass chapter data', () => {
  it('covers the expected 14 + 14 + 13 CBSE chapters', () => {
    expect(
      COMPASS_CHAPTERS.filter((c) => c.subjectId === 'physics'),
    ).toHaveLength(14);
    expect(
      COMPASS_CHAPTERS.filter((c) => c.subjectId === 'chemistry'),
    ).toHaveLength(14);
    expect(
      COMPASS_CHAPTERS.filter((c) => c.subjectId === 'mathematics'),
    ).toHaveLength(13);
  });

  it('has complete, sensible rows (no empty text, positive study time, valid enums)', () => {
    for (const c of COMPASS_CHAPTERS) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.overview.length).toBeGreaterThan(20);
      expect(c.objectives.length).toBeGreaterThanOrEqual(3);
      expect(c.keyFormulas.length).toBeGreaterThanOrEqual(0);
      // Descriptive chapters (e.g. p-Block, Amines) legitimately have no formulas
      // in the source data; the array must exist but may be empty.
      expect(Array.isArray(c.keyFormulas)).toBe(true);
      expect(c.studyTimeMinutes).toBeGreaterThan(0);
      expect(['Easy', 'Medium', 'Hard']).toContain(c.difficulty);
    }
  });

  it('survives the text extraction without mojibake', () => {
    const allText = COMPASS_CHAPTERS.map((c) =>
      [c.overview, ...c.objectives, ...c.keyFormulas].join(' '),
    ).join(' ');
    // Classic UTF-8-as-latin1 signature; extraction was verified in Phase 1.
    expect(allText).not.toMatch(/Ã.|â€./);
    expect(allText).toMatch(/ε₀|√|π|θ/);
  });
});

describe('compass -> syllabus map', () => {
  it('maps every compass chapter explicitly (target or null)', () => {
    for (const c of COMPASS_CHAPTERS) {
      expect(compassKey(c) in COMPASS_CHAPTER_MAP).toBe(true);
    }
  });

  it('only targets chapters that exist in our syllabus content files', () => {
    for (const target of Object.values(COMPASS_CHAPTER_MAP)) {
      if (!target) continue;
      expect(ourKeys.has(chapterKey(target.subject, target.chapter))).toBe(
        true,
      );
    }
  });

  it('defines exactly one unit per syllabus chapter and nothing extra', () => {
    expect(unitKeys).toEqual(ourKeys);
    for (const unit of Object.values(CHAPTER_UNITS)) {
      expect(unit.length).toBeLessThanOrEqual(60);
    }
  });
});

describe('authored drafts', () => {
  const compassTargets = new Set(
    Object.values(COMPASS_CHAPTER_MAP)
      .filter((t): t is ChapterRef => t !== null)
      .map((t) => chapterKey(t.subject, t.chapter)),
  );

  it('cover exactly the chapters compass has no data for', () => {
    const authoredKeys = new Set(
      AUTHORED_CHAPTER_META.map((a) => chapterKey(a.subject, a.chapter)),
    );
    expect([...compassTargets].some((k) => authoredKeys.has(k))).toBe(false);
    for (const key of ourKeys) {
      if (!compassTargets.has(key)) expect(authoredKeys.has(key)).toBe(true);
    }
    expect(authoredKeys.size).toBe(ourKeys.size - compassTargets.size);
  });

  it('are complete rows with valid values', () => {
    for (const a of AUTHORED_CHAPTER_META) {
      expect(ourKeys.has(chapterKey(a.subject, a.chapter))).toBe(true);
      expect(a.overview.length).toBeGreaterThan(40);
      expect(a.objectives.length).toBeGreaterThanOrEqual(3);
      expect(a.keyFormulas.length).toBeGreaterThanOrEqual(3);
      expect(a.studyMinutes).toBeGreaterThan(0);
      expect(Object.values(ChapterDifficulty)).toContain(a.difficulty);
    }
  });
});

describe('full plan over the real content data', () => {
  it('has no integrity errors', () => {
    expect(plan.report.errors).toEqual([]);
  });

  it('plans every syllabus chapter exactly once', () => {
    expect(plan.rows).toHaveLength(ourKeys.size);
    expect(plan.report.planned).toBe(55);
    expect(
      new Set(plan.rows.map((r) => chapterKey(r.subject, r.chapter))).size,
    ).toBe(55);
  });

  it('publishes the 28 compass-mapped chapters as drafts-free PUBLISHED rows', () => {
    expect(plan.report.fromCompass).toBe(28);
    for (const row of plan.rows.filter(
      (r) => r.source === ChapterMetaSource.COMPASS_IMPORT,
    )) {
      expect(row.status).toBe(ChapterMetaStatus.PUBLISHED);
      expect(row.overview).toBeTruthy();
    }
  });

  it('keeps the 27 authored drafts DRAFT and leaves nothing unit-only', () => {
    expect(plan.report.authored).toBe(27);
    expect(plan.report.unitOnly).toEqual([]);
    for (const row of plan.rows.filter(
      (r) => r.source === ChapterMetaSource.AI_DRAFT,
    )) {
      expect(row.status).toBe(ChapterMetaStatus.DRAFT);
    }
  });

  it('skips exactly the 5 CBSE-only compass chapters', () => {
    expect(plan.report.skippedCompass).toHaveLength(5);
    expect(plan.report.skippedCompass.join('\n')).toMatch(
      /Surface Chemistry|Polymers|Chemistry in Everyday Life|Linear Programming|Inverse/,
    );
  });
});
