'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  LoaderCircle,
  Save,
  Send,
} from 'lucide-react';
import QuestionCard from '@/components/QuestionCard';
import { apiFetch } from '@/lib/api';
import { elapsedPracticeSeconds, type PracticeScope } from '@/lib/practice';
import type { PracticeAttemptPayload } from '@/lib/practice-types';

export default function PracticeSession({ scope }: { scope: PracticeScope }) {
  const router = useRouter();
  const started = useRef(false);
  const [payload, setPayload] = useState<PracticeAttemptPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrResume = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PracticeAttemptPayload>('/api/practice/sessions', {
        method: 'POST',
        body: JSON.stringify(scope),
      });
      if (data.attempt.status === 'SUBMITTED') {
        router.replace(`/practice/${data.attempt.id}/review`);
        return;
      }
      setPayload(data);
      setAnswers(
        Object.fromEntries(
          data.answers.map((answer) => [answer.questionId, answer.selectedOption]),
        ),
      );
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The practice session could not be prepared.',
      );
    } finally {
      setLoading(false);
    }
  }, [router, scope]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void createOrResume();
  }, [createOrResume]);

  const saveSelection = async (selectedOption: string) => {
    const question = payload?.questions[currentIndex];
    if (!payload || !question || savingQuestionId || submitting) return;

    const previousOption = answers[question.id];
    setAnswers((current) => ({ ...current, [question.id]: selectedOption }));
    setSavingQuestionId(question.id);
    setError(null);

    try {
      await apiFetch(
        `/api/practice/sessions/${payload.attempt.id}/answers/${question.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            selectedOption,
            elapsedSeconds: elapsedPracticeSeconds(payload.attempt.startedAt),
          }),
        },
      );
    } catch (reason) {
      setAnswers((current) => {
        const restored = { ...current };
        if (previousOption === undefined) delete restored[question.id];
        else restored[question.id] = previousOption;
        return restored;
      });
      setError(
        reason instanceof Error ? reason.message : 'Your answer could not be saved.',
      );
    } finally {
      setSavingQuestionId(null);
    }
  };

  const submit = async () => {
    if (!payload || submitting || savingQuestionId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/practice/sessions/${payload.attempt.id}/submit`, {
        method: 'POST',
      });
      router.replace(`/practice/${payload.attempt.id}/review`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The practice session could not be submitted.',
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-sm font-semibold text-[#6b6e75]">
        <span className="flex items-center gap-3">
          <LoaderCircle className="h-5 w-5 animate-spin text-[#e31540]" aria-hidden="true" />
          Preparing your balanced practice set…
        </span>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center">
        <CircleAlert className="h-9 w-9 text-[#e31540]" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-[#313337]">We could not open this practice set</h1>
        <p className="mt-2 text-sm leading-6 text-[#6b6e75]">{error ?? 'The selected topic is not available right now.'}</p>
        <button type="button" onClick={() => void createOrResume()} className="mt-6 rounded-xl bg-[#e31540] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#c61137]">
          Try again
        </button>
      </div>
    );
  }

  const question = payload.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isSavingCurrent = savingQuestionId === question.id;
  const isLastQuestion = currentIndex === payload.questions.length - 1;

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <header className="flex flex-col gap-5 border-b border-[#e8e2e4] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e31540]">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Reviewed practice
          </p>
          <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#313337] sm:text-3xl">{payload.attempt.title}</h1>
          <p className="mt-2 text-sm text-[#6b6e75]">{scope.chapter} · {answeredCount}/{payload.attempt.totalQuestions} answers saved</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start text-xs font-bold">
          <span className="rounded-full bg-[#f9e5ea] px-3 py-2 text-[#a61231]">5 Easy</span>
          <span className="rounded-full bg-[#f4f5f7] px-3 py-2 text-[#55585f]">5 Medium</span>
          <span className="rounded-full bg-[#313337] px-3 py-2 text-white">5 Hard</span>
        </div>
      </header>

      {error && (
        <p className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-[#f9e5ea] px-3 py-1.5 text-[#a61231]">{question.difficulty}</span>
              <span className="rounded-full bg-[#f4f5f7] px-3 py-1.5 text-[#55585f]">{question.bloomLevel}</span>
              <span className="rounded-full bg-[#f4f5f7] px-3 py-1.5 text-[#55585f]">{question.marks} marks</span>
            </div>
            <p className="text-sm font-semibold text-[#6b6e75]">Question {currentIndex + 1} of {payload.questions.length}</p>
          </div>

          <QuestionCard
            questionText={question.questionText}
            options={question.options}
            selectedOption={answers[question.id]}
            disabled={isSavingCurrent || submitting}
            onSelect={(option) => void saveSelection(option)}
          />

          <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#6b6e75]" aria-live="polite">
            {isSavingCurrent ? <LoaderCircle className="h-4 w-4 animate-spin text-[#e31540]" aria-hidden="true" /> : <Save className="h-4 w-4 text-[#e31540]" aria-hidden="true" />}
            {isSavingCurrent ? 'Saving your answer…' : answers[question.id] ? 'Answer saved securely.' : 'Choose an answer to save it.'}
          </p>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#ece7e8] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0 || submitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dcdde0] px-4 py-2.5 text-sm font-bold text-[#55585f] transition hover:bg-[#f7f4f5] disabled:cursor-not-allowed disabled:opacity-50">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Previous
            </button>
            {isLastQuestion ? (
              <button type="button" onClick={() => void submit()} disabled={submitting || savingQuestionId !== null} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e31540] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(227,21,64,0.22)] transition hover:bg-[#c61137] disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <>Submit practice <Send className="h-4 w-4" aria-hidden="true" /></>}
              </button>
            ) : (
              <button type="button" onClick={() => setCurrentIndex((index) => Math.min(payload.questions.length - 1, index + 1))} disabled={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#313337] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#4a4b50] disabled:cursor-not-allowed disabled:opacity-60">
                Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </section>

        <aside className="rounded-[1.75rem] border border-[#e8e1e3] bg-white p-5 shadow-[0_14px_34px_rgba(49,51,55,0.05)] xl:self-start">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold text-[#313337]">Question map</h2>
            <span className="text-xs font-semibold text-[#6b6e75]">{answeredCount} saved</span>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2" aria-label="Question navigation">
            {payload.questions.map((item, index) => {
              const isCurrent = index === currentIndex;
              const isAnswered = Boolean(answers[item.id]);
              return (
                <button key={item.id} type="button" onClick={() => setCurrentIndex(index)} disabled={submitting} aria-label={`Go to question ${index + 1}${isAnswered ? ', answered' : ''}`} aria-current={isCurrent ? 'step' : undefined} className={`grid aspect-square place-items-center rounded-lg text-xs font-bold transition ${isCurrent ? 'bg-[#e31540] text-white ring-2 ring-[#f7b9c8]' : isAnswered ? 'bg-[#e8f5ed] text-[#166534] hover:bg-[#d8f0e1]' : 'bg-[#f4f5f7] text-[#6b6e75] hover:bg-[#e7e8ea]'}`}>
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-6 space-y-2 border-t border-[#ece7e8] pt-5 text-xs text-[#6b6e75]">
            <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Answer saved</p>
            <p>Results and explanations unlock only after submission.</p>
          </div>
          <button type="button" onClick={() => void submit()} disabled={submitting || savingQuestionId !== null} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#f2b6c5] bg-[#fff5f7] px-4 py-2.5 text-sm font-bold text-[#a61231] transition hover:bg-[#f9e5ea] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />} Submit now
          </button>
        </aside>
      </div>
    </div>
  );
}
