import { COMPLETED_AT, masteryLevel } from './catalog.progress';
import { slugify } from './catalog.slug';
import type {
  AccuracyStat,
  AnalyticsInsights,
  BloomStat,
  ChapterAnalytics,
  SkillBand,
  SkillStat,
  SubjectAnalytics,
  TopicStat,
  TrendPoint,
} from './catalog.analytics.types';

/** One graded answer, from any of the four answer tables. */
export interface AnswerEvent {
  subject: string;
  /** Tree chapter name (after aliasing). */
  chapter: string;
  /** Chapter name the question is actually tagged with, when it was aliased. */
  sourceChapter?: string;
  topic: string;
  bloom: string | null;
  isCorrect: boolean;
  answeredAt: Date;
}

export interface OutlineChapter {
  slug: string;
  name: string;
  unit: string | null;
}

/** The four Bloom levels JEE Compass reports on, in its order. */
export const BLOOM_LEVELS = [
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
] as const;

/** Compass score bands (shared with chapter status): 70+ strong, 40+ average. */
export const STRONG_BAND_AT = 70;
export const AVERAGE_BAND_AT = 40;
/** Compass skill-card tips switch at this accuracy. */
const SKILL_TIP_BELOW = 60;

export function skillBand(accuracy: number | null): SkillBand | null {
  if (accuracy === null) return null;
  if (accuracy >= STRONG_BAND_AT) return 'Strong';
  if (accuracy >= AVERAGE_BAND_AT) return 'Average';
  return 'Weak';
}

/** Levels counted as "recall" (formula / definition accuracy). */
const RECALL_LEVELS = new Set<string>(['Remember', 'Understand']);

/** Compass has no minimum: a topic with any answers can be called strong/weak. Raise to require more evidence. */
export const MIN_TOPIC_ANSWERS = 1;
export const STRONG_AT_OR_ABOVE = 70;
export const WEAK_BELOW = 50;
const LIST_LIMIT = 5;
export const TREND_WEEKS = 8;

function stat(answered: number, correct: number): AccuracyStat {
  return {
    answered,
    correct,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : null,
  };
}

export function tally(events: readonly AnswerEvent[]): AccuracyStat {
  return stat(events.length, events.filter((event) => event.isCorrect).length);
}

/** Case-insensitive match onto the canonical level name, else null. */
export function normalizeBloom(value: string | null): string | null {
  if (!value) return null;
  const wanted = value.trim().toLowerCase();
  return BLOOM_LEVELS.find((level) => level.toLowerCase() === wanted) ?? null;
}

/**
 * Recall = Remember + Understand. Everything else (Apply, Analyze,
 * Evaluate, or any unrecognised level) counts as application, so the two
 * always add up to the overall total.
 */
function isRecall(event: AnswerEvent): boolean {
  const level = normalizeBloom(event.bloom);
  return level !== null && RECALL_LEVELS.has(level);
}

function bloomBreakdown(events: readonly AnswerEvent[]): BloomStat[] {
  return BLOOM_LEVELS.map((level) => {
    const result = tally(
      events.filter((event) => normalizeBloom(event.bloom) === level),
    );
    return {
      level,
      ...result,
      band: skillBand(result.accuracy),
      mastery: masteryLevel(result.accuracy),
    };
  });
}

function skillCards(
  overall: AccuracyStat,
  recall: AccuracyStat,
  application: AccuracyStat,
): SkillStat[] {
  const tip = (stat: AccuracyStat, low: string, high: string): string | null =>
    stat.accuracy === null
      ? null
      : stat.accuracy < SKILL_TIP_BELOW
        ? low
        : high;
  return [
    {
      key: 'accuracy',
      label: 'Accuracy',
      accuracy: overall.accuracy,
      detail: `${overall.correct}/${overall.answered} correct`,
      tip: tip(
        overall,
        'Focus on understanding concepts before speed.',
        'Strong accuracy — aim for 80%+.',
      ),
    },
    {
      key: 'recall',
      label: 'Formula recall',
      accuracy: recall.accuracy,
      detail: `${recall.correct}/${recall.answered} recall questions`,
      tip: tip(
        recall,
        'Make a formula sheet and revise daily.',
        'Good recall! Try harder derivations.',
      ),
    },
    {
      key: 'application',
      label: 'Problem solving',
      accuracy: application.accuracy,
      detail: `${application.correct}/${application.answered} application questions`,
      tip: tip(
        application,
        'Solve 5 application problems daily.',
        'Excellent problem solving!',
      ),
    },
  ];
}

