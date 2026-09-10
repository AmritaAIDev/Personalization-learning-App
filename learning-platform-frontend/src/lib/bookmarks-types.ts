export interface BookmarkedQuestionView {
  questionId: string;
  subject: string;
  chapter: string;
  topic: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  solution: string;
  difficulty: string;
  bloomLevel: string;
  conceptTags: string[];
  bookmarkedAt: string;
}
