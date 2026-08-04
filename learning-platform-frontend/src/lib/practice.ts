export interface PracticeScope {
  subject: string;
  chapter: string;
  topic: string;
}

type SearchParamsReader = Pick<URLSearchParams, "get">;

/** Parses only a complete, human-readable practice scope from the URL. */
export function practiceScopeFromSearchParams(
  searchParams: SearchParamsReader,
): PracticeScope | null {
  const subject = searchParams.get("subject")?.trim();
  const chapter = searchParams.get("chapter")?.trim();
  const topic = searchParams.get("topic")?.trim();

  if (!subject || !chapter || !topic) {
    return null;
  }

  return { subject, chapter, topic };
}

export function practiceHref(scope: PracticeScope): string {
  const params = new URLSearchParams({
    subject: scope.subject,
    chapter: scope.chapter,
    topic: scope.topic,
  });
  return `/practice?${params.toString()}`;
}

/** Clamped to the range the backend accepts for a stored answer time. */
export function elapsedPracticeSeconds(startedAt: string | number): number {
  const startedAtTime =
    typeof startedAt === "number" ? startedAt : new Date(startedAt).getTime();
  if (Number.isNaN(startedAtTime)) return 0;
  return Math.max(
    0,
    Math.min(60 * 60, Math.floor((Date.now() - startedAtTime) / 1000)),
  );
}

export type PracticeAttemptProgress = {
  answered: number;
  unanswered: number[];
  markedForReview: number[];
  /** Index of the first question with no saved answer, or null when complete. */
  firstUnansweredIndex: number | null;
};

/**
 * Derives everything the navigation and submit confirmation need from the
 * answer book, in one pass and with 1-based positions for display.
 */
export function summarizePracticeProgress(
  questionIds: string[],
  answers: Record<string, string>,
  marked: ReadonlySet<string>,
): PracticeAttemptProgress {
  const unanswered: number[] = [];
  const markedForReview: number[] = [];
  let answered = 0;
  let firstUnansweredIndex: number | null = null;

  questionIds.forEach((questionId, index) => {
    if (answers[questionId]) answered += 1;
    else {
      unanswered.push(index + 1);
      if (firstUnansweredIndex === null) firstUnansweredIndex = index;
    }
    if (marked.has(questionId)) markedForReview.push(index + 1);
  });

  return { answered, unanswered, markedForReview, firstUnansweredIndex };
}

/**
 * Next question that still needs attention, searching forward from `from` and
 * wrapping once. Returns null when every question has an answer.
 */
export function nextUnansweredIndex(
  questionIds: string[],
  answers: Record<string, string>,
  from: number,
): number | null {
  const total = questionIds.length;
  for (let step = 1; step <= total; step += 1) {
    const index = (from + step) % total;
    if (!answers[questionIds[index]]) return index;
  }
  return null;
}
