'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Flame,
  Lock,
  Star,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useJourney, type JourneyNode, type Subtopic } from '@/context/JourneyContext';
import type { GrowthPayload } from '@/lib/growth-types';

type NodeState = 'completed' | 'current' | 'available' | 'locked';

interface PathNode {
  key: string;
  name: string;
  chapter: string;
  subject: string;
  state: NodeState;
  progress: number;
  indexInSubject: number;
  firstInChapter: boolean;
}

interface LaidNode extends PathNode {
  cx: number;
  cy: number;
  row: number;
}

// Snake-grid geometry: rows alternate direction and are joined by big looping
// curves, so the trail sweeps sideways rather than running straight down.
const TRACK_W = 380;
const CX = TRACK_W / 2;
const COLS = 2;
const COL_SPACING = 188;
const NODE_R = 34;
const ROW_GAP = 178;
const TOP_PAD = 88;

// Friendly cognitive levels — never shown as Bloom/"Recall" terminology.
const STAGES = [
  { short: 'Basics', title: 'Getting the essentials down', blurb: 'locking in the core facts' },
  { short: 'Ideas', title: 'Understanding the ideas', blurb: 'seeing how it all fits together' },
  { short: 'Problem-solving', title: 'Solving real problems', blurb: 'putting what you know to work' },
  { short: 'Mastery', title: 'Thinking it all through', blurb: 'reasoning like a pro' },
];
const BLOOM_INDEX: Record<string, number> = {
  Recall: 0,
  Comprehension: 1,
  Application: 2,
  'Higher-Order': 3,
};

// Varied muted tones for the living chapter markers — keeps the trail from
// feeling monochrome without any boxed background.
const MARKER_COLORS = ['#3f6f57', '#5b7a99', '#b07a5a', '#7a6aa3', '#c99a2e'];

function resolveState(sub: Subtopic, chapter: JourneyNode): NodeState {
  if (sub.state === 'completed' || chapter.state === 'completed') return 'completed';
  if (chapter.state === 'locked') return 'locked';
  if (sub.state === 'locked') return 'locked';
  return 'available';
}

function clampPct(value: number | null | undefined, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-surface px-3.5 py-2.5 hairline elevate-sm transition-transform duration-200 hover:-translate-y-0.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-tint text-primary">
        {icon}
      </span>
      <div className="min-w-0 leading-tight">
        <p className="font-heading text-base font-semibold text-ink">{value}</p>
        <p className="text-[11px] text-ink-mute">{label}</p>
      </div>
    </div>
  );
}

