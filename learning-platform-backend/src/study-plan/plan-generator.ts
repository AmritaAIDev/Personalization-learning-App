import { dateRange } from './plan-dates';

/** A topic the student still has to cover, in the order it should be studied. */
export interface PlanTopic {
  subject: string;
  /** The curriculum chapter this topic belongs to (display name). */
  chapter: string;
  /** The chapter name its questions are tagged with; what /learn links need. */
  scopeChapter: string;
  topic: string;
  /** Study minutes for the whole chapter, or null when unknown. */
  chapterMinutes: number | null;
  /** Studyable topics in the chapter, used to split `chapterMinutes`. */
  chapterTopicCount: number;
}

export interface PlannedTask {
  /** `YYYY-MM-DD` */
  date: string;
  subject: string;
  chapter: string;
  scopeChapter: string;
  topic: string;
  estMinutes: number;
}

export interface GeneratedPlan {
  tasks: PlannedTask[];
  /** True when the work does not fit the daily budget before the deadline. */
  paceWarning: boolean;
  /** Minutes per day that would fit all the work (a multiple of 5). */
  requiredMinutesPerDay: number;
  totalMinutes: number;
  /** Days available (start to end, inclusive). */
  days: number;
  /** Topics that could not be given a day because no days are left. */
  unplacedTopics: number;
}

export interface GenerateInput {
  topics: readonly PlanTopic[];
  /** First day to plan, `YYYY-MM-DD` (normally today in IST). */
  startDate: string;
  /** Last day to plan, `YYYY-MM-DD` (the end of the target month). */
  endDate: string;
  dailyMinutes: number;
  /**
   * Minutes already taken on a day by work that is kept (ticked tasks of an
   * earlier plan), by `YYYY-MM-DD`. New topics only use what is left.
   */
  reservedByDate?: Readonly<Record<string, number>>;
}

export const DEFAULT_TOPIC_MINUTES = 30;
export const MIN_TOPIC_MINUTES = 15;
export const MAX_TOPIC_MINUTES = 90;
const ROUND_TO = 5;

const roundTo = (value: number, step: number) =>
  Math.round(value / step) * step;
const ceilTo = (value: number, step: number) => Math.ceil(value / step) * step;

/**
 * Minutes to schedule for one topic: its share of the chapter's study time
 * (30 when unknown), kept between 15 and 90 and rounded to 5, and never more
 * than a whole day's budget so every topic can be placed.
 */
export function estimateTopicMinutes(
  topic: Pick<PlanTopic, 'chapterMinutes' | 'chapterTopicCount'>,
  dailyMinutes: number,
): number {
  const share =
    topic.chapterMinutes !== null &&
    topic.chapterMinutes > 0 &&
    topic.chapterTopicCount > 0
      ? topic.chapterMinutes / topic.chapterTopicCount
      : DEFAULT_TOPIC_MINUTES;
  const clamped = Math.min(
    MAX_TOPIC_MINUTES,
    Math.max(MIN_TOPIC_MINUTES, roundTo(share, ROUND_TO)),
  );
  return Math.min(clamped, Math.max(ROUND_TO, dailyMinutes));
}

interface DaySlot {
  date: string;
  subject: string | null;
  load: number;
  tasks: PlannedTask[];
}

/**
 * Spreads the remaining topics over the days from `startDate` to `endDate`.
 *
 * Deterministic and explainable, no AI involved:
 *  - each day studies **one subject**, and subjects take turns, so a day is
 *    focused and no subject is left to the end;
 *  - within a subject the given order is kept (so earlier chapters come first);
 *  - a day is filled up to the daily budget, never splitting a topic;
 *  - if the work does not fit, `paceWarning` is set, the budget is raised to
 *    what would fit, and anything still left over is spread onto the lightest
 *    days. Topics are never silently dropped; only when there are no days at
 *    all (the target month is over) are they reported as `unplacedTopics`.
 */
