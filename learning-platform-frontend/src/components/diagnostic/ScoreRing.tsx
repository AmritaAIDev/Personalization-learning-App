"use client";

export default function ScoreRing({ score }: { score: number }) {
  const radius = 53;
  const circumference = 2 * Math.PI * radius;
  const boundedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (boundedScore / 100) * circumference;

  return (
    <div className="relative grid h-40 w-40 place-items-center">
      <svg
        className="h-40 w-40 -rotate-90"
        viewBox="0 0 128 128"
        role="img"
        aria-label={`Score: ${boundedScore}%`}
      >
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-white/20"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-[#a8c4b6] transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute font-heading text-4xl font-bold tracking-tight text-white">
        {boundedScore}%
      </span>
    </div>
  );
}
