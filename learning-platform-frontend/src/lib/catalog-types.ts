/** Mirrors learning-platform-backend/src/catalog/catalog.types.ts (API payloads). */

export type TopicProgressStatus =
  | "NOT_STARTED"
  | "ACTIVE"
  | "PAUSED"
  | "MASTERED";

export type ChapterProgressStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "NEEDS_WORK"
  | "MASTERED";

export type ChapterDifficulty = "Easy" | "Medium" | "Hard";

export interface CatalogSubjectSummary {
  slug: string;
  name: string;
  chapterCount: number;
  chaptersStarted: number;
  chaptersMastered: number;
  topicCount: number;
  questionCount: number;
  averageScore: number | null;
}

export interface CatalogChapterSummary {
  slug: string;
  name: string;
  subject: string;
  subjectSlug: string;
  unit: string | null;
  topicCount: number;
  topicPreview: string[];
  questionCount: number;
  difficulty: ChapterDifficulty | null;
  studyMinutes: number | null;
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
  meta: CatalogChapterMeta | null;
  topics: CatalogTopicDetail[];
  bookmarkedCount: number;
}