export default function JourneyMap() {
  const { user } = useAuth();
  const { journeyNodes, loading: journeyLoading } = useJourney();
  const [growth, setGrowth] = useState<GrowthPayload | null>(null);
  const [subject, setSubject] = useState<string | null>(null);

  const loadGrowth = useCallback(async () => {
    try {
      setGrowth(await apiFetch<GrowthPayload>('/api/learning/growth'));
    } catch {
      setGrowth(null);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void loadGrowth(), 0);
    return () => window.clearTimeout(t);
  }, [loadGrowth]);

  const subjects = useMemo(
    () => Array.from(new Set(journeyNodes.map((n) => n.subject))).filter(Boolean),
    [journeyNodes],
  );
  const activeSubject = subject ?? subjects[0] ?? null;

  const nodes = useMemo<PathNode[]>(() => {
    if (!activeSubject) return [];
    const chapters = journeyNodes.filter((n) => n.subject === activeSubject);
    const out: PathNode[] = [];
    let i = 0;
    for (const chapter of chapters) {
      const subs =
        chapter.subtopics && chapter.subtopics.length > 0
          ? chapter.subtopics
          : [{ name: chapter.name, score: chapter.score ?? null } as Subtopic];
      subs.forEach((sub, subIdx) => {
        const state = resolveState(sub, chapter);
        out.push({
          key: `${chapter.id}-${sub.id ?? sub.name}-${i}`,
          name: sub.name,
          chapter: chapter.name,
          subject: chapter.subject,
          state,
          progress: clampPct(sub.score, state === 'completed' ? 100 : 0),
          indexInSubject: i,
          firstInChapter: subIdx === 0,
        });
        i += 1;
      });
    }
    const currentIdx = out.findIndex((n) => n.state !== 'completed' && n.state !== 'locked');
    if (currentIdx >= 0) out[currentIdx].state = 'current';
    return out;
  }, [activeSubject, journeyNodes]);

  // Lay nodes into centred, direction-alternating rows (robust for 1 node or 100).
  const { laid, signposts, trackHeight } = useMemo(() => {
    const laidNodes: LaidNode[] = [];
    const posts: { name: string; cx: number; cy: number }[] = [];
    const rowCount = Math.ceil(nodes.length / COLS) || 1;
    for (let r = 0; r < rowCount; r += 1) {
      const rowNodes = nodes.slice(r * COLS, r * COLS + COLS);
      const k = rowNodes.length;
      const startX = CX - ((k - 1) * COL_SPACING) / 2;
      let xs = rowNodes.map((_, j) => startX + j * COL_SPACING);
      if (r % 2 === 1) xs = xs.slice().reverse();
      rowNodes.forEach((n, j) => {
        const cy = TOP_PAD + NODE_R + r * ROW_GAP;
        laidNodes.push({ ...n, cx: xs[j], cy, row: r });
        if (n.firstInChapter) posts.push({ name: n.chapter, cx: xs[j], cy });
      });
    }
    const lastRow = rowCount - 1;
    const height = TOP_PAD + NODE_R + lastRow * ROW_GAP + ROW_GAP + 40;
    return { laid: laidNodes, signposts: posts, trackHeight: height };
  }, [nodes]);

  const current = nodes.find((n) => n.state === 'current') ?? null;
  const completedCount = nodes.filter((n) => n.state === 'completed').length;
  const mastered = nodes.length > 0 && completedCount === nodes.length;
  const band = growth?.overall.band ?? 'Beginner';
  const score = growth?.overall.score ?? 0;
  const onTrack = growth?.overall.positiveStreak ?? 0;
  const stageIndex =
    growth && growth.topics.length > 0
      ? growth.topics.reduce((max, t) => Math.max(max, BLOOM_INDEX[t.bloomLevel] ?? 0), 0)
      : 0;
  const stage = STAGES[stageIndex];
  const summitY = trackHeight - 78;

  const nodeHref = (n: PathNode) =>
    `/learn?subject=${encodeURIComponent(n.subject)}&chapter=${encodeURIComponent(
      n.chapter,
    )}&topic=${encodeURIComponent(n.name)}&tab=practice`;

  if (journeyLoading) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10">
        <div className="h-28 rounded-3xl skeleton" />
        <div className="mt-10 flex flex-wrap justify-center gap-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 w-16 rounded-full skeleton" />
          ))}
        </div>
      </div>
    );
  }

  // Connector segments — generous arcs within a row, dramatic looping hooks on
  // the row turns. Everything the learner hasn't reached yet is a dotted trail.
  const segments: { key: string; d: string; reached: boolean; order: number }[] = [];
  for (let idx = 1; idx < laid.length; idx += 1) {
    const prev = laid[idx - 1];
    const node = laid[idx];
    let d: string;
    if (prev.row === node.row) {
      const midX = (prev.cx + node.cx) / 2;
      const bow = (node.row % 2 === 0 ? -1 : 1) * 52;
      d = `M ${prev.cx} ${prev.cy} Q ${midX} ${prev.cy + bow}, ${node.cx} ${node.cy}`;
    } else {
      // Big outward hook on the row turn — sweeps well past the column, almost a loop.
      const side = prev.cx >= CX ? 1 : -1;
      const over = 86 * side;
      d = `M ${prev.cx} ${prev.cy} C ${prev.cx + over} ${
        prev.cy + ROW_GAP * 0.32
      }, ${node.cx + over} ${node.cy - ROW_GAP * 0.32}, ${node.cx} ${node.cy}`;
    }
    segments.push({
      key: node.key,
      d,
      reached: node.state === 'completed' || node.state === 'current',
      order: idx,
    });
  }
  // Dotted trail onward to the summit.
  if (laid.length > 0) {
    const last = laid[laid.length - 1];
    segments.push({
      key: 'summit',
      d: `M ${last.cx} ${last.cy} C ${last.cx} ${last.cy + ROW_GAP * 0.42}, ${CX} ${
        summitY - ROW_GAP * 0.42
      }, ${CX} ${summitY}`,
      reached: mastered,
      order: laid.length,
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:py-10">
      <header className="animate-rise">
        <p className="text-[13px] font-medium text-ink-mute">Your journey</p>
        <h1 className="mt-1 font-heading text-[1.9rem] font-semibold tracking-tight text-ink">
          Keep climbing, {user?.name?.split(' ')[0] || 'learner'}.
        </h1>
      </header>

      {subjects.length > 1 ? (
        <div className="mt-5 flex flex-wrap gap-2 animate-rise" style={{ animationDelay: '40ms' }}>
          {subjects.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                s === activeSubject
                  ? 'bg-ink text-white'
                  : 'bg-surface text-ink-soft hairline hover:text-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <section
        className="mt-5 overflow-hidden rounded-3xl bg-ink p-6 text-white animate-rise elevate"
        style={{ animationDelay: '80ms' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-white/55">
              {current ? "Where you're headed next" : 'Your path is ready'}
            </p>
            <h2 className="mt-1 truncate font-heading text-2xl font-semibold">
              {current ? current.name : activeSubject ?? 'Start exploring'}
            </h2>
            {current ? (
              <p className="mt-1 text-[13px] text-white/60">in {current.chapter}</p>
            ) : null}
          </div>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-white animate-bob">
            <Star className="h-6 w-6 fill-white" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-4 text-[13.5px] leading-6 text-white/75">
          {completedCount > 0
            ? `${completedCount} step${completedCount === 1 ? '' : 's'} behind you and climbing — you're a ${band.toLowerCase()} with real momentum.`
            : "Every expert started at step one. You're already here — that's the hardest part done."}
        </p>
        {current ? (
          <Link
            href={nodeHref(current)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink transition duration-200 hover:-translate-y-0.5"
          >
            Continue this step
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatChip icon={<Zap className="h-4 w-4" />} label="XP earned" value={user?.xp ?? 0} />
        <StatChip icon={<TrendingUp className="h-4 w-4" />} label="Competency" value={score} />
        <StatChip icon={<Flame className="h-4 w-4" />} label="On track" value={onTrack} />
        <StatChip
          icon={<Trophy className="h-4 w-4" />}
          label="Steps cleared"
          value={completedCount}
        />
      </div>

      {/* Friendly thinking stage. */}
      <section
        className="mt-4 rounded-2xl bg-surface p-5 hairline elevate-sm animate-rise"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] font-medium text-ink-mute">How you&apos;re thinking</p>
          <p className="text-[12px] font-medium text-primary">{stage.short}</p>
        </div>
        <div className="mt-3 flex gap-1.5">
          {STAGES.map((s, i) => (
            <div key={s.short} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors duration-500 ${
                  i <= stageIndex ? 'bg-primary' : 'bg-black/[0.08]'
                }`}
              />
              <p
                className={`mt-1.5 truncate text-[10px] font-medium ${
                  i === stageIndex ? 'text-ink' : 'text-ink-mute'
                }`}
              >
                {s.short}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[15px] font-semibold text-ink">{stage.title}</p>
        <p className="mt-0.5 text-[13px] leading-5 text-ink-soft">
          Right now you&apos;re {stage.blurb} — and every round nudges you further.
        </p>
      </section>

      {/* The trail. */}
      {nodes.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-surface p-6 text-center text-sm text-ink-soft hairline">
          Your learning path appears here once your curriculum is set up.
        </p>
      ) : (
        <div
          className="relative mx-auto mt-8"
          style={{ width: TRACK_W, height: trackHeight }}
        >
          <svg
            className="absolute inset-0"
            width={TRACK_W}
            height={trackHeight}
            viewBox={`0 0 ${TRACK_W} ${trackHeight}`}
            fill="none"
            aria-hidden="true"
          >
            {segments.map((seg) =>
              seg.reached ? (
                <path
                  key={seg.key}
                  d={seg.d}
                  stroke="#3f6f57"
                  strokeWidth={5}
                  strokeLinecap="round"
                  pathLength={1}
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: 1,
                    animation: 'draw-path 0.7s var(--ease-out-soft) forwards',
                    animationDelay: `${120 + seg.order * 80}ms`,
                  }}
                />
              ) : (
                <path
                  key={seg.key}
                  d={seg.d}
                  stroke="#c9ced6"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeDasharray="1 13"
                />
              ),
            )}
          </svg>

          {/* Living, colourful organic chapter markers, floating above their first node. */}
          {signposts.map((post, i) => (
            <div
              key={`${post.name}-${i}`}
              className="animate-fade absolute z-10"
              style={{ left: post.cx, top: post.cy - 76, transform: 'translateX(-50%)' }}
            >
              <div
                className="animate-blob px-4 py-2 text-white shadow-[0_10px_22px_rgba(20,20,30,0.16)]"
                style={{
                  background: MARKER_COLORS[i % MARKER_COLORS.length],
                  animationDelay: `${i * -1700}ms`,
                }}
              >
                <span className="whitespace-nowrap text-[12px] font-semibold">{post.name}</span>
              </div>
            </div>
          ))}

          {/* Nodes with progress rings. */}
          {laid.map((node, idx) => (
            <div
              key={node.key}
              className="absolute z-20"
              style={{ left: node.cx, top: node.cy, transform: 'translate(-50%, -50%)' }}
            >
              {node.state === 'current' && !node.firstInChapter ? (
                <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-white shadow-[0_6px_16px_rgba(63,111,87,0.35)]">
                  You&apos;re here
                </span>
              ) : null}
              <NodeMarker node={node} href={nodeHref(node)} order={idx} />
              <span
                className={`absolute left-1/2 top-full mt-2 w-24 -translate-x-1/2 text-center text-[11px] font-medium leading-tight ${
                  node.state === 'locked' ? 'text-ink-mute' : 'text-ink-soft'
                }`}
              >
                {node.name}
              </span>
            </div>
          ))}

          {/* Golden summit. */}
          <div
            className="absolute z-20 flex -translate-x-1/2 flex-col items-center"
            style={{ left: CX, top: summitY }}
          >
            <span
              className={`animate-pop grid h-16 w-16 place-items-center rounded-full transition-transform duration-200 hover:scale-105 ${
                mastered ? 'text-white shadow-[0_10px_28px_rgba(201,160,60,0.4)]' : 'bg-surface hairline'
              }`}
              style={mastered ? { background: 'linear-gradient(145deg,#e7c65b,#c99a2e)' } : undefined}
            >
              <Trophy
                className="h-7 w-7"
                aria-hidden="true"
                style={mastered ? undefined : { color: '#c9b878' }}
              />
            </span>
            <span className="mt-2 text-[12px] font-medium text-ink-soft">
              {mastered ? 'Subject mastered' : 'Summit awaits'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function NodeMarker({
  node,
  href,
  order,
}: {
  node: PathNode;
  href: string;
  order: number;
}) {
  const SIZE = 74;
  const R = 33;
  const circ = 2 * Math.PI * R;
  const pct = node.progress;
  const dashoffset = circ * (1 - pct / 100);
  const delay = { animationDelay: `${order * 60}ms` } as const;

  const bodyClass =
    node.state === 'completed'
      ? 'bg-primary text-white'
      : node.state === 'current'
        ? 'bg-primary text-white'
        : node.state === 'available'
          ? 'bg-surface text-ink'
          : 'bg-canvas text-ink-mute';

  const center =
    node.state === 'completed' ? (
      <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
    ) : node.state === 'locked' ? (
      <Lock className="h-5 w-5" aria-hidden="true" />
    ) : pct > 0 ? (
      <span className="font-heading text-[13px] font-semibold leading-none">{pct}%</span>
    ) : (
      <Star className="h-6 w-6" aria-hidden="true" />
    );

  const marker = (
    <span
      className={`animate-pop relative grid place-items-center transition-transform duration-200 hover:scale-110 ${
        node.state === 'current' ? 'scale-110' : ''
      }`}
      style={{ width: SIZE, height: SIZE, ...delay }}
    >
      {/* Progress ring. */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        fill="none"
      >
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="#ececf0" strokeWidth={4} />
        {node.state !== 'locked' && pct > 0 ? (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="#3f6f57"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 900ms var(--ease-out-soft)' }}
          />
        ) : null}
      </svg>
      {/* Body. */}
      <span
        className={`grid place-items-center rounded-full ${bodyClass} ${
          node.state === 'current'
            ? 'shadow-[0_10px_24px_rgba(63,111,87,0.4)]'
            : node.state === 'completed'
              ? 'shadow-[0_6px_16px_rgba(63,111,87,0.26)]'
              : 'hairline'
        }`}
        style={{ width: SIZE - 16, height: SIZE - 16 }}
      >
        {center}
      </span>
    </span>
  );

  if (node.state === 'locked') return marker;
  return (
    <Link href={href} aria-label={`${node.name} — ${pct}% complete`}>
      {marker}
    </Link>
  );
}
