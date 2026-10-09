import type {
  ChapterDifficulty,
  ChapterMetaSource,
  ChapterMetaStatus,
} from './chapter-meta.entity';

export type SubjectName = 'Physics' | 'Chemistry' | 'Mathematics';

/** One chapter of the jee-compass curriculum, as reviewed and stored in repo. */
export interface CompassChapter {
  subjectId: 'physics' | 'chemistry' | 'mathematics';
  chapterId: number;
  name: string;
  unit: string | null;
  topics: string[];
  overview: string;
  objectives: string[];
  keyFormulas: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  studyTimeMinutes: number;
}

/** Hand-authored metadata for a chapter jee-compass has no equivalent of. */
export interface AuthoredChapterMeta {
  subject: SubjectName;
  chapter: string;
  overview: string;
  objectives: string[];
  keyFormulas: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  studyMinutes: number;
}

export interface ChapterRef {
  subject: SubjectName;
  chapter: string;
}

/** The content half of a chapter_meta row, before persistence. */
export interface ChapterMetaDraft {
  overview: string | null;
  objectives: string[];
  keyFormulas: string[];
  difficulty: ChapterDifficulty | null;
  studyMinutes: number | null;
}

/** A fully resolved row that the seed script writes. */
export interface PlannedChapterMeta extends ChapterMetaDraft {
  subject: SubjectName;
  chapter: string;
  unit: string;
  source: ChapterMetaSource;
  status: ChapterMetaStatus;
  /** Compass chapter ids merged into this row, for the dry-run report. */
  compassSources: string[];
}

export interface ChapterMetaReport {
  planned: number;
  fromCompass: number;
  mergedTargets: Array<{ target: string; sources: string[] }>;
  authored: number;
  unitOnly: string[];
  skippedCompass: string[];
  /** Integrity problems: must be empty for the seed to run. */
  errors: string[];
}
