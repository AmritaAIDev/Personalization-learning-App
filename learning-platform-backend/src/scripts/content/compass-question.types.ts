/** One multiple-choice question from the jee-compass Physics Chapter 1 bank. */
export interface CompassQuestion {
  id: string;
  topic: string;
  bloomLevel: 'Understand' | 'Apply' | 'Analyze' | 'Evaluate';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  /** Index into `options`. In the source it is always 0. */
  correctIndex: number;
  explanation: string;
}
