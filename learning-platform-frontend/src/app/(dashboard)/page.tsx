'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  ClipboardCheck,
  LoaderCircle,
  Search,
  Sparkles,
} from 'lucide-react';
import TopicSearch from '@/components/search/TopicSearch';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { learningUrl } from '@/lib/learning';
import type {
  DashboardPayload,
  DiagnosticAttemptPayload,
} from '@/lib/diagnostic-types';
import type { GrowthPayload, TopicCompetency } from '@/lib/growth-types';
import type { LearningScope } from '@/lib/learning-types';

type SubjectReadiness = {
  subject: string;
  score: number;
  strong: number;
  weak: number;
  tone: 'rose' | 'green' | 'orange';
};

type ChapterReadiness = {
  subject: string;
  chapter: string;
  score: number;
  topics: TopicCompetency[];
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function scoreTone(score: number): SubjectReadiness['tone'] {
  if (score >= 60) return 'green';
  if (score >= 40) return 'orange';
  return 'rose';
}

function levelLabel(score: number) {
  if (score >= 70) return 'High';
  if (score >= 45) return 'Med';
  return 'Low';
}

function toneClasses(tone: SubjectReadiness['tone']) {
  if (tone === 'green') {
    return {
      text: 'text-[#3f6f57]',
      bar: 'bg-[#3f6f57]',
      tint: 'bg-emerald-50 text-emerald-700',
    };
  }
  if (tone === 'orange') {
    return {
      text: 'text-orange-500',
      bar: 'bg-orange-500',
      tint: 'bg-orange-50 text-orange-700',
    };
  }
  return {
    text: 'text-primary',
    bar: 'bg-primary',
    tint: 'bg-primary/10 text-primary',
  };
}

function subjectReadiness(topics: TopicCompetency[]): SubjectReadiness[] {
  const groups = new Map<string, TopicCompetency[]>();
  for (const topic of topics) {
    groups.set(topic.subject, [...(groups.get(topic.subject) ?? []), topic]);
  }
  return Array.from(groups.entries()).map(([subject, subjectTopics]) => {
    const score = average(subjectTopics.map((topic) => topic.score));
    return {
      subject,
      score,
      strong: subjectTopics.filter((topic) => topic.score >= 70).length,
      weak: subjectTopics.filter((topic) => topic.score < 45).length,
      tone: scoreTone(score),
    };
  });
}

function chapterReadiness(topics: TopicCompetency[]): ChapterReadiness | null {
  const groups = new Map<string, TopicCompetency[]>();
  for (const topic of topics) {
    const key = `${topic.subject}::${topic.chapter}`;
    groups.set(key, [...(groups.get(key) ?? []), topic]);
  }
  const chapters = Array.from(groups.entries())
    .map(([key, chapterTopics]) => {
      const [subject, chapter] = key.split('::');
      return {
        subject,
        chapter,
        score: average(chapterTopics.map((topic) => topic.score)),
        topics: chapterTopics.slice().sort((a, b) => a.score - b.score).slice(0, 4),
      };
    })
    .sort((a, b) => a.score - b.score);
  return chapters[0] ?? null;
}

function topicScope(topic: TopicCompetency): LearningScope {
  return {
    subject: topic.subject,
    chapter: topic.chapter,
    topic: topic.topic,
  };
}

function ReadinessSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-[1.35rem] border border-hairline bg-surface p-5">
          <div className="h-4 w-20 rounded-full skeleton" />
          <div className="mt-4 h-9 w-24 rounded-full skeleton" />
          <div className="mt-4 h-2 w-full rounded-full skeleton" />
        </div>
      ))}
    </div>
  );
}

