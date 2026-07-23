'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenText,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileText,
  LoaderCircle,
  PlayCircle,
  Sigma,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { LearningResource, LearningResourceType, RecommendationsPayload } from '@/lib/diagnostic-types';

const resourceVisuals: Record<LearningResourceType, { label: string; icon: typeof PlayCircle; tone: string }> = {
  VIDEO: { label: 'Video', icon: PlayCircle, tone: 'bg-violet-100 text-violet-800' },
  NOTES: { label: 'Notes', icon: FileText, tone: 'bg-sky-100 text-sky-800' },
  PRACTICE: { label: 'Practice', icon: ClipboardCheck, tone: 'bg-amber-100 text-amber-800' },
  FORMULA: { label: 'Formula', icon: Sigma, tone: 'bg-emerald-100 text-emerald-800' },
};

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function ResourceCard({ resource }: { resource: LearningResource }) {
  const visual = resourceVisuals[resource.type];
  const Icon = visual.icon;
  const url = safeExternalUrl(resource.url);
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#ececf0] bg-white p-5 shadow-[0_8px_22px_rgba(20, 20, 30,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${visual.tone}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" /> {visual.label}</span>
      </div>
      <h3 className="mt-4 font-heading text-lg font-bold text-[#1a1a1f]">{resource.title}</h3>
      {resource.description && <p className="mt-2 text-sm leading-6 text-[#52525b]">{resource.description}</p>}
      {resource.content && <p className="mt-4 rounded-xl bg-[#f4f4f6] p-3 text-sm leading-6 text-[#52525b]">{resource.content}</p>}
      {url && <a href={url} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-[#3f6f57] hover:text-[#315844]">Open resource <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>}
    </article>
  );
}

export default function RecommendationsPage() {
  const params = useParams<{ attemptId: string }>();
  const [recommendations, setRecommendations] = useState<RecommendationsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!params.attemptId) return;
    try {
      const data = await apiFetch<RecommendationsPayload>(`/api/diagnostics/${params.attemptId}/recommendations`);
      setRecommendations(data);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load recommendations.');
    } finally {
      setLoading(false);
    }
  }, [params.attemptId]);

  useEffect(() => {
    const loadInitialRecommendations = async () => {
      await load();
    };
    void loadInitialRecommendations();
  }, [load]);

  if (loading) return <div className="grid min-h-screen place-items-center text-sm font-semibold text-[#52525b]"><span className="flex items-center gap-3"><LoaderCircle className="h-5 w-5 animate-spin text-[#3f6f57]" /> Building your study plan…</span></div>;

  if (!recommendations) {
    return <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center"><CircleAlert className="h-8 w-8 text-rose-600" aria-hidden="true" /><h1 className="mt-4 font-heading text-2xl font-bold text-[#1a1a1f]">Recommendations unavailable</h1><p className="mt-2 text-sm text-[#52525b]">{error ?? 'Please try again.'}</p><button type="button" onClick={() => void load()} className="mt-5 rounded-xl bg-[#3f6f57] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#315844]">Try again</button></div>;
  }

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <Link href={`/analysis/${recommendations.attemptId}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#52525b] hover:text-[#3f6f57]"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to analysis</Link>
      <header className="mt-7 rounded-[2rem] border border-[#f2d9df] bg-[#fffafa] p-6 sm:p-8">
        {recommendations.hasWeakTopics ? (
          <>
            <p className="text-sm font-medium text-ink-mute">Personalized recovery plan</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#1a1a1f]">Focus your next study block.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52525b]">Start with the topics that need the most attention.</p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-2 text-[13px] font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Strong diagnostic foundation</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#1a1a1f]">Keep the momentum going.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52525b]">Keep your recall and application sharp.</p>
          </>
        )}
      </header>

      {recommendations.topicRecommendations.length > 0 && <section className="mt-9 space-y-8">
        {recommendations.topicRecommendations.map((topic) => (
          <article key={topic.topic}>
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-bold text-rose-700">Needs reinforcement</p><h2 className="mt-1 font-heading text-2xl font-bold text-slate-950">{topic.topic}</h2></div>
              {topic.formula && <p className="max-w-xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"><Sigma className="mr-2 inline h-4 w-4" aria-hidden="true" />{topic.formula}</p>}
            </div>
            {topic.resources.length > 0 ? <div className="mt-5 grid gap-4 md:grid-cols-3">{topic.resources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div> : <p className="mt-4 text-sm text-slate-600">No additional resource is available for this topic yet.</p>}
          </article>
        ))}
      </section>}

      <section className="mt-10">
        <div className="mb-5"><p className="text-sm font-bold text-[#3f6f57]">Revision library</p><h2 className="mt-1 font-heading text-2xl font-bold text-[#1a1a1f]">General Electrostatics resources</h2></div>
        {recommendations.generalResources.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{recommendations.generalResources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</div> : <p className="rounded-2xl border border-dashed border-[#dedee3] bg-white p-6 text-sm text-[#52525b]"><BookOpenText className="mr-2 inline h-5 w-5 text-[#3f6f57]" aria-hidden="true" />The revision library is being prepared.</p>}
      </section>
    </div>
  );
}
