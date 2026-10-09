import type {
  ChapterDifficulty,
  ChapterMetaSource,
  ChapterMetaStatus,
} from './chapter-meta.entity';

export type TopicProgressStatus =
  'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'MASTERED';

export type ChapterProgressStatus =
  'NOT_STARTED' | 'IN_PROGRESS' | 'NEEDS_WORK' | 'MASTERED';

export interface CatalogSubjectSummary {
  slug: string;
  name: string;
  chapterCount: number;
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
  status: ChapterProgressStatus;
  score: number | null;
  masteredTopics: number;
  startedTopics: number;
}

export interface CatalogSubjectChapters {
  subject: { slug: string; name: string };
  units: Array<{ name: string; count: number }>;
  chapters: CatalogChapterSummary[];
}

export interface CatalogTopicDetail {
  name: string;
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
  source: ChapterMetaSource | null;
  status: ChapterMetaStatus | null;
  hasOverview: boolean;
  updatedAt: Date | null;
}
