'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  Archive,
  CheckCircle2,
  CircleAlert,
  FilePenLine,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import type {
  AdminQuestionRecord,
  QuestionReviewStatus,
} from '@/lib/question-review-types';

const statusOptions: QuestionReviewStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const bloomLevels = ['Recall', 'Comprehension', 'Application', 'Higher-Order'];
const difficulties = ['Easy', 'Medium', 'Hard'];

export default function ContentReviewPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<QuestionReviewStatus>('DRAFT');
  const [records, setRecords] = useState<AdminQuestionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    subject: 'Physics',
    chapter: 'Electric Charges and Fields',
    topic: "Coulomb's Law and Charge",
    bloomLevel: 'Application',
    difficulty: 'Medium',
  });

  useEffect(() => {
    if (user?.role !== 'admin') return;
    let active = true;
    void apiFetch<AdminQuestionRecord[]>(`/api/questions/review?status=${status}&limit=25`)
      .then((data) => {
        if (active) {
          setRecords(data);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : 'The review queue could not be loaded.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status, user?.role]);

  const generateDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const draft = await apiFetch<AdminQuestionRecord>('/api/questions/generate', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (status === 'DRAFT') setRecords((current) => [draft, ...current]);
      setNotice('A generated question was saved as a draft. Review it before publishing.');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'The draft could not be generated.',
      );
    } finally {
      setGenerating(false);
    }
  };

  const updatePublication = async (
    questionId: string,
    action: 'PUBLISH' | 'ARCHIVE',
  ) => {
    setActingId(questionId);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiFetch<AdminQuestionRecord>(
        `/api/questions/bank/${questionId}/publication`,
        { method: 'PATCH', body: JSON.stringify({ action }) },
      );
      const nextStatus = updated.status;
      setRecords((current) =>
        nextStatus === status
          ? current.map((record) => (record.question_id === questionId ? updated : record))
          : current.filter((record) => record.question_id !== questionId),
      );
      setNotice(
        action === 'PUBLISH'
          ? 'The question is now published for eligible learner flows.'
          : 'The question was archived and is no longer learner-visible.',
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'The question status could not be updated.',
      );
    } finally {
      setActingId(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl items-center p-6 sm:p-10">
        <section className="w-full rounded-[2rem] border border-[#ececf0] bg-white p-8 text-center shadow-[0_18px_45px_rgba(20, 20, 30,0.07)] sm:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e7efe9] text-[#3f6f57]"><ShieldCheck className="h-7 w-7" aria-hidden="true" /></span>
          <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-[#1a1a1f]">Reviewer access required</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#52525b]">Question generation and answer-key review are deliberately restricted to approved content reviewers.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <header className="flex flex-col gap-4 border-b border-[#ececf0] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[13px] font-medium text-ink-mute">Content governance</p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[#1a1a1f] sm:text-4xl">Question review studio</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#52525b]">Review, publish, and archive learner-ready questions.</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#e8f5ed] px-3 py-2 text-xs font-bold text-emerald-800 lg:self-auto"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Admin-only workflow</span>
      </header>

      <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <form onSubmit={(event) => void generateDraft(event)} className="rounded-[1.75rem] border border-[#ececf0] bg-white p-5 shadow-[0_14px_34px_rgba(20, 20, 30,0.05)] sm:p-6">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e7efe9] text-[#3f6f57]"><FilePenLine className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="font-heading text-xl font-bold text-[#1a1a1f]">Generate a review draft</h2><p className="mt-0.5 text-sm text-[#52525b]">The model must return four validated options and a reasoned explanation.</p></div></div>
          <div className="mt-6 grid gap-4">
            <label className="block"><span className="mb-2 block text-sm font-bold text-[#1a1a1f]">Subject</span><input required value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} className="w-full rounded-xl border border-[#dedee3] px-3 py-2.5 text-sm text-[#1a1a1f] focus:border-[#3f6f57] focus:ring-4 focus:ring-[#3f6f57]/10" /></label>
            <label className="block"><span className="mb-2 block text-sm font-bold text-[#1a1a1f]">Chapter</span><input required value={form.chapter} onChange={(event) => setForm((current) => ({ ...current, chapter: event.target.value }))} className="w-full rounded-xl border border-[#dedee3] px-3 py-2.5 text-sm text-[#1a1a1f] focus:border-[#3f6f57] focus:ring-4 focus:ring-[#3f6f57]/10" /></label>
            <label className="block"><span className="mb-2 block text-sm font-bold text-[#1a1a1f]">Topic</span><input required value={form.topic} onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))} className="w-full rounded-xl border border-[#dedee3] px-3 py-2.5 text-sm text-[#1a1a1f] focus:border-[#3f6f57] focus:ring-4 focus:ring-[#3f6f57]/10" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-2 block text-sm font-bold text-[#1a1a1f]">Bloom level</span><select value={form.bloomLevel} onChange={(event) => setForm((current) => ({ ...current, bloomLevel: event.target.value }))} className="w-full rounded-xl border border-[#dedee3] bg-white px-3 py-2.5 text-sm text-[#1a1a1f] focus:border-[#3f6f57] focus:ring-4 focus:ring-[#3f6f57]/10">{bloomLevels.map((level) => <option key={level}>{level}</option>)}</select></label>
              <label className="block"><span className="mb-2 block text-sm font-bold text-[#1a1a1f]">Difficulty</span><select value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))} className="w-full rounded-xl border border-[#dedee3] bg-white px-3 py-2.5 text-sm text-[#1a1a1f] focus:border-[#3f6f57] focus:ring-4 focus:ring-[#3f6f57]/10">{difficulties.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select></label>
            </div>
          </div>
          <button type="submit" disabled={generating} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3f6f57] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(20, 20, 30,0.22)] transition hover:bg-[#315844] disabled:cursor-not-allowed disabled:opacity-60">{generating ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : null} Generate draft</button>
        </form>

        <section className="rounded-[1.75rem] border border-[#ececf0] bg-white p-5 shadow-[0_14px_34px_rgba(20, 20, 30,0.05)] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-[#ececf0] pb-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-heading text-xl font-bold text-[#1a1a1f]">Review queue</h2><p className="mt-1 text-sm text-[#52525b]">Showing the most recently updated records.</p></div><label className="inline-flex items-center gap-2 text-sm font-bold text-[#52525b]"><span className="sr-only">Question status</span><select value={status} onChange={(event) => setStatus(event.target.value as QuestionReviewStatus)} className="rounded-xl border border-[#dedee3] bg-white px-3 py-2 text-sm font-bold text-[#1a1a1f] focus:border-[#3f6f57] focus:ring-4 focus:ring-[#3f6f57]/10">{statusOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
          {error && <p className="mt-5 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700" role="alert"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</p>}
          {notice && <p className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800" role="status"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{notice}</p>}
          {loading ? <div className="grid min-h-56 place-items-center text-sm font-semibold text-[#52525b]"><span className="flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin text-[#3f6f57]" aria-hidden="true" /> Loading review queue</span></div> : records.length === 0 ? <p className="mt-5 rounded-xl bg-[#f4f4f6] px-4 py-8 text-center text-sm leading-6 text-[#52525b]">There are no {status.toLowerCase()} questions in this queue.</p> : <div className="mt-5 space-y-3">{records.map((record) => <article key={record.id} className="rounded-2xl border border-[#ececf0] bg-[#fffdfd] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-[#e7efe9] px-2.5 py-1 text-[#2c4c3d]">{record.status}</span><span className="rounded-full bg-[#f4f4f6] px-2.5 py-1 text-[#52525b]">{record.source === 'AI_GENERATED' ? 'AI draft' : 'Curated'}</span><span className="rounded-full bg-[#f4f4f6] px-2.5 py-1 text-[#52525b]">Quality {record.quality_score}</span></div><p className="mt-3 text-xs font-medium text-ink-mute">{record.chapter} · {record.bloom_level} · {record.difficulty}</p><h3 className="mt-1 text-sm font-bold leading-6 text-[#1a1a1f]">{record.question_text}</h3></div><div className="flex shrink-0 gap-2">{record.status !== 'PUBLISHED' && <button type="button" disabled={actingId === record.question_id} onClick={() => void updatePublication(record.question_id, 'PUBLISH')} className="inline-flex items-center gap-1.5 rounded-xl bg-[#3f6f57] px-3 py-2 text-xs font-bold text-white hover:bg-[#315844] disabled:opacity-60">{actingId === record.question_id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />} Publish</button>}{record.status !== 'ARCHIVED' && <button type="button" disabled={actingId === record.question_id} onClick={() => void updatePublication(record.question_id, 'ARCHIVE')} className="inline-flex items-center gap-1.5 rounded-xl border border-[#dedee3] px-3 py-2 text-xs font-bold text-[#52525b] hover:bg-[#f4f4f6] disabled:opacity-60"><Archive className="h-3.5 w-3.5" aria-hidden="true" /> Archive</button>}</div></div><details className="mt-4 rounded-xl bg-white"><summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-bold text-[#52525b]"><FilePenLine className="h-4 w-4 text-[#3f6f57]" aria-hidden="true" /> Review answer and explanation</summary><div className="border-t border-[#ececf0] p-3"><p className="text-xs font-medium text-ink-mute">Options</p><ul className="mt-2 space-y-1 text-sm text-[#52525b]">{record.options.map((option) => <li key={option}>{option}</li>)}</ul><p className="mt-4 text-[13px] font-medium text-emerald-700">Correct answer</p><p className="mt-1 text-sm font-semibold text-emerald-900">{record.correct_answer}</p><p className="mt-4 text-xs font-medium text-ink-mute">Explanation</p><p className="mt-1 text-sm leading-6 text-[#52525b]">{record.solution}</p></div></details></article>)}</div>}
        </section>
      </section>
    </div>
  );
}
