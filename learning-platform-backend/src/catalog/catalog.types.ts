import type {
  ChapterDifficulty,
  ChapterMetaSource,
  ChapterMetaStatus,
} from './chapter-meta.entity';

export type TopicProgressStatus =
  'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'MASTERED';

export type ChapterProgressStatus =
  'NOT_STARTED' | 'IN_PROGRESS' | 'NEEDS_WORK' | 'MASTERED';

/** JEE Compass mastery level: Beginner..Master with a 1-5 star rating. */
export interface MasteryLevel {
  label: string;
  stars: number;
  /** The next band and how many points away it is; null at the top. */
  next: { label: string; pointsNeeded: number } | null;
}

export interface CatalogSubjectSummary {
  slug: string;
  name: string;
  chapterCount: number;
  /** Chapters whose score has reached the "completed" band (40%+). */
  chaptersCompleted: number;
  mastery: MasteryLevel | null;
  chaptersStarted: number;
  chaptersMastered: number;
  topicCount: number;
  questionCount: number;
  /** Mean of the chapters' scores; null until the student has answered anything. */
  averageScore: number | null;
}

export interface CatalogChapterSummary {
  slug: string;
  name: string;
  subject: string;
  subjectSlug: string;
  unit: string | null;
  topicCount: number;
  /** First few sub-topic names, for the card's chips. */
  topicPreview: string[];
  questionCount: number;
  difficulty: ChapterDifficulty | null;
  studyMinutes: number | null;
  /** False when no PUBLISHED study-guide metadata exists yet. */
  hasMeta: boolean;
  /** Topics with at least one published question (the percent's denominator). */
  teachableTopics: number;
  completedTopics: number;
  learningStatus: LearningStatus;
  status: ChapterProgressStatus;
  score: number | null;
  mastery: MasteryLevel | null;
  masteredTopics: number;
  startedTopics: number;
}

export interface CatalogSubjectChapters {
  subject: { slug: string; name: string };
  units: Array<{ name: string; count: number }>;
  chapters: CatalogChapterSummary[];
}

/** Completed / In Progress / Pending: see catalog.progress.ts `topicLearningStatus`. */
export type LearningStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';

/** Counts over teachable topics (topics with at least one published question). */
export interface SyllabusCounts {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  /** completed / total, rounded; 0 when there is nothing teachable yet. */
  percent: number;
}

export interface SyllabusSubjectProgress extends SyllabusCounts {
  slug: string;
  name: string;
  chapters: number;
  /** Chapters with no teachable topic yet; excluded from the percent. */
  comingSoonChapters: number;
}

export interface SyllabusProgress {
  overall: SyllabusCounts;
  subjects: SyllabusSubjectProgress[];
}

export interface CatalogTopicDetail {
  name: string;
  learningStatus: LearningStatus;
  /**
   * The chapter name this topic's questions are tagged with. Usually the
   * chapter's own name; for aliased chapters it is the content-side name, and
   * is what /learn links must use.
   */
  scopeChapter: string;
  status: TopicProgressStatus;
  score: number | null;
  answered: number;
  questionCount: number;
}

export interface CatalogChapterMeta {
  overview: string | null;
  objectives: string[];
  keyFormulas: string[];
  difficulty: ChapterDifficulty | null;
  studyMinutes: number | null;
  jeeWeightageNote: string | null;
}

export interface CatalogChapterDetail {
  chapter: CatalogChapterSummary;
  /** Null until an admin has published the chapter's study guide. */
  meta: CatalogChapterMeta | null;
  topics: CatalogTopicDetail[];
  bookmarkedCount: number;
}

export interface AdminChapterMetaRow {
  topicId: string;
  subject: string;
  chapter: string;
  unit: string | null;
  /** 11 or 12; null until set. */
  classLevel: number | null;
  source: ChapterMetaSource | null;
  status: ChapterMetaStatus | null;
  hasOverview: boolean;
  updatedAt: Date | null;
}