function SubjectCard({ subject }: { subject: SubjectReadiness }) {
  const tone = toneClasses(subject.tone);
  return (
    <article className="rounded-[1.35rem] border border-hairline bg-surface p-5 shadow-[0_18px_48px_rgba(20,20,30,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(20,20,30,0.07)]">
      <p className="text-sm font-semibold text-ink-soft">{subject.subject}</p>
      <p className={`mt-3 font-heading text-4xl font-semibold tracking-tight ${tone.text}`}>
        {subject.score}%
      </p>
      <p className="mt-1 text-xs font-medium text-ink-mute">
        {subject.strong} strong · {subject.weak} weak
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ececf0]">
        <div
          className={`h-full rounded-full ${tone.bar} transition-[width] duration-700`}
          style={{ width: `${subject.score}%` }}
        />
      </div>
    </article>
  );
}

function TopicProgressRow({ topic }: { topic: TopicCompetency }) {
  const tone = toneClasses(scoreTone(topic.score));
  return (
    <Link
      href={learningUrl(topicScope(topic), { tab: 'practice' })}
      className="group block rounded-xl px-1 py-1 transition hover:bg-canvas"
    >
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="truncate font-semibold text-ink">{topic.topic}</span>
        <span className={`text-xs font-semibold ${tone.text}`}>{levelLabel(topic.score)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#ececf0]">
        <div
          className={`h-full rounded-full ${tone.bar} transition-[width] duration-700 group-hover:opacity-90`}
          style={{ width: `${Math.max(topic.score, 8)}%` }}
        />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [growth, setGrowth] = useState<GrowthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardData, growthData] = await Promise.all([
        apiFetch<DashboardPayload>('/api/diagnostics/dashboard'),
        apiFetch<GrowthPayload>('/api/learning/growth'),
      ]);
      setDashboard(dashboardData);
      setGrowth(growthData);
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Your learning dashboard could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  const startDiagnostic = async () => {
    if (dashboard?.activeAttempt) {
      router.push('/diagnostic/' + dashboard.activeAttempt.id);
      return;
    }
    setLaunching(true);
    setError(null);
    try {
      const payload = await apiFetch<DiagnosticAttemptPayload>('/api/diagnostics', {
        method: 'POST',
        body: JSON.stringify({ subject: 'Physics' }),
      });
      router.push('/diagnostic/' + payload.attempt.id);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The diagnostic could not be started.',
      );
      setLaunching(false);
    }
  };

  const subjects = useMemo(() => subjectReadiness(growth?.topics ?? []), [growth?.topics]);
  const weakTopics = useMemo(
    () => (growth?.topics ?? []).slice().sort((a, b) => a.score - b.score).slice(0, 4),
    [growth?.topics],
  );
  const chapter = useMemo(() => chapterReadiness(growth?.topics ?? []), [growth?.topics]);
  const continueTopic = weakTopics[0] ?? growth?.topics[0] ?? null;
  const firstName = user?.name.split(' ')[0] || 'learner';
  const diagnostic = dashboard?.diagnostic;
  const showBaseline =
    !loading &&
    dashboard &&
    !dashboard.activeAttempt &&
    dashboard.stats.testsTaken === 0 &&
    dashboard.recentAttempts.length === 0;

  return (
    <div className="min-h-screen bg-[#fbfbfd] pb-20">
      <main className="mx-auto w-full max-w-6xl px-5 pt-9 sm:px-8 lg:px-10">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)] lg:items-start">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Dashboard
            </p>
            <h1 className="mt-3 font-heading text-[2.2rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-[3rem]">
              Where should I focus today?
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-mute">
              Hi {firstName}. Subject → chapter → topic clarity, not a vague overall score.
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-hairline bg-white p-3 shadow-[0_14px_34px_rgba(20,20,30,0.04)]">
            <TopicSearch />
          </div>
        </section>

        {error ? (
          <div
            className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800"
            role="alert"
          >
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Something needs attention</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="mt-3 font-semibold underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        <section className="mt-8">
          {loading ? (
            <ReadinessSkeleton />
          ) : subjects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {subjects.map((subject) => (
                <SubjectCard key={subject.subject} subject={subject} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-hairline bg-white p-6 text-sm leading-6 text-ink-soft">
              Readiness cards appear after diagnostics or adaptive practice create real learning
              evidence.
            </div>
          )}
        </section>

        {showBaseline ? (
          <section className="mt-5 rounded-[1.35rem] border border-primary/15 bg-primary/8 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-primary">
                  <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-ink">Start with a baseline diagnostic</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {diagnostic?.questionCount ?? 15} questions ·{' '}
                    {diagnostic?.durationMinutes ?? 30} min
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void startDiagnostic()}
                disabled={launching || Boolean(diagnostic && !diagnostic.ready)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-55"
              >
                {launching ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                Start baseline
              </button>
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[1.55rem] border border-hairline bg-white p-5 shadow-[0_18px_48px_rgba(20,20,30,0.05)] sm:p-6">
            <span className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
              Start here
            </span>
            <h2 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-ink">
              Priority weak topics
            </h2>
            <div className="mt-5 space-y-5">
              {weakTopics.length > 0 ? (
                weakTopics.slice(0, 3).map((topic) => (
                  <TopicProgressRow key={`${topic.chapter}-${topic.topic}`} topic={topic} />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-hairline bg-canvas p-5 text-sm leading-6 text-ink-soft">
                  Weak topics will be calculated from real diagnostics and adaptive practice.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-[1.55rem] border border-hairline bg-white p-5 shadow-[0_18px_48px_rgba(20,20,30,0.05)] sm:p-6">
            <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
              {chapter?.subject ?? 'Subject'}
            </span>
            <h2 className="mt-5 font-heading text-2xl font-semibold tracking-tight text-ink">
              {chapter?.chapter ?? 'Chapter readiness'}
            </h2>
            <div className="mt-5 space-y-5">
              {chapter ? (
                chapter.topics.map((topic) => (
                  <TopicProgressRow key={`${topic.chapter}-${topic.topic}`} topic={topic} />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-hairline bg-canvas p-5 text-sm leading-6 text-ink-soft">
                  Chapter readiness appears after topic-level evidence is available.
                </p>
              )}
            </div>
          </article>
        </section>

        <section className="mt-8 overflow-hidden rounded-[1.55rem] bg-ink p-6 text-white shadow-[0_22px_70px_rgba(20,20,30,0.16)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/70">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Continue
              </span>
              <h2 className="mt-5 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                {dashboard?.activeAttempt
                  ? 'Finish your active diagnostic'
                  : continueTopic
                    ? `${continueTopic.topic} · Level ${continueTopic.level} · ${continueTopic.bloomLevel} · ${continueTopic.difficulty}`
                    : 'Open a learning workspace'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">
                {dashboard?.activeAttempt
                  ? `${dashboard.activeAttempt.answeredCount} answers are saved. Resume before the timer expires.`
                  : 'Fresh five-question checkpoint, tutor support, no repeats, automatic level movement.'}
              </p>
            </div>
            <Link
              href={
                dashboard?.activeAttempt
                  ? `/diagnostic/${dashboard.activeAttempt.id}`
                  : continueTopic
                    ? learningUrl(topicScope(continueTopic), { tab: 'practice' })
                    : '/learn'
              }
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white/90"
            >
              Continue learning
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/tests"
            className="rounded-[1.35rem] border border-hairline bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(20,20,30,0.06)]"
          >
            <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <p className="mt-4 font-semibold text-ink">Tests</p>
            <p className="mt-1 text-sm text-ink-soft">Baseline and reviewed practice reports.</p>
          </Link>
          <Link
            href="/notebook"
            className="rounded-[1.35rem] border border-hairline bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(20,20,30,0.06)]"
          >
            <BookOpenCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <p className="mt-4 font-semibold text-ink">Notebook</p>
            <p className="mt-1 text-sm text-ink-soft">Repair wrong answers and due reviews.</p>
          </Link>
          <Link
            href="/learn"
            className="rounded-[1.35rem] border border-hairline bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(20,20,30,0.06)]"
          >
            <Search className="h-5 w-5 text-primary" aria-hidden="true" />
            <p className="mt-4 font-semibold text-ink">Learn</p>
            <p className="mt-1 text-sm text-ink-soft">Open a topic workspace and tutor flow.</p>
          </Link>
        </section>
      </main>
    </div>
  );
}
