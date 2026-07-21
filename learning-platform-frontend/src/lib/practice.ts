export interface PracticeScope {
  subject: string;
  chapter: string;
  topic: string;
}

type SearchParamsReader = Pick<URLSearchParams, 'get'>;

/** Parses only a complete, human-readable practice scope from the URL. */
export function practiceScopeFromSearchParams(
  searchParams: SearchParamsReader,
): PracticeScope | null {
  const subject = searchParams.get('subject')?.trim();
  const chapter = searchParams.get('chapter')?.trim();
  const topic = searchParams.get('topic')?.trim();

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
  return `/arena?${params.toString()}`;
}

export function elapsedPracticeSeconds(startedAt: string): number {
  const startedAtTime = new Date(startedAt).getTime();
  if (Number.isNaN(startedAtTime)) return 0;
  return Math.max(0, Math.min(60 * 60, Math.floor((Date.now() - startedAtTime) / 1000)));
}
