export type QuestionReviewStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type QuestionSource = "CURATED" | "AI_GENERATED";

export type QuestionReportStatus = "OPEN" | "DISMISSED" | "RESOLVED";

/** A student's "report an issue" submission, awaiting reviewer action. */
export interface QuestionReport {
  id: string;
  reportedByUserId: string;
  questionSource: "CURATED" | "AI_POOL";
  questionId: string | null;
  generatedQuestionId: string | null;
  reason: "WRONG_ANSWER" | "CONFUSING_WORDING" | "TYPO_OR_FORMATTING" | "OTHER";
  details: string | null;
  status: QuestionReportStatus;
  createdAt: string;
  questionPreview: { text: string; chapter: string; topic: string } | null;
}

/** Full question content is returned only by the admin-only review API. */
export interface AdminQuestionRecord {
  id: string;
  question_id: string;
  subject: string;
  chapter: string;
  topic: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  solution: string;
  bloom_level: string;
  difficulty: string;
  marks: number;
  estimated_time_sec: number;
  concept_tags: string[];
  common_errors: string[];
  status: QuestionReviewStatus;
  source: QuestionSource;
  quality_score: number;
  review_notes: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
