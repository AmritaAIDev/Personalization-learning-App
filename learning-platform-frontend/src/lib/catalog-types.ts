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
  /** Chapters whose score has reached the "completed" band (40%+). */
  chaptersCompleted: number;
  mastery: MasteryLevel | null;
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
  mastery: MasteryLevel | null;
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

/** JEE Compass mastery level: Beginner..Master with a 1-5 star rating. */
export interface MasteryLevel {
  label: string;
  stars: number;
  next: { label: string; pointsNeeded: number } | null;
}

export type SkillBand = "Strong" | "Average" | "Weak";

export interface AccuracyStat {
  answered: number;
  correct: number;
  accuracy: number | null;
}

export interface BloomStat extends AccuracyStat {
  level: string;
  band: SkillBand | null;
  mastery: MasteryLevel | null;
}

export interface SkillStat {
  key: "accuracy" | "recall" | "application";
  label: string;
  accuracy: number | null;
  detail: string;
  tip: string | null;
}

export interface AnalyticsInsights {
  strongestBloom: { level: string; accuracy: number } | null;
  weakestBloom: { level: string; accuracy: number } | null;
  focus: string | null;
  tip: string | null;
}

export interface TopicStat extends AccuracyStat {
  chapter: string;
  chapterSlug: string;
  topic: string;
}

export interface TrendPoint extends AccuracyStat {
  weekStart: string;
}

interface AnalyticsCore {
  overall: AccuracyStat;
  mastery: MasteryLevel | null;
  skills: SkillStat[];
  insights: AnalyticsInsights;
  recall: AccuracyStat;
  application: AccuracyStat;
  bloom: BloomStat[];
  hasData: boolean;
}

export type ChapterAnalytics = AnalyticsCore;

export interface SubjectAnalytics extends AnalyticsCore {
  subject: { slug: string; name: string };
  chaptersCompleted: number;
  units: Array<AccuracyStat & { name: string; chapters: number }>;
  chapters: Array<
    AccuracyStat & { slug: string; name: string; unit: string | null }
  >;
  strongTopics: TopicStat[];
  weakTopics: TopicStat[];
  trend: TrendPoint[];
}
