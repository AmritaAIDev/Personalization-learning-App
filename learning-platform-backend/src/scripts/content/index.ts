import type { ChapterSeed } from './syllabus.types';
import { PHYSICS_CHAPTERS } from './physics';
import { CHEMISTRY_CHAPTERS } from './chemistry';
import { MATHS_CHAPTERS } from './maths';

export { PHYSICS_CHAPTERS } from './physics';
export { CHEMISTRY_CHAPTERS } from './chemistry';
export { MATHS_CHAPTERS } from './maths';
export { EXISTING_CHAPTERS } from './existing-chapters';

/** Every new chapter that carries authored questions/flashcards/concepts. */
export const NEW_CHAPTERS: ChapterSeed[] = [
  ...PHYSICS_CHAPTERS,
  ...CHEMISTRY_CHAPTERS,
  ...MATHS_CHAPTERS,
];
