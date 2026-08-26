import type { ExistingChapterRef } from './syllabus.types';

/**
 * Chapters whose question/flashcard content already lives in earlier
 * dedicated seed scripts. We still ensure their `topics` chapter nodes
 * exist so the full syllabus tree is complete and pickers can see them.
 * No curated rows are authored here — those scripts own the content.
 */
export const EXISTING_CHAPTERS: ExistingChapterRef[] = [
  // Physics — dedicated seeds + Electrostatics diagnostics
  { subject: 'Physics', chapter: 'Electrostatics', subtopics: [] },
  { subject: 'Physics', chapter: 'Kinematics', subtopics: [] },
  { subject: 'Physics', chapter: 'Laws of Motion', subtopics: [] },
  { subject: 'Physics', chapter: 'Work, Energy and Power', subtopics: [] },
  { subject: 'Physics', chapter: 'Gravitation', subtopics: [] },
  { subject: 'Physics', chapter: 'Thermodynamics', subtopics: [] },
  { subject: 'Physics', chapter: 'Current Electricity', subtopics: [] },
  // Chemistry — dedicated + earlier syllabus parts
  {
    subject: 'Chemistry',
    chapter: 'Some Basic Concepts of Chemistry',
    subtopics: [],
  },
  { subject: 'Chemistry', chapter: 'Structure of Atom', subtopics: [] },
  {
    subject: 'Chemistry',
    chapter: 'Chemical Bonding and Molecular Structure',
    subtopics: [],
  },
  {
    subject: 'Chemistry',
    chapter: 'Classification of Elements',
    subtopics: [],
  },
  { subject: 'Chemistry', chapter: 'Equilibrium', subtopics: [] },
  { subject: 'Chemistry', chapter: 'Redox Reactions', subtopics: [] },
  { subject: 'Chemistry', chapter: 'States of Matter', subtopics: [] },
  // Mathematics — dedicated + earlier syllabus parts
  {
    subject: 'Mathematics',
    chapter: 'Sets, Relations and Functions',
    subtopics: [],
  },
  {
    subject: 'Mathematics',
    chapter: 'Complex Numbers and Quadratic Equations',
    subtopics: [],
  },
  { subject: 'Mathematics', chapter: 'Coordinate Geometry', subtopics: [] },
  { subject: 'Mathematics', chapter: 'Differential Calculus', subtopics: [] },
  { subject: 'Mathematics', chapter: 'Integral Calculus', subtopics: [] },
  {
    subject: 'Mathematics',
    chapter: 'Permutations and Combinations',
    subtopics: [],
  },
  { subject: 'Mathematics', chapter: 'Binomial Theorem', subtopics: [] },
  { subject: 'Mathematics', chapter: 'Sequences and Series', subtopics: [] },
  { subject: 'Mathematics', chapter: 'Trigonometric Functions', subtopics: [] },
];
