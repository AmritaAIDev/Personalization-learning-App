export type QuestionReviewStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type QuestionSource = "CURATED" | "AI_GENERATED";

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
