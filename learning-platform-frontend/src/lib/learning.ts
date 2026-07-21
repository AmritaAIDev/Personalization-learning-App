import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { LearningScope, LearningTab } from './learning-types';

export function learningScopeFromSearchParams(
  searchParams: ReadonlyURLSearchParams,
): LearningScope | null {
  const subject = searchParams.get('subject')?.trim();
  const chapter = searchParams.get('chapter')?.trim();
  const topic = searchParams.get('topic')?.trim();
  if (!subject || !chapter || !topic) return null;
  return { subject, chapter, topic };
}

export function learningUrl(
  scope: LearningScope,
  options?: { tab?: LearningTab },
): string {
  const params = new URLSearchParams(scope);
  if (options?.tab) params.set('tab', options.tab);
  return `/learn?${params.toString()}`;
}

export function learningTabFromSearchParams(
  searchParams: ReadonlyURLSearchParams,
): LearningTab {
  const value = searchParams.get('tab');
  return value === 'review' || value === 'practice' || value === 'overview'
    ? value
    : 'overview';
}
