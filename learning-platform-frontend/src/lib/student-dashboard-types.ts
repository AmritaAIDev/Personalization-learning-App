import type { DashboardPayload } from './diagnostic-types';
import type { GrowthPayload } from './growth-types';
import type { LearningDashboardPayload, LearningScope } from './learning-types';

export type StudentDashboardActionKind =
  | 'RESUME_DIAGNOSTIC'
  | 'CONTINUE_LEARNING'
  | 'REVIEW_MISTAKES'
  | 'FIND_TOPIC';

export type StudentDashboardAction = {
  id: string;
  kind: StudentDashboardActionKind;
  title: string;
  detail: string;
  scope?: LearningScope;
  attemptId?: string;
};

export type StudentDashboardPayload = {
  student: {
    name: string;
    level: number;
    xp: number;
    streak: number;
  };
  diagnostics: DashboardPayload;
  learning: LearningDashboardPayload;
  growth: GrowthPayload;
  revision: {
    dueCount: number;
    upcomingCount: number;
    topics: Array<LearningScope & { count: number }>;
  };
  courseProgress: {
    trackedTopics: number;
    masteredTopics: number;
    percent: number;
  };
  today: {
    primary: StudentDashboardAction;
    actions: StudentDashboardAction[];
  };
  activity: Array<{
    id: string;
    type: 'LEARNING' | 'DIAGNOSTIC';
    title: string;
    detail: string;
    occurredAt: string;
    subject?: string;
    chapter?: string;
    topic?: string;
  }>;
  subjectCoverage: Array<{
    subject: string;
    totalTopics: number;
    masteredTopics: number;
    activeTopics: number;
    pausedTopics: number;
    notStartedTopics: number;
    topics: Array<LearningScope & {
      status: 'MASTERED' | 'ACTIVE' | 'PAUSED' | 'NOT_STARTED';
      score: number | null;
    }>;
  }>;
};
