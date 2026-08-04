export type CompetencyBand =
  "Beginner" | "Developing" | "Proficient" | "Advanced";

export interface CompetencyBreakdown {
  accuracy: number;
  difficulty: number;
  bloom: number;
  speed: number;
  consistency: number;
}

export interface TopicCompetency {
  subject: string;
  chapter: string;
  topic: string;
  level: number;
  bloomLevel: string;
  difficulty: string;
  masteryPercent: number;
  accuracyPercent: number;
  answered: number;
  score: number;
  band: CompetencyBand;
  status: string;
}

export interface GrowthPoint {
  date: string;
  masteryPercent: number;
  level: number;
  bloomLevel: string;
  difficulty: string;
  transition: string;
  topic: string;
  label: string;
}

export interface GrowthPayload {
  overall: {
    score: number;
    band: CompetencyBand;
    breakdown: CompetencyBreakdown;
    topicsTracked: number;
    mastered: number;
    answered: number;
    momentum: number;
    positiveStreak: number;
  };
  topics: TopicCompetency[];
  timeline: GrowthPoint[];
}
