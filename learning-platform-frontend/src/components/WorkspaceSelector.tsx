'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpenCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Layers3,
  LoaderCircle,
  SquarePen,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { learningScopeFromSearchParams, learningUrl } from '@/lib/learning';
import { practiceHref } from '@/lib/practice';
import type { LearningDashboardPayload, LearningScope } from '@/lib/learning-types';
import type { QuestionCatalogEntry } from '@/lib/practice-types';

type ChapterGroup = {
  chapter: string;
  topics: QuestionCatalogEntry[];
};

function toScope(entry: QuestionCatalogEntry): LearningScope {
  return { subject: entry.subject, chapter: entry.chapter, topic: entry.topic };
}

function scopedHref(path: string, scope: LearningScope) {
  const params = new URLSearchParams(scope);
  return `${path}?${params.toString()}`;
}

export default function WorkspaceSelector() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dashboard, setDashboard] = useState<LearningDashboardPayload | null>(null);
  const [catalog, setCatalog] = useState<QuestionCatalogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setCatalogError(null);
    try {
      const [dashboardResult, catalogResult] = await Promise.allSettled([
        apiFetch<LearningDashboardPayload>('/api/learning/dashboard'),
        apiFetch<QuestionCatalogEntry[]>('/api/questions/catalog?limit=80', {
          memoryCacheTtlMs: 45_000,
        }),
      ]);

      if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value);

      if (catalogResult.status === 'fulfilled') {
        setCatalog(catalogResult.value);
      } else {
        setCatalog([]);
        const reason = catalogResult.reason;
        setCatalogError(
          reason instanceof ApiError ? reason.message : 'The topic catalog could not be loaded.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const routeScope = learningScopeFromSearchParams(searchParams);
  const backendScope = dashboard?.activeTopics[0] ?? dashboard?.completedTopics[0] ?? null;
  const scope = routeScope ?? backendScope;
  const groupedCatalog = useMemo(() => {
    const subjects = new Map<string, ChapterGroup[]>();
    for (const entry of catalog) {
      const chapters = subjects.get(entry.subject) ?? [];
      const chapter = chapters.find((item) => item.chapter === entry.chapter);
      if (chapter) chapter.topics.push(entry);
      else chapters.push({ chapter: entry.chapter, topics: [entry] });
      subjects.set(entry.subject, chapters);
    }
    return Array.from(subjects.entries());
  }, [catalog]);

  const selectScope = (nextScope: LearningScope) => {
    setOpen(false);
    router.push(learningUrl(nextScope));
  };

  const isWorkspaceRoute = ['/learn', '/practice', '/tests', '/notebook', '/doubts'].some(
    (route) => pathname.startsWith(route),
  );

  return (
    <section className="relative hidden lg:block">
      <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-mute">
        Study space
      </p>
      <div className={`overflow-visible rounded-2xl border p-1.5 transition ${
        isWorkspaceRoute
          ? 'border-primary/20 bg-primary-tint/40 shadow-[0_10px_28px_rgba(20,20,30,0.045)]'
          : 'border-hairline bg-canvas/70'
      }`}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-3 rounded-xl bg-white/75 p-2.5 text-left transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-expanded={open}
          aria-controls="workspace-selector"
        >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-white">
          <Layers3 className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          {loading ? (
            <span className="block h-7 w-28 rounded-full skeleton" />
          ) : scope ? (
            <>
              <span className="block truncate text-[11px] font-medium text-ink-mute">
                {scope.subject} / {scope.chapter}
              </span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-ink">{scope.topic}</span>
            </>
          ) : (
            <>
              <span className="block text-[11px] font-medium text-ink-mute">No topic selected</span>
              <span className="mt-0.5 block text-sm font-semibold text-ink">Choose a workspace</span>
            </>
          )}
        </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-ink-mute transition ${open ? 'rotate-180' : ''}`} />
        </button>

      {open ? (
        <div
          id="workspace-selector"
          className="absolute left-0 top-[calc(100%+0.625rem)] z-50 w-[min(29rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-hairline bg-white shadow-[0_24px_64px_rgba(20,20,30,0.18)]"
        >
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Choose workspace</p>
              <p className="mt-0.5 text-xs text-ink-mute">Subject / chapter / topic</p>
            </div>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> : null}
          </div>
          <div className="max-h-[min(32rem,calc(100vh-12rem))] overflow-y-auto p-2">
            {!loading && catalogError ? (
              <div className="m-2 rounded-xl border border-danger/15 bg-danger/5 p-4">
                <p className="text-sm font-semibold text-ink">Could not load the topic catalog</p>
                <p className="mt-1 text-xs leading-5 text-ink-soft">{catalogError}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mt-3 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Retry catalog
                </button>
              </div>
            ) : null}
            {!loading && !catalogError && groupedCatalog.length === 0 ? (
              <div className="p-4">
                <p className="text-sm font-semibold text-ink">No reviewed topics are available yet</p>
                <p className="mt-1 text-xs leading-5 text-ink-soft">
                  Topics appear here after questions are published to the learning catalog.
                </p>
              </div>
            ) : null}
            {groupedCatalog.map(([subject, chapters]) => (
              <section key={subject} className="mb-3 last:mb-0">
                <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  {subject}
                </p>
                {chapters.map((chapter) => (
                  <div key={chapter.chapter} className="mb-1 rounded-xl bg-canvas p-1.5 last:mb-0">
                    <p className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-ink-soft">
                      <ChevronRight className="h-3.5 w-3.5 text-ink-mute" aria-hidden="true" />
                      {chapter.chapter}
                    </p>
                    {chapter.topics.map((entry) => {
                      const entryScope = toScope(entry);
                      const selected =
                        scope?.subject === entryScope.subject &&
                        scope.chapter === entryScope.chapter &&
                        scope.topic === entryScope.topic;
                      return (
                        <button
                          key={`${entry.subject}-${entry.chapter}-${entry.topic}`}
                          type="button"
                          onClick={() => selectScope(entryScope)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                            selected
                              ? 'bg-white font-semibold text-primary shadow-sm'
                              : 'text-ink hover:bg-white hover:text-primary'
                          }`}
                        >
                          <span className="truncate">{entry.topic}</span>
                          <span className="shrink-0 text-[11px] font-medium text-ink-mute">
                            {entry.easyCount + entry.mediumCount + entry.hardCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      ) : null}

        {scope ? (
          <nav className="mt-1.5 border-t border-hairline/80 px-1 pt-1.5" aria-label="Selected topic workspace">
            <WorkspaceLink href={learningUrl(scope)} label="Learn" icon={Layers3} active={pathname === '/learn'} featured />
            <div className="mt-1 grid grid-cols-2 gap-1">
              <WorkspaceLink href={learningUrl(scope, { tab: 'practice' })} label="Practice" icon={SquarePen} active={pathname === '/learn' && searchParams.get('tab') === 'practice'} />
              <WorkspaceLink href={practiceHref(scope)} label="Tests" icon={Timer} active={pathname === '/practice'} />
              <WorkspaceLink href={scopedHref('/notebook', scope)} label="Notebook" icon={BookOpenCheck} active={pathname === '/notebook'} />
              <WorkspaceLink href={scopedHref('/doubts', scope)} label="Doubts" icon={CircleHelp} active={pathname === '/doubts'} />
            </div>
          </nav>
        ) : null}
      </div>
    </section>
  );
}

function WorkspaceLink({
  href,
  label,
  icon: Icon,
  active,
  featured = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex h-9 items-center gap-2 rounded-lg px-2.5 text-[12px] font-medium transition ${
        featured ? 'w-full' : 'min-w-0 justify-start'} ${
        active
          ? 'bg-white text-primary shadow-sm'
          : featured
            ? 'bg-ink text-white hover:bg-primary'
            : 'text-ink-soft hover:bg-white hover:text-ink'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
