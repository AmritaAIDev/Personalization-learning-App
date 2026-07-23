'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Flame, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type {
  CompetencyBand,
  GrowthPayload,
  GrowthPoint,
} from '@/lib/growth-types';

const BANDS: CompetencyBand[] = ['Beginner', 'Developing', 'Proficient', 'Advanced'];

function bandIndex(band: CompetencyBand): number {
  return Math.max(0, BANDS.indexOf(band));
}

/** Smooth-ish area path for the mastery timeline. */
function buildAreaPath(points: GrowthPoint[], width: number, height: number) {
  if (points.length === 0) return { line: '', area: '' };
  const max = Math.max(points.length - 1, 1);
  const coords = points.map((point, index) => {
    const x = (index / max) * width;
    const y = height - (point.masteryPercent / 100) * height;
    return [x, y] as const;
  });
  const line = coords
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  return { line, area };
}

function ScoreRing({ score, band }: { score: number; band: CompetencyBand }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative grid h-[132px] w-[132px] shrink-0 place-items-center">
      <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
        <circle cx="66" cy="66" r={radius} fill="none" stroke="#ececf0" strokeWidth="9" />
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke="#3f6f57"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-heading text-[2rem] font-semibold leading-none text-ink">
          {score}
        </span>
        <span className="mt-1 text-[11px] font-medium text-ink-mute">{band}</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-ink-soft">{label}</span>
        <span className="font-medium text-ink">{Math.round(value * 100)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full bg-primary/80 transition-[width] duration-700"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function GrowthPanel() {
  const [data, setData] = useState<GrowthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await apiFetch<GrowthPayload>('/api/learning/growth');
      setData(next);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Growth could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const chart = useMemo(
    () => buildAreaPath(data?.timeline ?? [], 320, 96),
    [data?.timeline],
  );

  if (loading) {
    return (
      <section className="mt-14">
        <div className="h-5 w-40 rounded-full skeleton" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="h-56 rounded-2xl bg-surface hairline elevate-sm" />
          <div className="h-56 rounded-2xl bg-surface hairline elevate-sm" />
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="mt-14">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink">
          Your growth
        </h2>
        <p className="mt-4 rounded-2xl bg-surface p-5 text-sm text-ink-soft hairline">
          {error ?? 'Growth is not available yet.'}
        </p>
      </section>
    );
  }

  const { overall, topics, timeline } = data;
  const hasTrend = timeline.length >= 2;

  return (
    <section className="mt-14">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-ink">
          Your growth
        </h2>
        <span className="text-[13px] text-ink-mute">
          {overall.topicsTracked} topic{overall.topicsTracked === 1 ? '' : 's'} in motion
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Competency score + band ladder — the confidence anchor. */}
        <section className="rounded-2xl bg-surface p-6 hairline elevate-sm">
          <div className="flex items-center gap-6">
            <ScoreRing score={overall.score} band={overall.band} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-ink-mute">Competency</p>
              {/* Band ladder — an aspirational path, current rung filled. */}
              <div className="mt-3 space-y-1.5">
                {BANDS.map((band, index) => {
                  const reached = index <= bandIndex(overall.band);
                  return (
                    <div key={band} className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          reached ? 'bg-primary' : 'bg-black/[0.12]'
                        }`}
                      />
                      <span
                        className={`text-[13px] ${
                          index === bandIndex(overall.band)
                            ? 'font-semibold text-ink'
                            : reached
                              ? 'text-ink-soft'
                              : 'text-ink-mute'
                        }`}
                      >
                        {band}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-canvas p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-ink-mute">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                Momentum
              </div>
              <p className="mt-1 font-heading text-lg font-semibold text-ink">
                {overall.momentum > 0 ? '+' : ''}
                {overall.momentum}
                <span className="ml-0.5 text-xs font-normal text-ink-mute">pts</span>
              </p>
            </div>
            <div className="rounded-xl bg-canvas p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-ink-mute">
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                On track
              </div>
              <p className="mt-1 font-heading text-lg font-semibold text-ink">
                {overall.positiveStreak}
                <span className="ml-0.5 text-xs font-normal text-ink-mute">
                  round{overall.positiveStreak === 1 ? '' : 's'}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Growth curve + skill breakdown. */}
        <section className="rounded-2xl bg-surface p-6 hairline elevate-sm">
          <p className="text-[13px] text-ink-mute">Mastery over time</p>
          <div className="mt-3">
            {hasTrend ? (
              <svg viewBox="0 0 320 96" className="h-24 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3f6f57" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#3f6f57" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={chart.area} fill="url(#growthFill)" />
                <path
                  d={chart.line}
                  fill="none"
                  stroke="#3f6f57"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <div className="flex h-24 items-center justify-center rounded-xl bg-canvas text-center text-[13px] text-ink-mute">
                Your growth curve draws itself as you finish rounds.
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <BreakdownBar label="Accuracy" value={overall.breakdown.accuracy} />
            <BreakdownBar label="Difficulty reached" value={overall.breakdown.difficulty} />
            <BreakdownBar label="Cognitive depth" value={overall.breakdown.bloom} />
            <BreakdownBar
              label="Consistency"
              value={overall.breakdown.consistency || overall.breakdown.accuracy}
            />
          </div>
        </section>
      </div>

      {/* Per-topic competency. */}
      {topics.length > 0 ? (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {topics.map((topic) => (
            <div
              key={`${topic.subject}-${topic.chapter}-${topic.topic}`}
              className="rounded-2xl bg-surface p-4 hairline elevate-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{topic.topic}</p>
                  <p className="mt-0.5 text-xs text-ink-mute">
                    {topic.bloomLevel} · {topic.difficulty}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-medium text-primary">
                  {topic.band}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                  <span
                    className="block h-full rounded-full bg-primary transition-[width] duration-700"
                    style={{ width: `${topic.score}%` }}
                  />
                </span>
                <span className="flex items-center gap-0.5 text-xs font-medium text-ink">
                  {topic.score}
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
