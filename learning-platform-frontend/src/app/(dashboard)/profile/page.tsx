'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BarChart3, CircleAlert, ClipboardCheck, LoaderCircle, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { HistoryItem } from '@/lib/diagnostic-types';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import LearningHistoryPanel from '@/components/learning/LearningHistoryPanel';

export default function ProfilePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<HistoryItem[]>('/api/diagnostics/history');
      setHistory(data);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load your history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadInitialHistory = async () => {
      await load();
    };
    void loadInitialHistory();
  }, [load]);

  const clearHistory = async () => {
    if (!window.confirm('Clear completed diagnostic history? Active attempts will be preserved.')) return;
    setClearing(true);
    setError(null);
    try {
      await apiFetch<{ clearedAttempts: number }>('/api/diagnostics/history', {
        method: 'DELETE',
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });
      setHistory([]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to clear history.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">
      <header className="relative overflow-hidden rounded-[2rem] bg-[#313337] p-6 text-white shadow-[0_20px_48px_rgba(49,51,55,0.18)] sm:p-8">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(227,21,64,0.45),transparent_48%)]" />
        <div className="relative">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#f7b9c8]">Student profile</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">{user?.name}</h1>
        <p className="mt-2 text-sm text-slate-300">{user?.email}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-semibold text-[#d6d7da]">Level</p><p className="mt-1 font-heading text-2xl font-bold">{user?.level}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-semibold text-[#d6d7da]">XP</p><p className="mt-1 font-heading text-2xl font-bold">{user?.xp}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-semibold text-[#d6d7da]">Streak</p><p className="mt-1 font-heading text-2xl font-bold">{user?.streak}</p></div></div>
        </div>
      </header>

      <LearningHistoryPanel />

      <section className="mt-9">
        <div className="flex flex-col gap-4 border-b border-[#e8e2e4] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="flex items-center gap-2 text-sm font-bold text-[#e31540]"><BarChart3 className="h-4 w-4" aria-hidden="true" /> Performance history</p><h2 className="mt-1 font-heading text-2xl font-bold text-[#313337]">Your diagnostic attempts</h2></div>
          {history.length > 0 && <button type="button" onClick={() => void clearHistory()} disabled={clearing} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">{clearing ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />} Clear completed history</button>}
        </div>
        {error && <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{error}</p>}
        {loading ? <div className="grid min-h-56 place-items-center text-sm font-semibold text-[#6b6e75]"><span className="flex items-center gap-3"><LoaderCircle className="h-5 w-5 animate-spin text-[#e31540]" /> Loading history…</span></div> : history.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-[#dcdde0] bg-white p-8 text-center"><ClipboardCheck className="mx-auto h-7 w-7 text-[#e31540]" aria-hidden="true" /><p className="mt-3 font-semibold text-[#313337]">No completed diagnostic yet</p><p className="mt-1 text-sm text-[#6b6e75]">Complete the Electrostatics baseline to begin tracking your progress.</p><Link href="/diagnostic" className="mt-5 inline-flex rounded-xl bg-[#e31540] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#c61137]">Start diagnostic</Link></div> : <div className="mt-6 grid gap-3">{history.map((attempt) => <Link key={attempt.id} href={`/analysis/${attempt.id}`} className="group flex flex-col gap-3 rounded-2xl border border-[#e8e1e3] bg-white p-5 shadow-[0_8px_22px_rgba(49,51,55,0.04)] transition hover:border-[#e31540]/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-[#313337]">{attempt.title}</h3><p className="mt-1 text-sm text-[#6b6e75]">{formatDate(attempt.completedAt)} · {attempt.correctCount}/{attempt.totalQuestions} correct</p>{attempt.weakTopics.length > 0 && <p className="mt-2 text-xs font-semibold text-rose-700">Revisit: {attempt.weakTopics.join(' · ')}</p>}</div><span className="font-heading text-3xl font-bold text-[#e31540]">{attempt.scorePercent}%</span></Link>)}</div>}
      </section>
      <p className="mt-5 flex items-center gap-2 text-xs text-[#6b6e75]"><CircleAlert className="h-4 w-4" aria-hidden="true" /> Clearing history removes only completed diagnostic records; it does not delete your account or any active attempt.</p>
    </div>
  );
}
