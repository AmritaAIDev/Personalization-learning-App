import type { NotebookMistakeCard } from '../notebook/notebook.types';
import type { BookmarkedQuestionView } from '../bookmarks/bookmarks.service';
import type { LearningResourceType } from '../diagnostics/diagnostic.types';
import type { CompetencyBand } from '../adaptive/competency.service';

export interface RevisionResourceView {
  id: string;
  type: LearningResourceType;
  title: string;
  description: string | null;
  url: string | null;
  content: string | null;
}

export interface RevisionTopicView {
  subject: string;
  chapter: string;
  topic: string;
  score: number;
  band: CompetencyBand;
  /** `YYYY-MM-DD` the study plan next schedules this topic (within two weeks). */
  plannedFor?: string;
}

export interface RevisionRecentTopicView extends RevisionTopicView {
  lastActivityAt: string;
}

export interface RevisionTopicRecommendation {
  topic: string;
  formula: string | null;
  resources: RevisionResourceView[];
}

export interface RevisionRecommendations {
  generalResources: RevisionResourceView[];
  topicRecommendations: RevisionTopicRecommendation[];
}

/**
 * A single, cross-session view of everything worth revising — see
 * revision.service.ts for how each field is sourced. Nothing here is
 * computed fresh from scratch: every field reuses an existing service
 * (Notebook, Bookmarks, CompetencyService) or the same query shape
 * diagnostics.service.ts already uses for resource matching.
 */
export interface RevisionTargetContext {
  targetMonth: string;
  daysLeft: number;
  phase: 'foundation' | 'consolidation' | 'sprint';
}

export interface RevisionHubPayload {
  /** Null when the student has no (or an already-passed) target month. */
  target: RevisionTargetContext | null;
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
  recommendations: RevisionRecommendations;
}
