import type { LearningScope } from '../adaptive/adaptive-content.service';

export type DashboardActionKind =
  'RESUME_DIAGNOSTIC' | 'CONTINUE_LEARNING' | 'REVIEW_MISTAKES' | 'FIND_TOPIC';

export interface DashboardAction {
  id: string;
  kind: DashboardActionKind;
  title: string;
  detail: string;
  scope?: LearningScope;
  attemptId?: string;
}

export interface DashboardRevisionTopic extends LearningScope {
  count: number;
}

export interface DashboardActivity extends Partial<LearningScope> {
  id: string;
  type: 'LEARNING' | 'DIAGNOSTIC';
  title: string;
  detail: string;
  occurredAt: string;
}

export type DashboardTopicProgressStatus =
  | 'MASTERED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'NOT_STARTED';

export interface DashboardSubjectCoverage {
  subject: string;
  totalTopics: number;
  masteredTopics: number;
  activeTopics: number;
  pausedTopics: number;
  notStartedTopics: number;
  topics: Array<LearningScope & {
    status: DashboardTopicProgressStatus;
    score: number | null;
  }>;
}
