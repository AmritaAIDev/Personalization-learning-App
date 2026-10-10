import type { NotebookMistakeCard } from "@/lib/notebook-types";
import type { BookmarkedQuestionView } from "@/lib/bookmarks-types";
import type { LearningResource } from "@/lib/diagnostic-types";
import type { CompetencyBand } from "@/lib/growth-types";

export interface RevisionTopicView {
  subject: string;
  chapter: string;
  topic: string;
  score: number;
  band: CompetencyBand;
  /** YYYY-MM-DD the study plan next schedules this topic. */
  plannedFor?: string;
}

export interface RevisionRecentTopicView extends RevisionTopicView {
  lastActivityAt: string;
}

export interface RevisionTopicRecommendation {
  topic: string;
  formula: string | null;
  resources: LearningResource[];
}

export interface RevisionTarget {
  targetMonth: string;
  daysLeft: number;
  phase: "foundation" | "consolidation" | "sprint" | "passed";
}

export interface RevisionHubPayload {
  /** Null when the student has no (or an already-passed) target month. */
  target: RevisionTarget | null;
  summary: {
    dueCount: number;
    resolvedCount: number;
    bookmarkCount: number;
    weakTopicCount: number;
    recentCount: number;
  };
  wrong: NotebookMistakeCard[];
  bookmarks: BookmarkedQuestionView[];
  weakTopics: RevisionTopicView[];
  recentlyPracticed: RevisionRecentTopicView[];
  recommendations: {
    generalResources: LearningResource[];
    topicRecommendations: RevisionTopicRecommendation[];
  };
}