/** Compass's four insight cards: strongest, weakest, focus and study tip. */
function insightsFor(
  overall: AccuracyStat,
  bloom: readonly BloomStat[],
): AnalyticsInsights {
  const scored = bloom.filter(
    (level): level is BloomStat & { accuracy: number } =>
      level.accuracy !== null,
  );
  const strongest = scored.reduce<(typeof scored)[number] | null>(
    (best, level) =>
      best === null || level.accuracy > best.accuracy ? level : best,
    null,
  );
  const weakest = scored.reduce<(typeof scored)[number] | null>(
    (worst, level) =>
      worst === null || level.accuracy < worst.accuracy ? level : worst,
    null,
  );
  const hasSpread = scored.length > 1 && strongest !== weakest;
  const accuracy = overall.accuracy;
  return {
    strongestBloom: strongest
      ? { level: strongest.level, accuracy: strongest.accuracy }
      : null,
    weakestBloom:
      hasSpread && weakest
        ? { level: weakest.level, accuracy: weakest.accuracy }
        : null,
    focus:
      hasSpread && weakest
        ? `Practice more ${weakest.level} level questions`
        : null,
    tip:
      accuracy === null
        ? null
        : accuracy < AVERAGE_BAND_AT
          ? 'Start with Remember level — build your foundation first.'
          : accuracy < STRONG_BAND_AT
            ? 'Focus on Apply level questions to boost your score.'
            : 'Challenge yourself with Analyze level questions.',
  };
}

function core(events: readonly AnswerEvent[]) {
  const overall = tally(events);
  const recall = tally(events.filter(isRecall));
  const application = tally(events.filter((event) => !isRecall(event)));
  const bloom = bloomBreakdown(events);
  return {
    overall,
    mastery: masteryLevel(overall.accuracy),
    skills: skillCards(overall, recall, application),
    insights: insightsFor(overall, bloom),
    recall,
    application,
    bloom,
    hasData: events.length > 0,
  };
}

/** Monday 00:00 UTC of the week containing `date`. */
export function weekStart(date: Date): Date {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const sinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - sinceMonday);
  return start;
}

export function weeklyTrend(
  events: readonly AnswerEvent[],
  now: Date,
  weeks = TREND_WEEKS,
): TrendPoint[] {
  const thisWeek = weekStart(now).getTime();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return Array.from({ length: weeks }, (_, index) => {
    const start = thisWeek - (weeks - 1 - index) * weekMs;
    const inWeek = events.filter((event) => {
      const time = event.answeredAt.getTime();
      return time >= start && time < start + weekMs;
    });
    return {
      weekStart: new Date(start).toISOString().slice(0, 10),
      ...tally(inWeek),
    };
  });
}

function topicStats(
  events: readonly AnswerEvent[],
  chapters: readonly OutlineChapter[],
): TopicStat[] {
  const slugByName = new Map(chapters.map((c) => [c.name, c.slug]));
  const groups = new Map<string, AnswerEvent[]>();
  for (const event of events) {
    const key = `${event.chapter}\u0000${event.topic}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.values()]
    .filter((group) => group.length >= MIN_TOPIC_ANSWERS)
    .map((group) => ({
      chapter: group[0].chapter,
      chapterSlug:
        slugByName.get(group[0].chapter) ?? slugify(group[0].chapter),
      scopeChapter: group[0].sourceChapter ?? group[0].chapter,
      topic: group[0].topic,
      ...tally(group),
    }));
}

/** Per-chapter view (used by the chapter page's Bloom tab). */
export function buildChapterAnalytics(
  events: readonly AnswerEvent[],
): ChapterAnalytics {
  return core(events);
}

/**
 * Per-subject analytics for one student. `events` must already be limited to
 * this student and subject; `chapters` is the subject outline in display
 * order so empty chapters still appear (with a null accuracy, not 0%).
 */
export function buildSubjectAnalytics(
  subject: { slug: string; name: string },
  chapters: readonly OutlineChapter[],
  events: readonly AnswerEvent[],
  now: Date,
): SubjectAnalytics {
  const known = new Set(chapters.map((chapter) => chapter.name));
  const inSubject = events.filter((event) => known.has(event.chapter));

  const chapterRows = chapters.map((chapter) => ({
    slug: chapter.slug,
    name: chapter.name,
    unit: chapter.unit,
    ...tally(inSubject.filter((event) => event.chapter === chapter.name)),
  }));

  const unitNames = [
    ...new Set(
      chapters.flatMap((chapter) => (chapter.unit ? [chapter.unit] : [])),
    ),
  ];
  const unitRows = unitNames.map((name) => {
    const names = new Set(
      chapters.filter((c) => c.unit === name).map((c) => c.name),
    );
    return {
      name,
      chapters: names.size,
      ...tally(inSubject.filter((event) => names.has(event.chapter))),
    };
  });

  const topics = topicStats(inSubject, chapters);
  const strongTopics = topics
    .filter((t) => (t.accuracy ?? 0) >= STRONG_AT_OR_ABOVE)
    .sort(
      (a, b) =>
        (b.accuracy ?? 0) - (a.accuracy ?? 0) || b.answered - a.answered,
    )
    .slice(0, LIST_LIMIT);
  const weakTopics = topics
    .filter((t) => (t.accuracy ?? 100) < WEAK_BELOW)
    .sort(
      (a, b) =>
        (a.accuracy ?? 0) - (b.accuracy ?? 0) || b.answered - a.answered,
    )
    .slice(0, LIST_LIMIT);

  return {
    subject,
    ...core(inSubject),
    chaptersCompleted: chapterRows.filter(
      (row) => row.accuracy !== null && row.accuracy >= COMPLETED_AT,
    ).length,
    units: unitRows,
    chapters: chapterRows,
    strongTopics,
    weakTopics,
    trend: weeklyTrend(inSubject, now),
  };
}
