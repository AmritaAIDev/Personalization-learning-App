import type { MasteryLevel } from './catalog.types';

export interface AccuracyStat {
  answered: number;
  correct: number;
  /** Rounded percentage, or null when nothing was answered (never a fake 0%). */
  accuracy: number | null;
}

/** Compass bands: 70%+ Strong, 40-69% Average, below 40% Weak. */
export type SkillBand = 'Strong' | 'Average' | 'Weak';

export interface BloomStat extends AccuracyStat {
  level: string;
  band: SkillBand | null;
  mastery: MasteryLevel | null;
}

/** One of Compass's skill cards (Accuracy, Formula Recall, Problem Solving). */
export interface SkillStat {
  key: 'accuracy' | 'recall' | 'application';
  label: string;
  accuracy: number | null;
  detail: string;
  /** Short advice; null while there is no data to advise on. */
  tip: string | null;
}

export interface AnalyticsInsights {
  strongestBloom: { level: string; accuracy: number } | null;
  /** Null when fewer than two levels have data, so it never repeats the strongest. */
  weakestBloom: { level: string; accuracy: number } | null;
  focus: string | null;
  tip: string | null;
}

export interface TopicStat extends AccuracyStat {
  chapter: string;
  chapterSlug: string;
  topic: string;
}

export interface TrendPoint extends AccuracyStat {
  /** ISO date (YYYY-MM-DD) of the Monday that starts the week. */
  weekStart: string;
}

export interface AnalyticsCore {
  overall: AccuracyStat;
  mastery: MasteryLevel | null;
  skills: SkillStat[];
  insights: AnalyticsInsights;
  /** Remember + Understand answers: the "formula / definition" accuracy. */
  recall: AccuracyStat;
  /** Apply, Analyze, Evaluate (and unclassified) answers: the "numerical" accuracy. */
  application: AccuracyStat;
  bloom: BloomStat[];
  hasData: boolean;
}

export type ChapterAnalytics = AnalyticsCore;

export interface SubjectAnalytics extends AnalyticsCore {
  subject: { slug: string; name: string };
  /** Chapters whose score has reached the "completed" band (40%+). */
  chaptersCompleted: number;
  units: Array<AccuracyStat & { name: string; chapters: number }>;
  chapters: Array<
    AccuracyStat & { slug: string; name: string; unit: string | null }
  >;
  strongTopics: TopicStat[];
  weakTopics: TopicStat[];
  trend: TrendPoint[];
}