export function generatePlan(input: GenerateInput): GeneratedPlan {
  const days = dateRange(input.startDate, input.endDate);
  const withMinutes = input.topics.map((topic) => ({
    topic,
    minutes: estimateTopicMinutes(topic, input.dailyMinutes),
  }));
  const totalMinutes = withMinutes.reduce((sum, item) => sum + item.minutes, 0);

  if (withMinutes.length === 0) {
    return {
      tasks: [],
      paceWarning: false,
      requiredMinutesPerDay: 0,
      totalMinutes: 0,
      days: days.length,
      unplacedTopics: 0,
    };
  }
  if (days.length === 0) {
    return {
      tasks: [],
      paceWarning: true,
      requiredMinutesPerDay: ceilTo(totalMinutes, ROUND_TO),
      totalMinutes,
      days: 0,
      unplacedTopics: withMinutes.length,
    };
  }

  const reserved = (date: string) => input.reservedByDate?.[date] ?? 0;
  const reservedTotal = days.reduce((sum, date) => sum + reserved(date), 0);
  const requiredMinutesPerDay = ceilTo(
    (totalMinutes + reservedTotal) / days.length,
    ROUND_TO,
  );
  let paceWarning =
    totalMinutes + reservedTotal > days.length * input.dailyMinutes;
  const budget = paceWarning
    ? Math.max(input.dailyMinutes, requiredMinutesPerDay)
    : input.dailyMinutes;

  // One queue per subject, in the order subjects first appear.
  const subjects: string[] = [];
  const queues = new Map<string, typeof withMinutes>();
  for (const item of withMinutes) {
    const subject = item.topic.subject;
    if (!queues.has(subject)) {
      subjects.push(subject);
      queues.set(subject, []);
    }
    queues.get(subject)?.push(item);
  }
  const cursor = new Map(subjects.map((subject) => [subject, 0]));
  const remaining = (subject: string) =>
    (queues.get(subject)?.length ?? 0) - (cursor.get(subject) ?? 0);

  const slots: DaySlot[] = days.map((date) => ({
    date,
    subject: null,
    load: reserved(date),
    tasks: [],
  }));
  const place = (slot: DaySlot, item: (typeof withMinutes)[number]) => {
    slot.tasks.push({
      date: slot.date,
      subject: item.topic.subject,
      chapter: item.topic.chapter,
      scopeChapter: item.topic.scopeChapter,
      topic: item.topic.topic,
      estMinutes: item.minutes,
    });
    slot.load += item.minutes;
  };

  let turn = 0;
  for (const slot of slots) {
    // A day already full of kept work takes nothing new and keeps its turn.
    if (slot.load >= budget) continue;
    let pick: string | null = null;
    for (let offset = 0; offset < subjects.length; offset += 1) {
      const candidate = subjects[(turn + offset) % subjects.length];
      if (remaining(candidate) > 0) {
        pick = candidate;
        turn = (turn + offset + 1) % subjects.length;
        break;
      }
    }
    if (pick === null) break; // everything is placed
    slot.subject = pick;
    const queue = queues.get(pick) ?? [];
    while (remaining(pick) > 0) {
      const next = queue[cursor.get(pick) ?? 0];
      // A day always gets at least one topic; after that only what fits.
      if (slot.load > 0 && slot.load + next.minutes > budget) break;
      place(slot, next);
      cursor.set(pick, (cursor.get(pick) ?? 0) + 1);
    }
  }

  // Anything left (rotation can waste room on partly filled days) goes onto
  // the lightest of that subject's days, never earlier than the day of the
  // subject's previous topic, so the syllabus order is kept by date.
  for (const subject of subjects) {
    const queue = queues.get(subject) ?? [];
    let floor = Math.max(
      0,
      slots.reduce(
        (last, slot, index) => (slot.subject === subject ? index : last),
        0,
      ),
    );
    for (
      let index = cursor.get(subject) ?? 0;
      index < queue.length;
      index += 1
    ) {
      paceWarning = true;
      const ahead = slots.slice(floor);
      const sameSubject = ahead.filter((slot) => slot.subject === subject);
      const candidates = sameSubject.length > 0 ? sameSubject : ahead;
      const lightest = candidates.reduce((best, slot) =>
        slot.load < best.load ? slot : best,
      );
      lightest.subject ??= subject;
      floor = slots.indexOf(lightest);
      place(lightest, queue[index]);
    }
  }

  return {
    tasks: slots.flatMap((slot) => slot.tasks),
    paceWarning,
    requiredMinutesPerDay,
    totalMinutes,
    days: days.length,
    unplacedTopics: 0,
  };
}
