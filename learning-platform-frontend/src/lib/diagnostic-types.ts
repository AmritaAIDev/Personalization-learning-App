export type UserRole = 'student' | 'admin';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  xp: number;
  level: number;
  streak: number;
}

export type DiagnosticStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';

export interface DiagnosticQuestion {
  id: string;
  questionId: string;
  chapter: string;
  topic: string;
  questionText: string;
  options: string[];
  difficulty: string;
  bloomLevel: string;
  marks: number;
  position: number;
}

export interface DiagnosticAttemptMeta {
  id: string;
  title: string;
  subject: string;
  chapters: string[];
  status: DiagnosticStatus;
  totalQuestions: number;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
}

export interface DiagnosticAttemptPayload {
  attempt: DiagnosticAttemptMeta;
  questions: DiagnosticQuestion[];
  answers: Array<{ questionId: string; selectedOption: string }>;
}

export interface PerformanceRow {
  label: string;
  correct: number;
  total: number;
  score: number;
  status: 'strong' | 'average' | 'weak';
}

export interface DiagnosticAnalysis {
  total: number;
  correct: number;
  incorrect: number;
  scorePercent: number;
  grade: 'Excellent' | 'Good' | 'Average' | 'Needs work';
  topicPerformance: PerformanceRow[];
  bloomPerformance: PerformanceRow[];
  weakTopics: string[];
  calculatedAt: string;
}

export interface AnalysisPayload {
  attempt: {
    id: string;
    status: DiagnosticStatus;
    submittedAt: string | null;
  };
  analysis: DiagnosticAnalysis;
}

export interface HistoryItem {
  id: string;
  title: string;
  status: DiagnosticStatus;
  completedAt: string | null;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  weakTopics: string[];
}

export interface DashboardPayload {
  stats: {
    testsTaken: number;
    bestScore: number | null;
    averageScore: number | null;
    subject: string;
  };
  diagnostic: {
    title: string;
    chapters: string[];
    questionCount: number;
    durationMinutes: number;
    ready: boolean;
  };
  activeAttempt: {
    id: string;
    expiresAt: string;
    answeredCount: number;
  } | null;
  recentAttempts: HistoryItem[];
}

export type LearningResourceType = 'VIDEO' | 'NOTES' | 'PRACTICE' | 'FORMULA';

export interface LearningResource {
  id: string;
  type: LearningResourceType;
  title: string;
  description: string | null;
  url: string | null;
  content: string | null;
}

export interface RecommendationsPayload {
  attemptId: string;
  hasWeakTopics: boolean;
  weakTopics: string[];
  topicRecommendations: Array<{
    topic: string;
    formula: string | null;
    resources: LearningResource[];
  }>;
  generalResources: LearningResource[];
}
