import { apiFetch } from "@/lib/api";

export type TargetedPracticeReason = "MISCONCEPTION" | "SIMILAR";

export type TargetedQuestion = {
  id: string;
  reason: TargetedPracticeReason;
  subject: string;
  chapter: string;
  topic: string;
  questionText: string;
  options: string[];
  hint: string;
  conceptTags: string[];
  bloomLevel: string;
  difficulty: string;
};

export type TargetedAnswerResult = {
  isCorrect: boolean;
  correctAnswer: string;
  solution: string;
};

export function generateTargetedQuestion(input: {
  subject: string;
  chapter: string;
  topic: string;
  reason: TargetedPracticeReason;
  focusText: string;
  sourceQuestionId?: string;
  bloomLevel?: string;
  difficulty?: string;
}): Promise<TargetedQuestion> {
  return apiFetch<TargetedQuestion>("/api/targeted-practice/questions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function submitTargetedAnswer(
  id: string,
  selectedOption: string,
): Promise<TargetedAnswerResult> {
  return apiFetch<TargetedAnswerResult>(
    `/api/targeted-practice/questions/${id}/answer`,
    {
      method: "POST",
      body: JSON.stringify({ selectedOption }),
    },
  );
}
