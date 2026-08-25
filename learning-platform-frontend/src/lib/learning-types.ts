export type LearningScope = {
  subject: string;
  chapter: string;
  topic: string;
};

export type LearningTab = "overview" | "flashcards" | "practice";

export type LearningCoordinate = {
  level: number;
  bloomLevel: "Recall" | "Comprehension" | "Application" | "Higher-Order";
  difficulty: "Easy" | "Medium" | "Hard";
  label: string;
};

export type LearningTopicStatus =
  "ACTIVE" | "MASTERED" | "PAUSED_FOR_PREREQUISITE";

export type LearningSessionStatus = "ACTIVE" | "COMPLETED" | "ROUTED";

export type LearningSessionTransition =
  "NONE" | "ADVANCED" | "REINFORCE" | "DEMOTED" | "PREREQUISITE" | "MASTERED";

export type LearningState = LearningScope & {
  id: string;
  currentLevel: number;
  currentCoordinate: LearningCoordinate;
  status: LearningTopicStatus;
  totalAnswered: number;
  totalCorrect: number;
  masteryPercent: number;
  lastActivityAt: string;
  masteredAt: string | null;
  stageLabel: string;
  nextFocus: string;
};

export type LearningPlacement = {
  level: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  reason:
    | "RESUME_TOPIC"
    | "CHAPTER_EVIDENCE"
    | "SUBJECT_EVIDENCE"
    | "PREREQUISITE_EVIDENCE"
    | "BASELINE";
  stageLabel: string;
  summary: string;
  nextFocus: string;
};

export type TutorMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  messageType: "GENERAL" | "SOCRATIC_HINT" | "ANSWER_EXPLANATION";
  content: string;
  relatedSessionItemId: string | null;
  createdAt: string;
};

export type LearningSessionPayload = {
  state: LearningState;
  placement: LearningPlacement;
  session: {
    id: string;
    status: LearningSessionStatus;
    transition: LearningSessionTransition;
    level: number;
    coordinate: LearningCoordinate;
    totalQuestions: number;
    currentSequence: number;
    startedAt: string;
    completedAt: string | null;
  };
  currentItem: {
    id: string;
    sequence: number;
    questionText: string;
    options: string[];
    bloomLevel: string;
    difficulty: string;
    attemptCount: number;
    requiresRetry: boolean;
    /** Options already used on this item, so a retry can rule them out. */
    attemptedOptions: string[];
    /** The underlying question's own identity — distinct from `id` above. */
    questionSource: "CURATED" | "AI_POOL";
    questionRefId: string;
  } | null;
  progress: Array<{
    id: string;
    sequence: number;
    status: "CURRENT" | "PENDING" | "RESOLVED";
    attemptCount: number;
    review: {
      questionText: string;
      options: string[];
      correctAnswer: string;
      solution: string;
      selectedOption: string;
      isCorrect: boolean;
    } | null;
  }>;
};

export type LearningAnswerPayload = LearningSessionPayload & {
  feedback: {
    kind:
      | "CORRECT"
      | "SOCRATIC_HINT"
      | "DEMOTED"
      | "ROUTED"
      | "ADVANCED"
      | "MASTERED"
      | "REINFORCE";
    assistantMessage: TutorMessage | null;
    tutorPending: boolean;
    route: LearningScope | null;
  };
};

export type FlashcardRating = "AGAIN" | "HARD" | "GOOD" | "EASY";

export type FlashcardReviewState = {
  lastRating: FlashcardRating;
  repetitions: number;
  intervalDays: number;
  dueAt: string;
  lastReviewedAt: string;
};

export type Flashcard = LearningScope & {
  id: string;
  front: string;
  back: string;
  hint: string | null;
  tags: string[];
  review: FlashcardReviewState | null;
};

export type LearningDashboardPayload = {
  activeTopics: LearningState[];
  completedTopics: LearningState[];
  history: Array<{
    id: string;
    subject: string;
    chapter: string;
    topic: string;
    level: number;
    coordinate: LearningCoordinate;
    transition: LearningSessionTransition;
    completedAt: string | null;
  }>;
  suggestions: Array<
    LearningScope & {
      questionCount: number;
      reason: string;
    }
  >;
};
